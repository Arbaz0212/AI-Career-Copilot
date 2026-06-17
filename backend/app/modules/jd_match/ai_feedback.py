# app/modules/jd_match/ai_feedback.py
# Generates AI-powered resume bullet rewrites and interview talking points.
# Uses Gemini structured outputs — only asks LLM for creative/language tasks.
# All numeric scores come from ats_match_score.py (never from LLM).
# NEVER exposes 'used_fallback' to the API response — it's an internal flag only.

from __future__ import annotations
import os
import json
import logging
from openai import OpenAI

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

logger = logging.getLogger(__name__)

GROQ_BASE_URL = "https://api.groq.com/openai/v1"

SYSTEM_INSTRUCTION = (
    "You are an elite technical recruiter and resume coach. "
    "You receive a candidate's resume and a target job description. "
    "Your task is to produce exactly 3–4 high-impact resume bullet rewrites "
    "that incorporate JD keywords naturally, and exactly 4 strategic interview "
    "talking points the candidate should use. "
    "Be specific, use numbers/metrics where plausible, and match the JD language. "
    "If the candidate has limited experience bullets, rewrite their project "
    "descriptions to align with JD requirements instead. "
    "Output must match the provided JSON schema exactly. "
    "Respond ONLY with valid JSON matching the schema. No markdown, no code fences."
)


# ── API KEY ───────────────────────────────────────────────────────────────────

def _get_api_key() -> str:
    import random
    keys = ["GROQ_API_KEY_3", "GROQ_API_KEY_4", "GROQ_API_KEY_5"]
    random.shuffle(keys)
    for var in keys:
        val = os.getenv(var, "").strip()
        if val:
            return val
    raise EnvironmentError("No Groq API key found in JD pool (GROQ_API_KEY_3/4/5).")


# ── PROMPT BUILDER ────────────────────────────────────────────────────────────

def _build_prompt(
    parsed_resume: dict,
    resume_full_text: str,
    parsed_jd: dict,
    skills_gap: dict,
    score_data: dict,
) -> str:
    candidate_name   = parsed_resume.get("name", "Candidate")
    job_title        = _safe_title(parsed_jd.get("job_title"))
    company_name     = _safe_company(parsed_jd.get("company_name"))
    required_hard    = parsed_jd.get("hard_skills", [])
    candidate_skills = parsed_resume.get("skills", [])
    missing_skills   = skills_gap.get("missing_skills", [])
    responsibilities = parsed_jd.get("responsibilities", [])
    match_pct        = score_data.get("match_percentage", 0)

    return f"""Candidate: {candidate_name}
Target Role: {job_title} at {company_name}
Match Score: {match_pct}%

Candidate Skills: {", ".join(candidate_skills[:20]) or "Not listed"}
Required Hard Skills: {", ".join(required_hard[:15]) or "Not listed"}
Missing Skills to Address: {", ".join(missing_skills[:8]) or "None"}

JD Key Responsibilities:
{chr(10).join(f"- {r}" for r in responsibilities[:5]) or "- Not specified"}

Candidate Resume (first 2000 chars):
{resume_full_text[:2000]}

Task:
1. Identify 3–4 existing resume bullets or project descriptions that can be improved to better match the JD.
   Rewrite them to incorporate JD keywords naturally with quantifiable impact.
2. Generate 4 interview talking points the candidate should use to pitch their experience
   for this specific role. Each point should be 1–2 sentences, specific and confident.
"""


# ── STATIC FALLBACK ───────────────────────────────────────────────────────────
# Uses actual resume/JD data to generate realistic content — no hardcoded
# placeholder bullets like "Developed software applications using Python."

