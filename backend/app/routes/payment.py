"""
payment.py — Production-grade Razorpay API routes.

DUAL VERIFICATION ARCHITECTURE:
  - POST /payment/create-order  → Creates order + returns key for frontend checkout
  - POST /payment/verify        → User browser callback path
  - POST /payment/webhook       → Server-to-server webhook path (NO auth)
  - GET  /payment/scans         → User's remaining scan balance
  - GET  /payment/history       → User's payment history
  - GET  /payment/plans         → Public plan listing

Webhook endpoint deliberately has NO auth — Razorpay signs the payload
with a shared secret. We verify the HMAC signature before processing.
"""

from __future__ import annotations
import os
import logging
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.auth_deps import require_user
from app.models.user import User
from app.services.payment_service import (
    create_order,
    verify_payment_callback,
    process_webhook,
    get_user_scans,
    get_payment_history,
    PLANS,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/payment", tags=["Payment"])


# ─────────────────────────────────────────────────────────────────────────────
# SCHEMAS
# ─────────────────────────────────────────────────────────────────────────────

class CreateOrderRequest(BaseModel):
    plan_type: str = Field(
        ..., pattern=r"^(reviewer|jd|hunter)$",
        description="One of: reviewer, jd, hunter",
    )


class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str = Field(..., min_length=10, max_length=64)
    razorpay_payment_id: str = Field(..., min_length=10, max_length=64)
    razorpay_signature: str = Field(..., min_length=10, max_length=256)


# ─────────────────────────────────────────────────────────────────────────────
# ROUTES
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/plans")
def list_plans():
    """Public: list available plans with pricing (no auth required)."""
    return {
        key: {
            "label": info["label"],
            "description": info["description"],
            "amount": info["amount"],
            "scans": info["scans"],
            "price_rupees": info["amount"] / 100,
        }
        for key, info in PLANS.items()
    }


@router.post(
    "/create-order",
    summary="Create a Razorpay order",
    description=(
        "Creates a Razorpay order and persists a Payment record in 'created' state. "
        "Returns the order_id and key_id the frontend needs to open the checkout."
    ),
    responses={
        200: {
            "description": "Order created successfully",
            "content": {
                "application/json": {
                    "example": {
                        "order_id": "order_Oi7M5L8X9Y0A1B",
                        "amount": 4900,
                        "currency": "INR",
                        "plan_type": "reviewer",
                        "scans": 20,
                        "key_id": "rzp_test_...",
                    }
                }
            },
        },
        400: {"description": "Invalid plan type"},
        401: {"description": "Authentication required"},
    },
)
def create_payment_order(
    req: CreateOrderRequest,
    db: Session = Depends(get_db),
    user: User = Depends(require_user),
):
    """Create a Razorpay order for the selected scan pack."""
    try:
        return create_order(req.plan_type, user.id, db)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.exception("Order creation failed unexpectedly")
        raise HTTPException(status_code=500, detail="Failed to initiate payment")


@router.post(
    "/verify",
    summary="Verify payment and credit scans (browser callback)",
    description=(
        "Verifies payment signature + fetches payment from Razorpay API to confirm "
        "it was actually captured. Credits scans to the user on success. "
        "IDEMPOTENT: safe to call multiple times — scans credited exactly once."
    ),
    responses={
        200: {
            "description": "Payment verified and scans credited",
            "content": {
                "application/json": {
                    "example": {
                        "status": "success",
                        "plan_type": "reviewer",
                        "scans_credited": 20,
                        "verification_source": "callback",
                    }
                }
            },
        },
        400: {"description": "Verification failed"},
    },
)
def verify_payment_route(
    req: VerifyPaymentRequest,
    db: Session = Depends(get_db),
    user: User = Depends(require_user),
):
    """Verify payment via browser callback and credit scans."""
    try:
        result = verify_payment_callback(
            razorpay_order_id=req.razorpay_order_id,
            razorpay_payment_id=req.razorpay_payment_id,
            razorpay_signature=req.razorpay_signature,
            db=db,
        )
        if result.get("status") == "error":
            raise HTTPException(status_code=400, detail=result.get("detail", "Verification failed"))
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Payment verification failed unexpectedly")
        raise HTTPException(status_code=500, detail="Payment verification failed")


@router.post(
    "/webhook",
    summary="Razorpay webhook handler (server-to-server)",
    description=(
        "Called by Razorpay server-side when payment events occur. "
        "NO auth — verified via HMAC signature using RAZORPAY_WEBHOOK_SECRET. "
        "Processes payment.captured events by crediting scans. "
        "IDEMPOTENT: scans credited exactly once regardless of duplicate webhooks."
    ),
    include_in_schema=False,  # hidden from Swagger since it's server-to-server
)
async def webhook_handler(request: Request, db: Session = Depends(get_db)):
    """
    Handle incoming Razorpay webhook events.

    This endpoint has NO auth middleware — security is via HMAC signature
    verification against RAZORPAY_WEBHOOK_SECRET.

    Only processes 'payment.captured' events. All other events are
    acknowledged but ignored (returns 200 so Razorpay stops retrying).
    """
    webhook_secret = os.getenv("RAZORPAY_WEBHOOK_SECRET", "")

    # Read raw body — we need the exact bytes for HMAC verification
    payload_bytes = await request.body()
    razorpay_signature = request.headers.get("x-razorpay-signature", "")

    if not razorpay_signature:
        logger.warning("Webhook: missing x-razorpay-signature header")
        raise HTTPException(status_code=400, detail="Missing signature header")

    try:
        result = process_webhook(
            payload_bytes=payload_bytes,
            razorpay_signature=razorpay_signature,
            webhook_secret=webhook_secret,
            db=db,
        )

        if result.get("status") == "error":
            logger.error(f"Webhook processing error: {result.get('detail')}")
            # Return 200 so Razorpay doesn't retry on our validation errors
            return {"status": "error", "detail": result.get("detail")}

        return result

    except Exception as e:
        logger.exception(f"Webhook handler error: {e}")
        # Always return 200 to prevent Razorpay retries
        return {"status": "error", "detail": "Internal error"}


@router.get(
    "/scans",
    summary="Get remaining scan balance",
    description="Returns the authenticated user's scan balance for each plan type.",
)
def check_scans(
    db: Session = Depends(get_db),
    user: User = Depends(require_user),
):
    """Get the user's remaining scan balance."""
    return get_user_scans(user.id, db)


@router.get(
    "/history",
    summary="Get user payment history",
    description="Returns the authenticated user's past payment transactions for reconciliation.",
)
def payment_history(
    db: Session = Depends(get_db),
    user: User = Depends(require_user),
    limit: int = 20,
    offset: int = 0,
):
    """Get the user's payment transaction history."""
    return get_payment_history(user.id, db, limit=limit, offset=offset)
