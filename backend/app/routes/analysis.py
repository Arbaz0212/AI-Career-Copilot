"""
Combined analysis history — returns both Resume Review and JD Match history
in a single endpoint sorted by date (newest first).
"""

import logging
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database.db import get_db
from app.auth_deps import require_user
from app.models.user import User
from app.models.resume import ResumeAnalysis
from app.models.analysis import JobAnalysis

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/history", tags=["History"])


@router.get("/all")
def get_all_history(
    db: Session = Depends(get_db),
    user: User = Depends(require_user),
    limit: int = 50,
):
    """Returns the user's complete analysis history (both RR and JD), newest first."""
    # Fetch JD analyses — only current user's records
    jd_analyses = (
        db.query(JobAnalysis)
        .filter(JobAnalysis.user_id == user.id)
        .order_by(desc(JobAnalysis.created_at))
        .limit(limit)
        .all()
    )

    # Fetch RR analyses
    rr_analyses = (
        db.query(ResumeAnalysis)
        .filter(ResumeAnalysis.user_id == user.id)
        .order_by(desc(ResumeAnalysis.created_at))
        .limit(limit)
        .all()
    )

    # Map to common format
    results = []

    for a in jd_analyses:
        results.append({
            "id": f"jd_{a.id}",
            "type": "jd",
            "title": a.job_title or "JD Match Analysis",
            "company": a.company_name or "",
            "score": a.match_percentage,
            "verdict": a.verdict,
            "status": a.status,
            "created_at": a.created_at.isoformat() if a.created_at else None,
            "completed_at": a.completed_at.isoformat() if a.completed_at else None,
        })

    for a in rr_analyses:
        results.append({
            "id": f"rr_{a.id}",
            "type": "resume",
            "title": f"Resume Review — {a.detected_role or 'N/A'}",
            "company": "",
            "score": a.final_score,
            "verdict": a.verdict,
            "status": a.status,
            "created_at": a.created_at.isoformat() if a.created_at else None,
            "completed_at": a.completed_at.isoformat() if a.completed_at else None,
        })

    # Sort by created_at descending (newest first)
    results.sort(key=lambda r: r["created_at"] or "", reverse=True)

    return results[:limit]