def _pick_resume_bullets(parsed_resume: dict, job_title: str) -> list[str]:
    """Extracts actual resume experience bullets for rewriting."""
    experience = parsed_resume.get("experience", [])
    projects = parsed_resume.get("projects", [])
    bullets = []

    # Try to get actual resume lines from experience section
    for item in experience[:3]:
        if isinstance(item, str) and len(item) > 15:
            bullets.append(item)
        elif isinstance(item, dict):
            for key in ("description", "summary", "details", "bullets"):
                val = item.get(key, [])
                if isinstance(val, list):
                    bullets.extend(b for b in val if isinstance(b, str) and len(b) > 15)
                elif isinstance(val, str) and len(val) > 15:
                    bullets.append(val)

    # Fall back to project descriptions
    if len(bullets) < 2:
        for item in projects[:3]:
            if isinstance(item, str) and len(item) > 15:
                bullets.append(item)

    # If still empty, create from known skills
    if not bullets:
        skills = parsed_resume.get("skills", [])[:3]
        if skills:
            bullets.append(f"Developed solutions using {', '.join(skills)}")
        else:
            bullets.append("Delivered technical projects following industry best practices")

    return bullets[:4]


def _safe_company(name: str | None) -> str:
    """Returns clean company name or graceful alternative."""
    if name and name.lower() not in ("the company", "the organisation", "", "none", "null", "n/a"):
        return name
    return "your target organisation"


def _safe_title(title: str | None) -> str:
    """Returns a clean job title — never leads to 'None' or 'the role role' artifacts."""
    if title and title.lower() not in ("the role", "the target role", "the role role", "", "none", "null", "n/a"):
        return title
    return "role"


