"""
app/modules/jd_match/routes.py
Production-grade FastAPI router for JD vs Resume matching.
Full pipeline: JD parsing -> 5-dimension ATS scoring -> AI feedback -> recommendations.
Premium features: section scores, improvement path, skill analysis with learning resources,
interview kit, cover letter draft, personalised recommendations.
Background task processing with DB persistence and user history.
"""

from __future__ import annotations
import os
import uuid
import time
import logging
import hashlib
import json
import tempfile
from collections import OrderedDict
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from fastapi.responses import JSONResponse, HTMLResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc
from slowapi import Limiter
from slowapi.util import get_remote_address

from .schemas import JDMatchRequestSchema
from .jd_parser import parse_job_description
from .skill_gap import calculate_skills_gap
from .ats_match_score import compute_comprehensive_match_score
from .ai_feedback import generate_matching_ai_feedback
from .recommendation_engine import generate_recommendations
from .keyword_match import run_keyword_match
from .premium_engine import (
    build_summary,
    build_skill_analysis,
    build_improvement_path,
    build_interview_kit,
    build_cover_letter_draft,
    enhance_adjustments,
)
from .resume_exporter import generate_tailored_resume

from app.database.db import get_db
from app.models.analysis import JobAnalysis
from app.auth_deps import get_current_user, require_user
from app.models.user import User
from app.services.payment_service import check_and_deduct_scan

logger = logging.getLogger(__name__)

limiter = Limiter(key_func=get_remote_address, default_limits=["5/minute"])

router = APIRouter(
    prefix="/jd-match",
    tags=["Job Description Matching"],
)

# ── CONSTANTS ──────────────────────────────────────────────────────────────────
MAX_FILE_BYTES = 5 * 1024 * 1024  # 5 MB
CACHE_MAXSIZE = 500               # max entries in cache
CACHE_TTL_SECONDS = 3600           # 1 hour TTL

# ── LRU CACHE WITH TTL ────────────────────────────────────────────────────────
class TTLLRUCache:
    """Simple LRU cache with TTL expiry. Thread-safe for single-process use."""

    def __init__(self, maxsize: int = CACHE_MAXSIZE, ttl: int = CACHE_TTL_SECONDS):
        self._store: OrderedDict[str, tuple[float, dict]] = OrderedDict()
        self._maxsize = maxsize
        self._ttl = ttl

    def _prune(self):
        now = time.time()
        stale = [k for k, (t, _) in self._store.items() if now - t > self._ttl]
        for k in stale:
            del self._store[k]

    def get(self, key: str) -> dict | None:
        self._prune()
        if key not in self._store:
            return None
        self._store.move_to_end(key)  # LRU refresh
        _, value = self._store[key]
        return value

    def set(self, key: str, value: dict):
        self._prune()
        self._store[key] = (time.time(), value)
        self._store.move_to_end(key)
        if len(self._store) > self._maxsize:
            self._store.popitem(last=False)  # evict oldest

    def clear(self) -> int:
        count = len(self._store)
        self._store.clear()
        return count

    @property
    def size(self) -> int:
        self._prune()
        return len(self._store)

    @property
    def keys(self) -> list[str]:
        self._prune()
        return list(self._store.keys())


# Global cache instance
_JD_MATCH_CACHE = TTLLRUCache()

# Reuse the resume_review parser for PDF text extraction
try:
    from app.modules.resume_review.parser import extract_text_from_pdf, parse_resume
except ImportError:
    extract_text_from_pdf = None
    parse_resume = None


def _make_cache_key(jd_text: str, resume_text: str) -> str:
    combined = f"{jd_text.strip()}|||{resume_text.strip()}"
    return hashlib.md5(combined.encode("utf-8")).hexdigest()


def _reshape_parsed_resume(parsed: dict) -> dict:
    """Normalises parsed resume keys to what the JD match pipeline expects."""
    reshaped = dict(parsed)
    if "skills" not in reshaped or not isinstance(reshaped.get("skills"), list):
        reshaped["skills"] = []
    if "estimated_years" not in reshaped:
        detected_role = parsed.get("detected_role", {})
        years = detected_role.get("years_estimated", 0)
        reshaped["estimated_years"] = years
    if "summary" not in reshaped or not reshaped.get("summary"):
        reshaped["summary"] = ""
    if "experience" not in reshaped or not isinstance(reshaped.get("experience"), list):
        reshaped["experience"] = []
    return reshaped


# ── PREMIUM RESPONSE ASSEMBLY ─────────────────────────────────────────────────

