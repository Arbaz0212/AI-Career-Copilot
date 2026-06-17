"""
ResumeAnalysis model — persists resume review results per user.
Enables history view on the dashboard alongside JD match analyses.
"""

from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey, Index
from sqlalchemy.dialects.postgresql import JSONB
from datetime import datetime, timezone
from app.database.database import Base


class ResumeAnalysis(Base):
    __tablename__ = "resume_analyses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)

    # Resume details
    detected_role = Column(String, nullable=True)
    seniority = Column(String, nullable=True)

    # Scores
    final_score = Column(Float, nullable=True)
    grade = Column(String, nullable=True)
    verdict = Column(String, nullable=True)

    # Full results
    full_results = Column(JSONB, nullable=True)

    # Status
    status = Column(String, default="completed", index=True)

    # Timestamps
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    completed_at = Column(DateTime, nullable=True)

    __table_args__ = (
        Index("idx_rr_analyses_user_created", "user_id", "created_at"),
    )
