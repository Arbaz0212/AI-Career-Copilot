# routes.py — Resume Review (no JD) endpoint
# Scores formatting/structure/writing quality only. No skill-gap matching.

from __future__ import annotations
import os, uuid, logging, tempfile
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.database.db import get_db

from .resume_profiler import build_profile
from .scoring_engine import calculate_score
from .feedback_generator import generate_feedback
from .parser import extract_text_from_pdf, parse_resume

from app.auth_deps import require_user
from app.models.user import User
from app.models.resume import ResumeAnalysis
from app.services.payment_service import check_and_deduct_scan

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/resume-review", tags=["Resume Review"])

MAX_FILE_BYTES = 5 * 1024 * 1024


@router.post("/upload")
async def upload_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(require_user),
):
    if not file.filename:
        raise HTTPException(400, "No file provided.")
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(400, "Only PDF files accepted.")

    content = await file.read()
    if len(content) > MAX_FILE_BYTES:
        raise HTTPException(413, "File too large — max 5 MB.")
    if len(content) < 800:
        raise HTTPException(400, "File too small to be a valid resume.")

    # Deduct one reviewer scan — all users must be authenticated
    check_and_deduct_scan(user, "reviewer", db)

    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=f"_{uuid.uuid4().hex[:8]}.pdf") as f:
            f.write(content)
            tmp_path = f.name

        try:
            full_text = extract_text_from_pdf(tmp_path)
        except ValueError as e:
            raise HTTPException(422, str(e))

        parsed  = parse_resume(full_text)
        profile = build_profile(parsed, full_text)
        score_result = calculate_score(profile, parsed, full_text)
        ai = generate_feedback(score_result, profile, parsed)

        # Build ATS preview
        sections_found = []
        for s in ["summary", "experience", "education", "skills", "projects", "certifications"]:
            if parsed.get(s):
                sections_found.append(s)

        expected_sections = ["summary", "experience", "education", "skills"]
        missing_sections = [s for s in expected_sections if s not in sections_found]

        response = {
            "candidate": {
                "name":     parsed.get("name"),
                "email":    parsed.get("email"),
                "phone":    parsed.get("phone"),
                "linkedin": parsed.get("linkedin"),
                "github":   parsed.get("github"),
            },

            "detected_role": {
                "role":            profile["detected_role"],
                "confidence_pct":  profile["role_confidence"],
                "seniority":       profile["seniority"],
                "years_estimated": profile["estimated_years"],
            },

            "ats_score": {
                "final_score":     score_result["final_score"],
                "grade":           score_result["grade"],
                "verdict":         score_result["verdict"],
                "description":     score_result["description"],
                "percentile":      score_result["percentile"],
                "seniority_mode":  score_result["seniority_mode"],
            },

            "dimension_scores": score_result["dimension_scores"],

            "section_breakdown": score_result.get("section_breakdown", {}),
            "keyword_density":   score_result.get("keyword_density", {}),
            "peer_comparison":   score_result.get("peer_comparison", {}),

            "ats_preview": {
                "parsed_name": parsed.get("name"),
                "parsed_email": parsed.get("email"),
                "parsed_phone": parsed.get("phone"),
                "sections_detected": sections_found,
                "missing_sections": missing_sections,
                "word_count": len(full_text.split()),
                "reading_time_seconds": round(len(full_text.split()) / 4),
            },

            "what_you_did_well": score_result["wins"],
            "issues_to_fix":     score_result["issues"],
            "score_boosts":      score_result["score_boosts"],

            "ai_review": {
                "executive_summary":   ai.get("executive_summary", ""),
                "top_strengths":       ai.get("top_strengths", []),
                "critical_issues":     ai.get("critical_issues", []),
                "bullet_rewrites":     ai.get("bullet_rewrites", []),
                "skill_suggestions":   ai.get("skill_suggestions", []),
                "interview_readiness": ai.get("interview_readiness", ""),
                "week_1_action":       ai.get("week_1_action", ""),
                "used_fallback":       ai.get("_fallback", False),
            },

            "skills_found": parsed.get("skills", []),
        }

        # Persist to DB for history
        if user and user.id:
            try:
                from datetime import datetime, timezone
                import json

                # Ensure full_results is JSON-safe
                safe_results = json.loads(json.dumps(response, default=str))
                rr_analysis = ResumeAnalysis(
                    user_id=user.id,
                    detected_role=profile["detected_role"],
                    seniority=profile["seniority"],
                    final_score=score_result["final_score"],
                    grade=score_result["grade"],
                    verdict=score_result["verdict"],
                    full_results=safe_results,
                    status="completed",
                    completed_at=datetime.now(timezone.utc),
                )
                db.add(rr_analysis)
                db.commit()
                logger.info(f"Saved RR analysis for user {user.id}: score={score_result['final_score']}")
            except Exception as e:
                db.rollback()
                logger.warning(f"Failed to persist RR analysis (non-critical): {e}")
            except Exception as e:
                db.rollback()
                logger.warning(f"Failed to persist RR analysis (non-critical): {e}")

        return JSONResponse(content=response)

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Resume processing error: {e}")
        raise HTTPException(500, "Error processing resume. Please try again.")
    finally:
        if tmp_path and os.path.exists(tmp_path):
            try: os.unlink(tmp_path)
            except: pass