def _build_premium_response(
    parsed_jd: dict,
    parsed_resume: dict,
    resume_full_text: str,
    score_data: dict,
    skills_gap: dict,
    ai_feedback: dict,
    recommendations: list[dict],
) -> dict:
    """Assembles the complete premium API response from all pipeline outputs."""
    section_scores = score_data.get("section_scores", {})

    summary = build_summary(
        score_data.get("match_percentage", 0),
        score_data.get("verdict", ""),
        parsed_jd,
        skills_gap,
    )
    skill_analysis = build_skill_analysis(skills_gap, parsed_jd, parsed_resume)
    improvement_path = build_improvement_path(
        score_data.get("match_percentage", 0),
        skills_gap,
        section_scores,
    )
    interview_kit = build_interview_kit(parsed_resume, parsed_jd, skills_gap, score_data)
    cover_letter = build_cover_letter_draft(
        parsed_resume, parsed_jd, skills_gap,
        score_data.get("match_percentage", 0),
    )
    adjustments = enhance_adjustments(ai_feedback.get("resume_adjustments", []))

    return {
        "summary": summary,
        "section_scores": section_scores,
        "skill_analysis": skill_analysis,
        "improvement_path": improvement_path,
        "resume_adjustments": adjustments,
        "interview_kit": interview_kit,
        "cover_letter_draft": cover_letter,
        "recommendations": recommendations,
    }


# ── SHARED PIPELINE ───────────────────────────────────────────────────────────

def _run_match_pipeline(
    jd_text: str,
    parsed_resume: dict,
    resume_full_text: str,
) -> dict:
    """Runs the full JD match pipeline synchronously and assembles premium response."""
    if not jd_text or not jd_text.strip():
        raise HTTPException(status_code=400, detail="Job description text is empty.")
    if not parsed_resume:
        raise HTTPException(status_code=400, detail="Parsed resume is missing.")
    if "skills" not in parsed_resume:
        raise HTTPException(status_code=400, detail="Malformed parsed resume: 'skills' key not found.")

    cache_key = _make_cache_key(jd_text, resume_full_text)
    cached = _JD_MATCH_CACHE.get(cache_key)
    if cached:
        logger.info("Cache hit — returning cached JD match result.")
        return cached

    try:
        print("  STEP 1: Parsing JD...", end=" ", flush=True)
        parsed_jd = parse_job_description(jd_text)
        title = parsed_jd.get('job_title', '?')
        n_skills = len(parsed_jd.get('hard_skills', []))
        print(f"[{title}] [{n_skills} skills]", flush=True)

        print("  STEP 2: Computing skill gap...", end=" ", flush=True)
        skills_gap = calculate_skills_gap(parsed_resume, parsed_jd)
        n_exact = len(skills_gap.get('exact_matches', []))
        n_missing = len(skills_gap.get('missing_skills', []))
        print(f"[{n_exact} exact, {n_missing} missing]", flush=True)

        print("  STEP 3: Computing ATS score...", end=" ", flush=True)
        score_data = compute_comprehensive_match_score(
            skills_gap, parsed_resume, parsed_jd, resume_full_text, jd_text=jd_text,
        )
        score = score_data.get('match_percentage', '?')
        industry = score_data.get('industry_detected', 'N/A')
        print(f"[{score}% - {industry}]", flush=True)

        print("  STEP 4: Generating AI feedback...", flush=True)
        ai_feedback = generate_matching_ai_feedback(
            parsed_resume=parsed_resume, resume_full_text=resume_full_text,
            parsed_jd=parsed_jd, skills_gap=skills_gap, score_data=score_data,
        )
        logger.info(f"    → {len(ai_feedback.get('resume_adjustments', []))} resume adjustments | {len(ai_feedback.get('interview_talking_points', []))} talking points")

        logger.info("  ➤ Step 5: Generating recommendations...")
        recommendations = generate_recommendations(score_data, skills_gap)
        logger.info(f"    → {len(recommendations)} recommendations")

        full_report = _build_premium_response(
            parsed_jd=parsed_jd, parsed_resume=parsed_resume,
            resume_full_text=resume_full_text, score_data=score_data,
            skills_gap=skills_gap, ai_feedback=ai_feedback,
            recommendations=recommendations,
        )

        _JD_MATCH_CACHE.set(cache_key, full_report)
        logger.info(f"JD match complete: {full_report['summary']['overall_score']}% match")
        return full_report

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"JD match pipeline failure: {e}")
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")


