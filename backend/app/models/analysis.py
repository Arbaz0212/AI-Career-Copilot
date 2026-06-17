"""
JobAnalysis model — persists JD match results per user.
Enables history view on the profile page and background task tracking.
Production-grade with proper indexes and foreign keys.
"""

from sqlalchemy import Column, Integer, String, DateTime, Text, Float, ForeignKey, Index
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database.database import Base


class JobAnalysis(Base):
    __tablename__ = "job_analyses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)

    # Job details
    job_title = Column(String, nullable=True)
    company_name = Column(String, nullable=True)
    jd_text = Column(Text, nullable=False)

    # Scores
    match_percentage = Column(Float, nullable=True)
    verdict = Column(String, nullable=True)
    industry_detected = Column(String, nullable=True)

    # Full results
    full_results = Column(JSONB, nullable=True)
    tailored_resume_html = Column(Text, nullable=True)

    # Status
    status = Column(String, default="processing", index=True)
    error_message = Column(String, nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    completed_at = Column(DateTime, nullable=True)

    # Relationship
    # user = relationship("User", back_populates="analyses")

    __table_args__ = (
        Index("idx_analyses_user_status", "user_id", "status"),
        Index("idx_analyses_user_created", "user_id", "created_at"),
    )
