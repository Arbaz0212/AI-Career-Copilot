"""
Celery task queue for AI-CareerCopilot background jobs.
Replaces threading.Thread with a proper task queue:
  - Survives server restarts
  - Auto-retries on failure (3 retries)
  - Multiple workers process jobs in parallel
  - Status tracking built-in

Requires: Redis server running on localhost:6379

Run worker: celery -A worker worker --loglevel=info --concurrency=4
"""

from __future__ import annotations
import logging
from datetime import datetime, timezone
from celery import Celery
from app.database.database import SessionLocal
from app.models.analysis import JobAnalysis
from app.modules.jd_match.routes import _run_match_pipeline

logger = logging.getLogger(__name__)

celery_app = Celery(
    "jd_match",
    broker="redis://localhost:6379/0",
    backend="redis://localhost:6379/1",
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    task_track_started=True,
    task_acks_late=True,          # Re-deliver if worker crashes
    worker_prefetch_multiplier=1, # One task at a time per worker
    task_time_limit=300,          # 5 minute hard limit per task
    task_soft_time_limit=240,     # 4 minute soft limit
)


@celery_app.task(bind=True, max_retries=3, default_retry_delay=5, acks_late=True)
def run_jd_match_analysis(
    self,
    analysis_id: int,
    jd_text: str,
    parsed_resume: dict,
    resume_full_text: str,
) -> dict | None:
    """
    Runs the JD match pipeline as a Celery task.

    Retries up to 3 times on failure with 5-second delays.
    Stores result in DB and returns the result dict.
    """
    db = SessionLocal()
    try:
        analysis = db.query(JobAnalysis).filter(JobAnalysis.id == analysis_id).first()
        if not analysis:
            logger.error(f"Analysis {analysis_id} not found for background processing.")
            return None

        logger.info(f"─── Celery task: Analysis [{analysis_id}] started ───")
        try:
            result = _run_match_pipeline(jd_text, parsed_resume, resume_full_text)
            score = result["summary"]["overall_score"]

            analysis.status = "completed"
            analysis.match_percentage = score
            analysis.verdict = result["summary"]["verdict"]
            analysis.job_title = result["summary"]["job_title"]
            analysis.company_name = result["summary"]["company_name"]
            analysis.industry_detected = result.get("section_scores", {}).get("industry_detected")
            analysis.completed_at = datetime.now(timezone.utc)
            analysis.full_results = result
            db.commit()

            logger.info(f"─── Celery task: Analysis [{analysis_id}] complete: {score}% ───")
            return result

        except Exception as exc:
            analysis.status = "failed"
            analysis.error_message = str(exc)
            db.commit()
            logger.error(f"Analysis {analysis_id} failed (retry {self.request.retries}): {exc}")
            raise self.retry(exc=exc)

    finally:
        db.close()