# ── ROUTES ────────────────────────────────────────────────────────────────────

@router.post(
    "/analyze",
    summary="Match resume against a job description (background task)",
    description=(
        "Starts a background analysis task via Celery and returns immediately with a task ID. "
        "Poll /jd-match/status/{id} to get the result when ready."
    ),
)
async def analyze_resume_jd(
    request: JDMatchRequestSchema,
    db: Session = Depends(get_db),
    user: User | None = Depends(get_current_user),
):
    """Starts background JD match analysis via Celery. Returns task ID immediately."""
    # Validate input
    if not request.jd_text or not request.jd_text.strip():
        raise HTTPException(status_code=400, detail="Job description text is empty.")
    if not request.parsed_resume:
        raise HTTPException(status_code=400, detail="Parsed resume is missing.")
    if "skills" not in request.parsed_resume:
        raise HTTPException(status_code=400, detail="Malformed parsed resume: 'skills' key not found.")

    # Deduct one JD scan (authenticated users only)
    if user:
        check_and_deduct_scan(user, "jd", db)

    # Check cache first for instant response
    cache_key = _make_cache_key(request.jd_text, request.resume_full_text)
    cached = _JD_MATCH_CACHE.get(cache_key)
    if cached:
        logger.info("Cache hit — returning cached result immediately.")
        return JSONResponse(content=cached)

    # Create analysis record
    analysis = JobAnalysis(
        user_id=user.id if user else 0,
        jd_text=request.jd_text,
        status="processing",
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)

    # Parse resume in foreground (fast)
    parsed_resume = request.parsed_resume
    resume_full_text = request.resume_full_text

    # Dispatch to Celery worker — survives restarts, supports retries
    from app.tasks import run_jd_match_analysis
    run_jd_match_analysis.delay(analysis.id, request.jd_text, parsed_resume, resume_full_text)

    return {
        "status": "processing",
        "analysis_id": analysis.id,
        "message": "Analysis started. Poll /jd-match/status/{id} for results.",
    }


@router.get(
    "/status/{analysis_id}",
    summary="Get analysis status and result",
)
async def get_analysis_status(
    analysis_id: int,
    db: Session = Depends(get_db),
):
    """Returns the current status and result of a JD match analysis task.
    Auto-fails analyses stuck in 'processing' for over 60 seconds."""
    analysis = db.query(JobAnalysis).filter(JobAnalysis.id == analysis_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found.")

    # Auto-fail stuck analyses (server restart killed the background thread)
    if analysis.status == "processing" and analysis.created_at:
        elapsed = (datetime.now(timezone.utc) - analysis.created_at).total_seconds()
        if elapsed > 60:
            analysis.status = "failed"
            analysis.error_message = "Analysis timed out (background thread may have been interrupted)."
            db.commit()
            logger.warning(f"Analysis {analysis_id} auto-failed after {elapsed:.0f}s (stuck in processing)")

    response = {
        "id": analysis.id,
        "status": analysis.status,
        "created_at": analysis.created_at.isoformat() if analysis.created_at else None,
    }

    if analysis.status == "completed":
        response["result"] = analysis.full_results
        response["completed_at"] = analysis.completed_at.isoformat() if analysis.completed_at else None
    elif analysis.status == "failed":
        response["error"] = analysis.error_message

    return response


@router.post(
    "/compare",
    summary="Match resume against a job description (synchronous, for quick tests)",
)
async def compare_resume_to_jd(
    request: JDMatchRequestSchema,
    db: Session = Depends(get_db),
    user: User = Depends(require_user),
):
    """Full JD match pipeline endpoint — synchronous. Use /analyze for production."""
    # Deduct one JD scan before running analysis
    check_and_deduct_scan(user, "jd", db)

    result = _run_match_pipeline(
        jd_text=request.jd_text,
        parsed_resume=request.parsed_resume,
        resume_full_text=request.resume_full_text,
    )
    return JSONResponse(content=result)


@router.post(
    "/upload",
    summary="Upload a resume PDF + JD text for matching",
)
async def upload_resume_jd(
    resume: UploadFile = File(..., description="Resume PDF file"),
    jd_text: str = Form(..., description="Job description text", min_length=10),
    db: Session = Depends(get_db),
    user: User = Depends(require_user),
):
    """Upload a resume PDF and JD text for premium matching (background)."""
    if not resume.filename:
        raise HTTPException(status_code=400, detail="No file provided.")
    if not resume.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")

    content = await resume.read()
    if len(content) > MAX_FILE_BYTES:
        raise HTTPException(status_code=413, detail="File too large — max 5 MB.")
    if len(content) < 800:
        raise HTTPException(status_code=400, detail="File too small to be a valid resume PDF.")

    # Deduct one JD scan before running analysis
    check_and_deduct_scan(user, "jd", db)

    if extract_text_from_pdf is None or parse_resume is None:
        raise HTTPException(status_code=500, detail="Resume PDF parser is not available.")

    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=f"_{uuid.uuid4().hex[:8]}.pdf") as f:
            f.write(content)
            tmp_path = f.name

        full_text = extract_text_from_pdf(tmp_path)
        parsed = parse_resume(full_text)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Failed to process uploaded PDF: {e}")
        raise HTTPException(status_code=500, detail=f"Error reading PDF: {str(e)}")
    finally:
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.unlink(tmp_path)
            except OSError:
                pass

    reshaped = _reshape_parsed_resume(parsed)

    # Check cache
    cache_key = _make_cache_key(jd_text, full_text)
    cached = _JD_MATCH_CACHE.get(cache_key)
    if cached:
        return JSONResponse(content=cached)

    # Run pipeline synchronously — returns result directly
    result = _run_match_pipeline(
        jd_text=jd_text,
        parsed_resume=reshaped,
        resume_full_text=full_text,
    )

    # Persist to DB for history
    try:
        from datetime import datetime, timezone
        import json

        analysis = JobAnalysis(
            user_id=user.id if user else 0,
            jd_text=jd_text,
            job_title=result.get("summary", {}).get("job_title"),
            company_name=result.get("summary", {}).get("company_name"),
            match_percentage=result.get("summary", {}).get("overall_score"),
            verdict=result.get("summary", {}).get("verdict"),
            industry_detected=result.get("section_scores", {}).get("industry_detected"),
            status="completed",
            completed_at=datetime.now(timezone.utc),
            full_results=json.loads(json.dumps(result, default=str)),
        )
        db.add(analysis)
        db.commit()
        logger.info(f"Saved JD analysis for user {user.id}: score={result.get('summary', {}).get('overall_score')}")
    except Exception as e:
        db.rollback()
        logger.warning(f"Failed to persist JD analysis (non-critical): {e}")

    return JSONResponse(content=result)


