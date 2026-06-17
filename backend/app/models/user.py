from sqlalchemy import Column, Integer, String, Boolean, DateTime, Index
from datetime import datetime, timezone
from app.database.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    password = Column(String, nullable=True)
    auth_provider = Column(String, default="email")
    otp = Column(String, nullable=True)
    otp_expiry = Column(DateTime, nullable=True)
    otp_sent_at = Column(DateTime, nullable=True)
    is_verified = Column(Boolean, default=False)
    reset_verified = Column(Boolean, default=False)
    last_login = Column(DateTime, nullable=True)

    # Scan tracking — 1 free scan each on signup
    reviewer_scans = Column(Integer, default=1)
    jd_scans = Column(Integer, default=1)
    avatar_url = Column(String, nullable=True)

    __table_args__ = (
        Index("idx_users_email_verified", "email", "is_verified"),
    )
