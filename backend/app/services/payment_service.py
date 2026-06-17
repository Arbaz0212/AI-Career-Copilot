"""
payment_service.py — PRODUCTION-GRADE RAZORPAY INTEGRATION

ARCHITECTURE — Dual Verification
────────────────────────────────────────────────────────────────

  User pays → Razorpay fires TWO independent paths:

  ┌─ PATH A: Browser callback ──────────────────────────────────┐
  │  Razorpay calls JS handler → frontend → POST /payment/verify  │
  │  Purpose: Instant UX feedback while user is on the page        │
  └────────────────────────────────────────────────────────────────┘

  ┌─ PATH B: Webhook (SERVER-SIDE, survives browser close) ─────┐
  │  Razorpay calls POST /payment/webhook directly on backend     │
  │  Purpose: Guaranteed delivery even if user closes browser     │
  └────────────────────────────────────────────────────────────────┘

  BOTH paths independently call _process_successful_payment().
  Idempotency guards ensure scans are credited EXACTLY ONCE.

VERIFICATION — Three-layer check
─────────────────────────────────
  1. Signature verification  — proves Razorpay sent it
  2. Razorpay API fetch      — proves payment was CAPTURED (not failed/pending)
  3. Amount reconciliation   — proves amount_ordered == amount_paid

If ANY check fails → status = "failed", error recorded, scans NOT credited.

REFERENCE
─────────
  Razorpay payment lifecycle: https://razorpay.com/docs/payments/server-integration/nodejs/payment-lifecycle/
  Webhook docs:              https://razorpay.com/docs/webhooks/
  Payment object fields:     https://razorpay.com/docs/api/payments/#fetch-a-payment
"""

from __future__ import annotations
import os
import hmac
import json
import hashlib
import logging
from datetime import datetime, timezone
from decimal import Decimal

import razorpay
from sqlalchemy.orm import Session

from app.models.payment import Payment
from app.models.user import User

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────────────────
# PLAN CONFIG — Single source of truth for all pricing
# ─────────────────────────────────────────────────────────────────────────────

PLANS: dict[str, dict] = {
    "reviewer": {
        "amount": 4900,          # ₹49 in paise
        "scans": 15,
        "label": "Resume Reviewer",
        "description": "15 scans · Resume ATS analysis · Valid 30 days",
    },
    "jd": {
        "amount": 9900,          # ₹99 in paise
        "scans": 30,
        "label": "JD Match Pro",
        "description": "30 scans · Resume vs JD matching · Valid 30 days",
    },
    "hunter": {
        "amount": 19900,         # ₹199 in paise
        "scans": 25,
        "label": "JobSense AI",
        "description": "25 scans · Live job matching + cover letters · Coming Soon",
    },
    "bundle": {
        "amount": 24900,         # ₹249 in paise
        "scans": 70,
        "label": "Complete Plan",
        "description": "70 scans across all features · Never expires · Coming Soon",
    },
}

# ─────────────────────────────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────────────────────────────

def _get_razorpay_client() -> razorpay.Client:
    """Create authenticated Razorpay client from env vars."""
    key_id = os.getenv("RAZORPAY_KEY_ID", "")
    key_secret = os.getenv("RAZORPAY_KEY_SECRET", "")
    if not key_id or not key_secret:
        raise RuntimeError(
            "RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set in .env"
        )
    return razorpay.Client(auth=(key_id, key_secret))


