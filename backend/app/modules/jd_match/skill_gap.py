# app/modules/jd_match/skill_gap.py
# Calculates skill gap between candidate resume and parsed JD.
# Combines exact + semantic alignment into a clean structured report.

from __future__ import annotations
import logging
from .semantic_match import evaluate_semantic_alignment

logger = logging.getLogger(__name__)


def calculate_skills_gap(parsed_resume: dict, parsed_jd: dict) -> dict:
    """
    Computes comprehensive skill gap report.

    Compares:
        - parsed_resume["skills"]  →  candidate's technical skills
        - parsed_jd["hard_skills"] →  JD required hard skills

    Returns:
        {
            exact_matches:    list[str],
            semantic_matches: list[{required, matched_with, similarity_score}],
            missing_skills:   list[str],
            match_pct:        int,
            soft_skill_gaps:  list[str],   # soft skills the candidate is missing
            total_required:   int,
            total_matched:    int,
        }
    """
    candidate_skills: list[str] = parsed_resume.get("skills", [])
    required_hard:    list[str] = parsed_jd.get("hard_skills", [])
    required_soft:    list[str] = parsed_jd.get("soft_skills", [])

    if not candidate_skills:
        logger.warning("No skills found in parsed resume — skill gap will be large.")

    # Run full semantic alignment for hard skills
    alignment = evaluate_semantic_alignment(candidate_skills, required_hard)

    # Simple soft skill gap (exact only — soft skills don't need semantic matching)
    candidate_lower = {s.lower().strip() for s in candidate_skills}
    soft_skill_gaps = [
        s for s in required_soft
        if s.lower().strip() not in candidate_lower
    ]

    total_required = len(required_hard)
    total_matched  = len(alignment["exact_matches"]) + len(alignment["semantic_matches"])

    logger.info(
        f"Skill gap: {total_matched}/{total_required} hard skills matched | "
        f"{len(soft_skill_gaps)} soft skill gaps"
    )

    return {
        "exact_matches":    alignment["exact_matches"],
        "semantic_matches": alignment["semantic_matches"],
        "missing_skills":   alignment["missing_skills"],
        "match_pct":        alignment["match_pct"],
        "soft_skill_gaps":  soft_skill_gaps,
        "total_required":   total_required,
        "total_matched":    total_matched,
    }