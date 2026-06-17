# app/modules/jd_match/recommendation_engine.py
# Generates structured, prioritized action recommendations based on match results.
# Pure programmatic logic — no LLM calls. Fast and deterministic.

from __future__ import annotations
import logging

logger = logging.getLogger(__name__)


# ── PRIORITY LEVELS ───────────────────────────────────────────────────────────
PRIORITY_CRITICAL = "critical"
PRIORITY_HIGH     = "high"
PRIORITY_MEDIUM   = "medium"
PRIORITY_LOW      = "low"


def _skill_recommendations(skills_gap: dict) -> list[dict]:
    """Generates skill-based recommendations from the gap report."""
    recommendations = []
    missing = skills_gap.get("missing_skills", [])
    semantic = skills_gap.get("semantic_matches", [])
    match_pct = skills_gap.get("match_pct", 100)

    if match_pct < 40:
        recommendations.append({
            "category": "Skills Gap",
            "priority": PRIORITY_CRITICAL,
            "action": (
                f"Critical skills mismatch detected. You are missing "
                f"{len(missing)} of the required hard skills. "
                "Focus on upskilling in: "
                + ", ".join(missing[:5])
                + " before applying."
            ),
            "impact": "high",
        })
    elif missing:
        recommendations.append({
            "category": "Missing Skills",
            "priority": PRIORITY_HIGH,
            "action": (
                "Add these missing skills to your resume (if you have them) "
                "or start learning them: "
                + ", ".join(missing[:5])
                + "."
            ),
            "impact": "high",
        })

    if semantic:
        recommendations.append({
            "category": "Keyword Optimization",
            "priority": PRIORITY_MEDIUM,
            "action": (
                "You have semantically similar skills but not the exact JD keywords. "
                "Replace or supplement these in your resume: "
                + ", ".join(
                    f"{m['matched_with']} → {m['required']}"
                    for m in semantic[:3]
                )
                + "."
            ),
            "impact": "medium",
        })

    return recommendations


def _seniority_recommendations(seniority_fit: dict) -> list[dict]:
    """Generates seniority-based recommendations."""
    recommendations = []
    if not seniority_fit.get("aligned", True):
        gap = seniority_fit.get("required_years", 0) - seniority_fit.get("candidate_years", 0)
        if gap > 2:
            recommendations.append({
                "category": "Experience Gap",
                "priority": PRIORITY_HIGH,
                "action": (
                    f"You are {gap} years short of the required experience. "
                    "Compensate by highlighting: complex project ownership, "
                    "team leadership, and measurable technical achievements."
                ),
                "impact": "high",
            })
        else:
            recommendations.append({
                "category": "Experience Gap",
                "priority": PRIORITY_MEDIUM,
                "action": (
                    "Minor experience gap. Strengthen your application by "
                    "quantifying your impact in current/past roles with specific metrics."
                ),
                "impact": "medium",
            })
    return recommendations


def _score_recommendations(match_percentage: int) -> list[dict]:
    """Generates overall score-based recommendations."""
    recommendations = []

    if match_percentage < 55:
        recommendations.append({
            "category": "Overall Fit",
            "priority": PRIORITY_CRITICAL,
            "action": (
                "Your overall match score is low. Consider whether this role "
                "aligns with your current profile, or invest time in targeted "
                "resume improvements before applying."
            ),
            "impact": "high",
        })
    elif match_percentage < 70:
        recommendations.append({
            "category": "Resume Optimization",
            "priority": PRIORITY_HIGH,
            "action": (
                "Your resume needs targeted optimization for this role. "
                "Use the bullet rewrites provided and incorporate JD keywords "
                "in your experience section."
            ),
            "impact": "high",
        })
    elif match_percentage >= 85:
        recommendations.append({
            "category": "Strong Profile",
            "priority": PRIORITY_LOW,
            "action": (
                "Strong match detected. Focus on interview preparation "
                "using the talking points provided. Customize your cover letter "
                "to reference specific JD responsibilities."
            ),
            "impact": "low",
        })

    return recommendations


def _soft_skill_recommendations(skills_gap: dict) -> list[dict]:
    """Generates soft skill gap recommendations."""
    soft_gaps = skills_gap.get("soft_skill_gaps", [])
    if not soft_gaps:
        return []
    return [
        {
            "category": "Soft Skills",
            "priority": PRIORITY_LOW,
            "action": (
                "Consider adding these soft skills to your profile summary: "
                + ", ".join(soft_gaps[:4])
                + ". Demonstrate them through concrete examples in your cover letter."
            ),
            "impact": "low",
        }
    ]


def generate_recommendations(
    match_result: dict,
    skills_gap: dict,
) -> list[dict]:
    """
    Assembles a prioritized list of actionable recommendations.

    Priority order: critical → high → medium → low

    Args:
        match_result:  Output from compute_comprehensive_match_score()
        skills_gap:    Output from calculate_skills_gap()

    Returns:
        list of recommendation dicts, sorted by priority
    """
    recommendations = []

    recommendations.extend(_score_recommendations(match_result.get("match_percentage", 0)))
    recommendations.extend(_skill_recommendations(skills_gap))
    recommendations.extend(_seniority_recommendations(match_result.get("seniority_fit", {})))
    recommendations.extend(_soft_skill_recommendations(skills_gap))

    # Sort by priority: critical first
    priority_order = {
        PRIORITY_CRITICAL: 0,
        PRIORITY_HIGH:     1,
        PRIORITY_MEDIUM:   2,
        PRIORITY_LOW:      3,
    }
    recommendations.sort(key=lambda r: priority_order.get(r["priority"], 4))

    # Always add a general resume optimization recommendation if we have fewer than 3
    if len(recommendations) < 3:
        has_rewrites = True  # Assume rewrites were generated
        if recommendations and any("rewrite" in r.get("action", "").lower() for r in recommendations):
            has_rewrites = True
        if not has_rewrites or len(recommendations) < 2:
            recommendations.append({
                "category": "Resume Optimization",
                "priority": PRIORITY_HIGH,
                "action": (
                    "Your resume needs targeted optimization for this role. "
                    "Use the bullet rewrites provided and incorporate JD keywords "
                    "in your experience section."
                ),
                "impact": "high",
            })
        if len(recommendations) < 3:
            recommendations.append({
                "category": "Interview Preparation",
                "priority": PRIORITY_MEDIUM,
                "action": (
                    "Prepare specific examples from your projects that demonstrate "
                    "the key skills this role requires. Use the talking points "
                    "provided to structure your responses."
                ),
                "impact": "medium",
            })

    logger.info(f"Generated {len(recommendations)} recommendations")
    return recommendations