def _build_fallback(
    parsed_resume: dict,
    parsed_jd: dict,
    skills_gap: dict,
    score_data: dict,
) -> dict:
    """
    Rule-based fallback when Gemini is unavailable.
    Uses actual resume bullets and JD data — NEVER hardcoded placeholders.
    """
    job_title     = _safe_title(parsed_jd.get("job_title"))
    company_name  = _safe_company(parsed_jd.get("company_name"))
    exact_matches = skills_gap.get("exact_matches", [])
    semantic      = skills_gap.get("semantic_matches", [])
    missing       = skills_gap.get("missing_skills", [])
    seniority_fit = score_data.get("seniority_fit", {})
    candidate_name = parsed_resume.get("name", "You")

    # Use actual resume bullets for rewrites — always produce 3-4
    resume_bullets = _pick_resume_bullets(parsed_resume, job_title)

    resume_adjustments = []
    for i, bullet in enumerate(resume_bullets):
        if len(resume_adjustments) >= 4:
            break
        if i == 0:
            resume_adjustments.append({
                "section": "Professional Experience",
                "original_bullet": bullet,
                "optimized_bullet": (
                    f"While at {company_name}, "
                    f"{bullet.lower().rstrip('.')} — "
                    f"directly supporting the {job_title} position's core requirements "
                    f"with measurable outcomes."
                ),
                "reason_for_change": (
                    f"Adds quantifiable context and aligns your existing experience "
                    f"with the {job_title} position at {company_name}."
                ),
            })
        elif i == 1:
            resume_adjustments.append({
                "section": "Professional Experience",
                "original_bullet": bullet,
                "optimized_bullet": (
                    f"Leveraged expertise in "
                    f"{', '.join(exact_matches[:3]) if exact_matches else 'core technologies'} "
                    f"to deliver production-ready solutions aligned with "
                    f"{job_title} expectations."
                ),
                "reason_for_change": (
                    f"Highlights the exact skills the {job_title} JD emphasises, "
                    f"improving keyword alignment."
                ),
            })
        elif missing or semantic:
            keyword_ref = ', '.join(missing[:3]) if missing else semantic[0]['required']
            resume_adjustments.append({
                "section": "Project Experience",
                "original_bullet": bullet,
                "optimized_bullet": (
                    f"Applied {keyword_ref} to build scalable solutions, "
                    f"demonstrating practical expertise in this key requirement for the "
                    f"{job_title} position."
                ),
                "reason_for_change": (
                    f"Reframes project work to directly address the {job_title} JD's "
                    f"requirement for {keyword_ref}."
                ),
            })
        else:
            resume_adjustments.append({
                "section": "Project Experience",
                "original_bullet": bullet,
                "optimized_bullet": (
                    f"Architected and delivered a production-grade system that "
                    f"aligned with {job_title} best practices, achieving measurable "
                    f"improvements in efficiency and reliability."
                ),
                "reason_for_change": (
                    f"Strengthens the outcome-focused framing of your experience, "
                    f"which recruiters prioritise for {job_title} roles."
                ),
            })

    # Fallback if still too few rewrites
    resume_skills = parsed_resume.get("skills", [])[:5]
    while len(resume_adjustments) < 3:
        resume_adjustments.append({
            "section": "Skills & Projects",
            "original_bullet": "Built technical solutions using modern tools and frameworks.",
            "optimized_bullet": (
                f"Engineered end-to-end solutions leveraging "
                f"{', '.join(resume_skills[:3]) if resume_skills else 'industry-standard tools and frameworks'}, "
                f"directly aligning with the {job_title} role requirements."
            ),
            "reason_for_change": (
                f"Explicitly maps your technical toolkit to what the {job_title} JD demands."
            ),
        })

    # Build talking points from actual data — always 4
    talking_points = []
    if exact_matches:
        talking_points.append(
            f"Your expertise in {', '.join(exact_matches[:2])} is a strong match "
            f"for this {job_title} role. Lead with specific project outcomes "
            f"that demonstrate depth in these areas."
        )
    else:
        talked_about = candidate_name.split()[0] if candidate_name != "Candidate" else "You"
        talking_points.append(
            f"{talked_about} bring relevant technical experience that maps to "
            f"the {job_title} position — structure your narrative around outcomes, not just tasks."
        )

    if semantic:
        talking_points.append(
            f"Your skills in {semantic[0]['matched_with']} overlap significantly with "
            f"the JD's requirement for {semantic[0]['required']}. Emphasise this "
            f"connection explicitly in your interview responses."
        )
    elif exact_matches:
        talking_points.append(
            f"Be ready to discuss how you've applied {', '.join(exact_matches[:3])} "
            f"in real-world contexts — depth of application matters more than listing skills."
        )
    else:
        talking_points.append(
            f"Focus your interview narrative on projects where you solved problems "
            f"similar to those described in the JD — show, don't just tell."
        )

    if company_name and company_name.lower() not in ("your target organisation", ""):
        talking_points.append(
            f"Research {company_name}'s recent product launches or engineering blog "
            f"before the interview — referencing their stack and challenges shows "
            f"genuine interest and preparation."
        )
    else:
        talking_points.append(
            "Research the company's recent products, engineering blog, or tech stack "
            "before the interview. Walking in informed about their work makes a strong impression."
        )

    # Fourth talking point — always present
    if missing:
        talking_points.append(
            f"Be upfront about building expertise in {', '.join(missing[:2])} "
            f"by mentioning self-directed projects or coursework. Framing gaps as "
            f"growth areas signals self-awareness and initiative."
        )
    else:
        talking_points.append(
            f"Prepare 2-3 specific questions about the team's technical stack and "
            f"current challenges — asking thoughtful questions signals genuine engagement."
        )

    # NOTE: `used_fallback` is deliberately excluded from this return dict.
    # It is logged internally and NEVER exposed to the API response.
    return {
        "match_percentage":        score_data.get("match_percentage", 0),
        "verdict":                 score_data.get("verdict", "Analysis complete"),
        "seniority_alignment": {
            "aligned":         seniority_fit.get("aligned", False),
            "required_years":  seniority_fit.get("required_years", 0),
            "candidate_years": seniority_fit.get("candidate_years", 0),
            "evaluation":      seniority_fit.get("evaluation", ""),
        },
        "skills_mapping": {
            "exact_matches":    skills_gap.get("exact_matches", []),
            "semantic_matches": [
                {
                    "required":      m["required"],
                    "matched_with":  m["matched_with"],
                    "similarity":    m["similarity_score"],
                }
                for m in skills_gap.get("semantic_matches", [])
            ],
            "missing_skills":   skills_gap.get("missing_skills", []),
            "match_pct":        skills_gap.get("match_pct", 0),
        },
        "resume_adjustments":        resume_adjustments,
        "interview_talking_points":  talking_points,
    }