@router.get(
    "/download/{analysis_id}",
    summary="Download tailored resume as HTML",
)
async def download_tailored_resume(
    analysis_id: int,
    db: Session = Depends(get_db),
):
    """Returns the tailored resume as a downloadable HTML page."""
    analysis = db.query(JobAnalysis).filter(JobAnalysis.id == analysis_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found.")
    if analysis.status != "completed":
        raise HTTPException(status_code=400, detail="Analysis not yet completed.")
    if not analysis.tailored_resume_html:
        raise HTTPException(status_code=404, detail="No tailored resume available.")

    return HTMLResponse(
        content=analysis.tailored_resume_html,
        headers={
            "Content-Disposition": f'attachment; filename="tailored_resume_{analysis_id}.html"',
        },
    )


@router.get(
    "/history",
    summary="Get user's analysis history",
)
async def get_analysis_history(
    db: Session = Depends(get_db),
    user: User = Depends(require_user),
    limit: int = 20,
    offset: int = 0,
):
    """Returns the authenticated user's previous JD match analyses."""
    analyses = (
        db.query(JobAnalysis)
        .filter(JobAnalysis.user_id == user.id)
        .order_by(desc(JobAnalysis.created_at))
        .offset(offset)
        .limit(limit)
        .all()
    )

    return [
        {
            "id": a.id,
            "job_title": a.job_title,
            "company_name": a.company_name,
            "match_percentage": a.match_percentage,
            "verdict": a.verdict,
            "status": a.status,
            "created_at": a.created_at.isoformat() if a.created_at else None,
            "completed_at": a.completed_at.isoformat() if a.completed_at else None,
        }
        for a in analyses
    ]


@router.delete(
    "/cache/clear",
    summary="Clear the in-memory JD match cache",
)
async def clear_cache():
    count = _JD_MATCH_CACHE.clear()
    return {"message": f"Cache cleared. {count} entries removed."}


@router.get(
    "/cache/stats",
    summary="Get cache statistics",
)
async def cache_stats():
    return {
        "cached_entries": _JD_MATCH_CACHE.size,
        "cache_keys": _JD_MATCH_CACHE.keys,
    }