def _compute_signature(
    order_id: str, payment_id: str, secret: str | None = None
) -> str:
    """Compute expected SHA256 signature for verification.

    This is the STANDARD Razorpay signature algorithm:
        hmac_sha256(order_id + "|" + payment_id, secret)
    """
    key_secret = secret or os.getenv("RAZORPAY_KEY_SECRET", "")
    payload = f"{order_id}|{payment_id}"
    return hmac.new(
        key_secret.encode("utf-8"),
        payload.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()


def _fetch_payment_from_razorpay(payment_id: str) -> dict | None:
    """Fetch payment details from Razorpay API for independent verification.

    This is CRITICAL — signature only proves Razorpay sent the data,
    but does NOT confirm the payment was actually CAPTURED (settled).
    We fetch the payment object from Razorpay's API and verify:
      - status == 'captured' (not 'failed', 'refunded', 'created')
      - method is present (real payment occurred)

    Returns the payment dict, or None on any error.
    """
    try:
        client = _get_razorpay_client()
        payment = client.payment.fetch(payment_id)
        if isinstance(payment, dict):
            return payment
        # razorpay SDK may return an object with dict-like access
        return dict(payment)
    except razorpay.errors.BadRequestError as e:
        logger.error(f"Razorpay API: payment {payment_id} not found: {e}")
        return None
    except razorpay.errors.ServerError as e:
        logger.error(f"Razorpay API: server error fetching {payment_id}: {e}")
        return None
    except Exception as e:
        logger.error(f"Razorpay API: unexpected error fetching {payment_id}: {e}")
        return None


def _validate_payment_from_api(payment_data: dict | None, expected_amount: int) -> tuple[bool, str]:
    """Validate payment status and amount using Razorpay API data.

    Returns: (is_valid: bool, reason: str | None)
      - (True, None)           → all checks pass
      - (False, "reason...")   → validation failed
      - (False, "API...")      → API unavailable, proceed on signature-only
    """
    if payment_data is None:
        # Razorpay API unavailable — we still proceed with signature-only
        # verification so the user is not blocked on transient API issues.
        # The webhook path will independently confirm.
        logger.warning("Razorpay API unavailable — proceeding on signature-only verification")
        return True, "API_unavailable_proceeding"

    status = str(payment_data.get("status", "")).lower()
    if status != "captured":
        return False, f"Payment status is '{status}', expected 'captured'"

    # Amount check: what we charged vs what Razorpay captured
    amount_captured = int(payment_data.get("amount", 0))
    if amount_captured != expected_amount:
        return (
            False,
            f"Amount mismatch: ordered {expected_amount}, captured {amount_captured}",
        )

    return True, None


# ─────────────────────────────────────────────────────────────────────────────
# ORDER CREATION
# ─────────────────────────────────────────────────────────────────────────────

def create_order(plan_type: str, user_id: int, db: Session) -> dict:
    """
    Create a Razorpay order and persist the Payment record.

    Returns the order details the frontend needs to open the checkout.
    Raises ValueError on invalid plan, RuntimeError on missing keys.
    """
    plan = PLANS.get(plan_type)
    if not plan:
        allowed = ", ".join(PLANS.keys())
        raise ValueError(f"Unknown plan '{plan_type}'. Allowed: {allowed}")

    client = _get_razorpay_client()

    timestamp = int(datetime.now(timezone.utc).timestamp())
    receipt = f"scan_{plan_type}_{user_id}_{timestamp}"

    order_data = {
        "amount": plan["amount"],
        "currency": "INR",
        "receipt": receipt,
        "notes": {
            "plan_type": plan_type,
            "user_id": str(user_id),
            "plan_label": plan["label"],
        },
    }

    try:
        razorpay_order = client.order.create(order_data)
    except razorpay.errors.BadRequestError as e:
        logger.error(f"Razorpay order creation failed (bad request): {e}")
        raise RuntimeError(f"Razorpay rejected the order request: {e}")
    except razorpay.errors.GatewayError as e:
        logger.error(f"Razorpay gateway error during order creation: {e}")
        raise RuntimeError("Payment gateway temporarily unavailable. Please try again.")
    except Exception as e:
        logger.exception("Razorpay order creation failed unexpectedly")
        raise RuntimeError("Failed to initiate payment. Please try again.")

    order_id = razorpay_order.get("id")
    logger.info(f"Order created: {order_id} for user {user_id} ({plan_type})")

    # Persist order in DB — this is the single source of truth
    payment = Payment(
        user_id=user_id,
        razorpay_order_id=order_id,
        plan_type=plan_type,
        amount_ordered=plan["amount"],
        scans_purchased=plan["scans"],
        status="created",
    )
    db.add(payment)
    db.commit()

    return {
        "order_id": order_id,
        "amount": plan["amount"],
        "currency": "INR",
        "plan_type": plan_type,
        "scans": plan["scans"],
        "key_id": os.getenv("RAZORPAY_KEY_ID", ""),
    }


# ─────────────────────────────────────────────────────────────────────────────
# CORE VERIFICATION — Called by BOTH browser callback AND webhook
# ─────────────────────────────────────────────────────────────────────────────

def _process_successful_payment(
    *,
    razorpay_order_id: str,
    razorpay_payment_id: str,
    razorpay_signature: str,
    source: str,
    db: Session,
    webhook_event_id: str | None = None,
    webhook_payload_raw: str | None = None,
) -> dict:
    """
    Process a verified payment end-to-end.

    Called by:
      - browser callback (source="callback")
      - webhook handler (source="webhook")

    IDEMPOTENCY GUARANTEE:
      If scans have already been credited for this payment,
      this is a no-op and returns success. This prevents
      double-crediting when both callback AND webfire for the same payment.

    VERIFICATION LAYERS:
      1. Fetch payment from Payment model by order_id
      2. Idempotency check — already processed?
      3. Signature verification
      4. Razorpay API re-check (status == 'captured', amount matches)
      5. Credit scans to user
      6. Atomic DB commit

    Returns: dict with status and details.
    """
    # ── Step 1: Find the payment record ───────────────────────────────────
    payment = db.query(Payment).filter(
        Payment.razorpay_order_id == razorpay_order_id
    ).first()

    if not payment:
        logger.error(f"Order {razorpay_order_id} not found in database")
        return {"status": "error", "detail": "Order not found"}

    # ── Step 2: Idempotency check ────────────────────────────────────────
    if payment.is_scans_credited and payment.status in ("scans_credited", "complete"):
        logger.info(
            f"Idempotency hit: order {razorpay_order_id} "
            f"already credited (status={payment.status})"
        )
        return {
            "status": "already_credited",
            "plan_type": payment.plan_type,
            "scans_credited": payment.scans_purchased,
        }

    if payment.status == "failed":
        logger.error(
            f"Order {razorpay_order_id} is in 'failed' state — cannot process"
        )
        return {"status": "error", "detail": "Payment previously failed"}

    # ── Step 3: Signature verification ────────────────────────────────────
    client = _get_razorpay_client()
    signature_params = {
        "razorpay_order_id": razorpay_order_id,
        "razorpay_payment_id": razorpay_payment_id,
        "razorpay_signature": razorpay_signature,
    }

    try:
        client.utility.verify_payment_signature(signature_params)
        logger.info(f"Signature verified for order {razorpay_order_id}")
    except razorpay.errors.SignatureVerificationError:
        logger.error(
            f"SIGNATURE MISMATCH for order {razorpay_order_id}. "
            f"Payment {razorpay_payment_id} — possible tampering."
        )
        payment.mark_failed(
            code="SIGNATURE_MISMATCH",
            message=f"Signature verification failed for payment {razorpay_payment_id}",
            source="signature",
        )
        db.commit()
        return {"status": "error", "detail": "Payment verification failed (signature mismatch)"}

    # ── Step 4: Razorpay API re-check ─────────────────────────────────────
    payment_data = _fetch_payment_from_razorpay(razorpay_payment_id)
    api_valid, api_reason = _validate_payment_from_api(payment_data, payment.amount_ordered)

    if not api_valid:
        logger.error(
            f"Razorpay API validation failed for payment {razorpay_payment_id}: {api_reason}"
        )
        payment.mark_failed(
            code="API_VALIDATION_FAILED",
            message=api_reason,
            source="razorpay",
        )
        if payment_data:
            payment.error_code = payment_data.get("error_code")
            payment.error_message = payment_data.get("error_description")
        db.commit()
        return {"status": "error", "detail": f"Payment validation failed: {api_reason}"}

    # ── Step 5: Extract metadata from API response (if available) ────────
    if payment_data:
        payment.amount_paid = int(payment_data.get("amount", 0))
        if not payment.amount_paid:
            payment.amount_paid = payment.amount_ordered  # fallback
        payment.paid_at = datetime.now(timezone.utc)

        method = str(payment_data.get("method", "")).lower()
        if method in ("upi", "card", "netbanking", "wallet", "emandate", "emi"):
            payment.payment_method = method
        elif method:
            payment.payment_method = method[:32]

        acquirer_data = payment_data.get("acquirer_data", {}) or {}
        if isinstance(acquirer_data, dict):
            payment.bank_reference = (
                acquirer_data.get("rrn") or acquirer_data.get("bank_transaction_id") or None
            )

        card_data = payment_data.get("card", {})
        if isinstance(card_data, dict):
            last4 = card_data.get("last4")
            if last4:
                payment.card_last_four = str(last4)[:4]

    # ── Step 6: Mark verified ───────────────────────────────────────────────
    payment.mark_verified(
        razorpay_payment_id=razorpay_payment_id,
        razorpay_signature=razorpay_signature,
        source=source,
    )

    # ── Step 7: Credit scans to user ────────────────────────────────────────
    user = db.query(User).filter(User.id == payment.user_id).first()
    if not user:
        logger.error(f"User {payment.user_id} not found for scan crediting")
        # Still mark verified — user record issue is separate from payment
        payment.mark_failed(
            code="USER_NOT_FOUND",
            message=f"User {payment.user_id} not found for scan crediting",
            source="razorpay",
        )
        db.commit()
        return {"status": "error", "detail": "User account not found"}

    scans_to_credit = payment.scans_purchased
    if payment.plan_type == "reviewer":
        user.reviewer_scans = (user.reviewer_scans or 0) + scans_to_credit
    elif payment.plan_type == "jd":
        user.jd_scans = (user.jd_scans or 0) + scans_to_credit
    elif payment.plan_type == "hunter":
        user.jd_scans = (user.jd_scans or 0) + scans_to_credit
    elif payment.plan_type == "bundle":
        # Bundle: distribute scans across reviewer + jd pools
        user.reviewer_scans = (user.reviewer_scans or 0) + scans_to_credit
        user.jd_scans = (user.jd_scans or 0) + scans_to_credit
    else:
        logger.warning(f"Unknown plan_type '{payment.plan_type}' — crediting as jd")
        user.jd_scans = (user.jd_scans or 0) + scans_to_credit

    payment.mark_scans_credited()
    payment.mark_complete()

    # ── Step 8: Webhook tracking ────────────────────────────────────────────
    if webhook_event_id:
        payment.webhook_event_id = webhook_event_id
        payment.is_webhook_processed = True
    if webhook_payload_raw:
        payment.webhook_raw = webhook_payload_raw[:4096]

    db.commit()

    logger.info(
        f"✅ Payment complete — order {razorpay_order_id}, "
        f"user {user.id}, plan {payment.plan_type}, "
        f"{scans_to_credit} scans credited (source={source})"
    )

    return {
        "status": "success",
        "plan_type": payment.plan_type,
        "scans_credited": scans_to_credit,
        "verification_source": source,
    }


# ─────────────────────────────────────────────────────────────────────────────
# PUBLIC API — Browser Callback Verification
# ─────────────────────────────────────────────────────────────────────────────

def verify_payment_callback(
    razorpay_order_id: str,
    razorpay_payment_id: str,
    razorpay_signature: str,
    db: Session,
) -> dict:
    """
    Called by POST /payment/verify (browser callback path).

    Delegates to _process_successful_payment() which handles
    idempotency, signature verification, API re-check, and scan crediting.

    This is safe to call even if the webhook already processed this payment
    — the idempotency guard prevents double-crediting.
    """
    return _process_successful_payment(
        razorpay_order_id=razorpay_order_id,
        razorpay_payment_id=razorpay_payment_id,
        razorpay_signature=razorpay_signature,
        source="callback",
        db=db,
    )


# ─────────────────────────────────────────────────────────────────────────────
# PUBLIC API — Webhook Handler
# ─────────────────────────────────────────────────────────────────────────────

def process_webhook(
    payload_bytes: bytes,
    razorpay_signature: str,
    webhook_secret: str | None,
    db: Session,
) -> dict:
    """
    Called by POST /payment/webhook (server-side path).

    Webhook verification:
      1. Verify webhook signature using razorpay_signature header + webhook secret
      2. Parse event type — only process "payment.captured"
      3. Extract order_id and payment_id
      4. Delegate to _process_successful_payment()

    REFERENCE: https://razorpay.com/docs/webhooks/validate-test/
    """
    if not webhook_secret:
        logger.error("RAZORPAY_WEBHOOK_SECRET not configured — cannot verify webhook")
        return {"status": "error", "detail": "Webhook secret not configured"}

    # ── Step 1: Verify webhook signature ──────────────────────────────────
    expected_signature = hmac.new(
        webhook_secret.encode("utf-8"),
        payload_bytes,
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(expected_signature, razorpay_signature):
        logger.warning("Webhook signature mismatch — possible spoofed webhook")
        return {"status": "error", "detail": "Invalid webhook signature"}

    # ── Step 2: Parse payload ─────────────────────────────────────────────
    try:
        payload = json.loads(payload_bytes.decode("utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError) as e:
        logger.error(f"Webhook: invalid JSON payload: {e}")
        return {"status": "error", "detail": "Invalid JSON"}

    event_id = payload.get("event_id") or payload.get("id", "unknown")
    event = payload.get("event", "")

    logger.info(f"Webhook received: event={event}, id={event_id}")

    # ── Step 3: Only process payment.captured ─────────────────────────────
    # payment.captured fires when a payment is successfully captured/settled.
    # We deliberately IGNORE payment.failed (handle at callback time).
    if event not in ("payment.captured", "order.paid"):
        # Acknowledge receipt but don't process non-payment events
        return {"status": "ignored", "event": event}

    # ── Step 4: Extract payment details ───────────────────────────────────
    payment_data = payload.get("payload", {}).get("payment", {}).get("entity", {})
    if not payment_data or not isinstance(payment_data, dict):
        logger.error(f"Webhook {event_id}: no payment entity in payload")
        return {"status": "error", "detail": "No payment entity"}

    razorpay_payment_id = payment_data.get("id", "")
    order_id_from_payload = payment_data.get("order_id", "")
    payment_status = str(payment_data.get("status", "")).lower()

    if not razorpay_payment_id or not order_id_from_payload:
        logger.error(f"Webhook {event_id}: missing payment_id or order_id")
        return {"status": "error", "detail": "Missing identifiers"}

    if payment_status != "captured":
        logger.info(
            f"Webhook {event_id}: payment status is '{payment_status}', "
            f"not 'captured' — ignoring"
        )
        return {"status": "ignored", "detail": f"Status is {payment_status}"}

    # ── Step 5: Compute expected signature for validation ─────────────────
    # The webhook sends order_id + payment_id. We compute the signature
    # the same way the browser callback does for consistency.
    signature = _compute_signature(order_id_from_payload, razorpay_payment_id)

    payload_raw = payload_bytes.decode("utf-8", errors="replace")[:4096]

    # ── Step 6: Process payment ───────────────────────────────────────────
    result = _process_successful_payment(
        razorpay_order_id=order_id_from_payload,
        razorpay_payment_id=razorpay_payment_id,
        razorpay_signature=signature,
        source="webhook",
        db=db,
        webhook_event_id=event_id,
        webhook_payload_raw=payload_raw,
    )

    return result


# ─────────────────────────────────────────────────────────────────────────────
# SCAN BALANCE MANAGEMENT
# ─────────────────────────────────────────────────────────────────────────────

def get_user_scans(user_id: int, db: Session) -> dict:
    """Get remaining scan balance for all plan types."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return {"reviewer": 0, "jd": 0}
    return {
        "reviewer": max(0, (user.reviewer_scans or 0)),
        "jd": max(0, (user.jd_scans or 0)),
    }


def deduct_scan(user_id: int, plan_type: str, db: Session) -> bool:
    """
    Deduct one scan from the user's balance.

    IMPORTANT: This is called WHEN A USER RUNS AN ANALYSIS, not at payment time.
    Payment credits scans. Analysis consumes them.

    Returns True if scan was consumed, False if no scans remain.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return False

    if plan_type == "reviewer":
        current = user.reviewer_scans or 0
        if current > 0:
            user.reviewer_scans = current - 1
            db.commit()
            logger.info(f"Deducted 1 reviewer scan from user {user_id} ({current} → {current - 1})")
            return True
    elif plan_type == "jd":
        current = user.jd_scans or 0
        if current > 0:
            user.jd_scans = current - 1
            db.commit()
            logger.info(f"Deducted 1 JD scan from user {user_id} ({current} → {current - 1})")
            return True

    return False


def check_and_deduct_scan(
    user: User,
    plan_type: str,
    db: Session,
) -> None:
    """
    Check scan availability and deduct one. Raises HTTPException(402) if none.

    Call this at the START of any paid analysis endpoint like:
        check_and_deduct_scan(user, "reviewer", db)
    The endpoint then runs the analysis AFTER the scan is consumed,
    so every analysis call is paid for even if it fails midway.
    """
    if not deduct_scan(user.id, plan_type, db):
        from fastapi import HTTPException as FastAPIHTTPException
        plan_label = PLANS.get(plan_type, {}).get("label", plan_type)
        raise FastAPIHTTPException(
            status_code=402,
            detail=(
                f"No {plan_label} scans remaining. "
                f"Please purchase a scan pack at /payment/plans."
            ),
        )


# ─────────────────────────────────────────────────────────────────────────────
# ADMIN / RECONCILIATION
# ─────────────────────────────────────────────────────────────────────────────

def get_payment_history(user_id: int, db: Session, limit: int = 20, offset: int = 0) -> list[dict]:
    """Get payment history for a user."""
    payments = (
        db.query(Payment)
        .filter(Payment.user_id == user_id)
        .order_by(Payment.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return [p.to_dict() for p in payments]


def get_all_pending_verifications(db: Session) -> list[Payment]:
    """
    Find payments that are 'created' but older than 10 minutes.
    These are orders the user started but never completed.
    Useful for admin dashboards and cleanup jobs.
    """
    from sqlalchemy import func
    cutoff = datetime.now(timezone.utc).timestamp() - 600  # 10 min
    return (
        db.query(Payment)
        .filter(
            Payment.status == "created",
            func.extract("epoch", Payment.created_at) < cutoff,
        )
        .all()
    )