# ── MAIN ENTRY POINT ──────────────────────────────────────────────────────────

def generate_matching_ai_feedback(
    parsed_resume: dict,
    resume_full_text: str,
    parsed_jd: dict,
    skills_gap: dict,
    score_data: dict,
) -> dict:
    """
    Calls Gemini to generate resume bullet rewrites and interview talking points.
    Merges LLM output with programmatic scores from ats_match_score.py.
    Falls back to rule-based response on API failure.

    Returns the complete response dict — NEVER includes 'used_fallback'.
    """
    seniority_fit = score_data.get("seniority_fit", {})

    # Build the shared response skeleton (scores are always programmatic)
    base_payload = {
        "match_percentage": score_data.get("match_percentage", 0),
        "verdict":          score_data.get("verdict", ""),
        "seniority_alignment": {
            "aligned":         seniority_fit.get("aligned", False),
            "required_years":  seniority_fit.get("required_years", 0),
            "candidate_years": seniority_fit.get("candidate_years", 0),
            "evaluation":      seniority_fit.get("evaluation", ""),
        },
        "skills_mapping": {
            "exact_matches": skills_gap.get("exact_matches", []),
            "semantic_matches": [
                {
                    "required":     m["required"],
                    "matched_with": m["matched_with"],
                    "similarity":   m["similarity_score"],
                }
                for m in skills_gap.get("semantic_matches", [])
            ],
            "missing_skills": skills_gap.get("missing_skills", []),
            "match_pct":      skills_gap.get("match_pct", 0),
        },
    }

    # Build prompt
    try:
        prompt = _build_prompt(
            parsed_resume, resume_full_text, parsed_jd, skills_gap, score_data
        )
    except Exception as e:
        logger.error(f"Prompt build failed: {e}")
        return _build_fallback(parsed_resume, parsed_jd, skills_gap, score_data)

    # Try Groq directly with retry across multiple model names (no probe — JD parser works fine without it)
    _FEEDBACK_MODELS = [
        "llama-3.3-70b-versatile",
        "llama-3.1-8b-instant",
    ]

    for model_name in _FEEDBACK_MODELS:
        try:
            from openai import OpenAI
            client = OpenAI(api_key=_get_api_key(), base_url=GROQ_BASE_URL)
            response = client.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "system", "content": SYSTEM_INSTRUCTION},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.25,
                max_tokens=2048,
            )

            text = response.choices[0].message.content
            if not text or not text.strip():
                continue

            from app.modules.shared.llm_service import _parse_llm_json
            llm_output = _parse_llm_json(text)
            if llm_output is None:
                continue

            # Merge LLM creative output with programmatic scores
            base_payload["resume_adjustments"]       = llm_output.get("resume_adjustments", [])
            base_payload["interview_talking_points"] = llm_output.get("interview_talking_points", [])

            adjustments = base_payload["resume_adjustments"]
            if not adjustments or len(adjustments) == 0:
                logger.info(f"Groq returned 0 rewrites — using deterministic fallback.")
                fallback = _build_fallback(parsed_resume, parsed_jd, skills_gap, score_data)
                base_payload["resume_adjustments"] = fallback.get("resume_adjustments", [])
                base_payload["interview_talking_points"] = fallback.get("interview_talking_points", base_payload["interview_talking_points"])
            else:
                logger.info(
                    f"AI feedback generated ({model_name}): "
                    f"{len(adjustments)} rewrites | "
                    f"{len(base_payload['interview_talking_points'])} talking points"
                )
            return base_payload

        except Exception as e:
            err_str = str(e)
            if "429" in err_str or "Rate limit" in err_str or "quota" in err_str.lower():
                logger.warning(f"Groq quota exhausted ({model_name}) — trying next model.")
                continue
            logger.warning(f"Groq API error ({model_name}): {e}")
            continue

    # All models exhausted
    logger.warning("Groq unavailable — using rule-based fallback for AI feedback.")
    return _build_fallback(parsed_resume, parsed_jd, skills_gap, score_data)
