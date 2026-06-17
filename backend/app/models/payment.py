"""
Payment model — production-grade Razorpay tracking with dual verification,
full audit trail, idempotency, and reconciliation support.

Every payment flows through: created → verified → scans_credited → complete
Failed/refunded states are also tracked for financial reconciliation.
"""

from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Text, Index, UniqueConstraint,
    ForeignKey,
)
from datetime import datetime, timezone
from app.database.database import Base


class Payment(Base):
    """
    Single source of truth for every payment transaction.

    ── Lifecycle ───────────────────────────────────────────
    created ──→ verified ──→ scans_credited ──→ complete
        │
        └──→ failed (verification rejected)
        └──→ expired (order TTL exceeded)

    ── Indexes ─────────────────────────────────────────────
    - (user_id, created_at): for user history queries
    - (razorpay_order_id, razorpay_payment_id): unique guard
    - status + updated_at: for admin reconciliation

    ── Financial integrity ─────────────────────────────────
    - amount_ordered (what the user was charged)
    - amount_paid (what Razorpay actually captured)
    - currency, payment_method, bank_reference: audit trail

    REFERENCE: Razorpay API docs for payment verification
    https://razorpay.com/docs/api/payments/
    """

    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)

    # ── RAZORPAY IDENTIFIERS ──────────────────────────────
    razorpay_order_id = Column(String(64), unique=True, nullable=False, index=True)
    razorpay_payment_id = Column(String(64), nullable=True)          # assigned after payment
    razorpay_signature = Column(String(256), nullable=True)         # from browser callback

    # ── PLAN & PRICING ─────────────────────────────────────
    plan_type = Column(String(32), nullable=False, index=True)      # "reviewer" | "jd" | "hunter"
    amount_ordered = Column(Integer, nullable=False)                # paise we intended to charge
    amount_paid = Column(Integer, nullable=True)                    # paise Razorpay actually captured
    currency = Column(String(8), default="INR")
    scans_purchased = Column(Integer, nullable=False, default=0)

    # ── PAYMENT METHOD (from webhook / API) ────────────────
    payment_method = Column(String(32), nullable=True)              # "upi" | "card" | "netbanking" | "wallet"
    bank_reference = Column(String(64), nullable=True)              # Razorpay's bank ref for reconciliation
    card_last_four = Column(String(4), nullable=True)               # last 4 digits if card

    # ── STATUS & VERIFICATION ──────────────────────────────
    # created → verified → scans_credited → complete
    # created → failed
    status = Column(String(24), default="created", index=True)
    verification_source = Column(String(16), nullable=True)         # "callback" | "webhook" | "manual"
    is_verified = Column(Boolean, default=False, index=True)
    is_scans_credited = Column(Boolean, default=False)
    is_webhook_processed = Column(Boolean, default=False)

    # ── WEBHOOK TRACKING ───────────────────────────────────
    webhook_event_id = Column(String(64), nullable=True, unique=True)
    webhook_signature = Column(String(256), nullable=True)
    webhook_raw = Column(Text, nullable=True)                       # full payload for audit

    # ── ERROR / FAILURE TRACKING ───────────────────────────
    error_code = Column(String(64), nullable=True)
    error_message = Column(Text, nullable=True)
    error_source = Column(String(32), nullable=True)                # "razorpay" | "signature" | "timeout" | "webhook"
    retry_count = Column(Integer, default=0)

    # ── TIMESTAMPS ─────────────────────────────────────────
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    paid_at = Column(DateTime, nullable=True)
    verified_at = Column(DateTime, nullable=True)
    scans_credited_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # ── CONSTRAINTS & INDEXES ──────────────────────────────
    __table_args__ = (
        Index("idx_payments_user_created", "user_id", "created_at"),
        Index("idx_payments_status_updated", "status", "updated_at"),
        UniqueConstraint(
            "razorpay_order_id", "razorpay_payment_id",
            name="uq_order_payment"
        ),
    )


    def mark_verified(self, razorpay_payment_id: str, razorpay_signature: str,
                      source: str = "callback"):
        """Transition from created → verified. Safe to call multiple times."""
        self.razorpay_payment_id = razorpay_payment_id or self.razorpay_payment_id
        self.razorpay_signature = razorpay_signature or self.razorpay_signature
        self.status = "verified"
        self.is_verified = True
        self.verification_source = self.verification_source or source
        self.verified_at = self.verified_at or datetime.now(timezone.utc)
        self.error_code = None
        self.error_message = None

    def mark_scans_credited(self):
        """Transition from verified → scans_credited."""
        self.status = "scans_credited"
        self.is_scans_credited = True
        self.scans_credited_at = datetime.now(timezone.utc)

    def mark_complete(self):
        """Transition from scans_credited → complete."""
        self.status = "complete"

    def mark_failed(self, code: str, message: str, source: str = "razorpay"):
        """Transition from any state → failed."""
        self.status = "failed"
        self.error_code = code
        self.error_message = message
        self.error_source = source
        self.updated_at = datetime.now(timezone.utc)

    def to_dict(self) -> dict:
        """Admin-friendly dict for reconciliation views."""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "razorpay_order_id": self.razorpay_order_id,
            "razorpay_payment_id": self.razorpay_payment_id,
            "plan_type": self.plan_type,
            "amount_ordered": self.amount_ordered,
            "amount_paid": self.amount_paid,
            "currency": self.currency,
            "payment_method": self.payment_method,
            "bank_reference": self.bank_reference,
            "status": self.status,
            "is_verified": self.is_verified,
            "is_scans_credited": self.is_scans_credited,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "paid_at": self.paid_at.isoformat() if self.paid_at else None,
            "verified_at": self.verified_at.isoformat() if self.verified_at else None,
        }
