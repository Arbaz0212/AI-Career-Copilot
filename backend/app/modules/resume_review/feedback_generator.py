# feedback_generator.py
# AI feedback layer — uses Gemini structured output with fallback chain.
# Falls back to deterministic feedback when Gemini is unavailable.

from __future__ import annotations
import os
import json
import logging

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

logger = logging.getLogger(__name__)


def _get_rr_pool_keys() -> list[str]:
    """Returns unique Resume Review pool keys (GROQ_API_KEY_1, 2, 5)."""
    keys = []
    for var in ("GROQ_API_KEY_1", "GROQ_API_KEY_2", "GROQ_API_KEY_5"):
        k = os.getenv(var)
        if k and k.strip():
            keys.append(k.strip())
    if not keys:
        raise EnvironmentError("No Groq API key found in RR pool (GROQ_API_KEY_1/2/5).")
    seen = set()
    unique = []
    for k in keys:
        if k not in seen:
            seen.add(k)
            unique.append(k)
    return unique


SYSTEM_INSTRUCTION = (
    "You are a senior resume reviewer at a top recruitment firm, reviewing resumes "
    "for ANY job role — technical, QA, marketing, finance, design, operations, etc. "
    "You give honest, specific, actionable feedback grounded ONLY in what's in the resume. "
    "Never invent experience the candidate doesn't have. "
    "Keep each string SHORT (under 25 words) so the response stays well-formed. "
    "Respond ONLY with valid JSON matching the requested schema. No markdown, no code fences."
)

PROMPT_TEMPLATE = """Resume for {name} — self-identified role: "{role}" ({seniority} level, {role_source}).

Score breakdown:
- Completeness: {s_complete}/100
- Writing Quality: {s_writing}/100
- ATS Format: {s_format}/100
- Content Depth: {s_depth}/100
- Final: {final}/100

Issues found by automated scorer:
{issues}

Skills listed on resume: {skills}
Summary: "{summary}"

Sample experience bullets:
{exp_sample}

Sample project bullets:
{proj_sample}

Tasks:
1. Write a 2-sentence executive summary of this resume.
2. List 3 genuine strengths visible in this resume (specific, not generic).
3. List 3 critical issues to fix (specific, prioritised).
4. Rewrite up to 4 of the weakest bullets above — same role/scope, but with stronger action verb + a plausible quantified detail.
5. Suggest up to 3 ADJACENT skills/tools commonly used alongside what's already listed.
6. One sentence: realistic interview-readiness assessment.
7. The single highest-impact action for week 1.

Respond ONLY with valid JSON matching this schema:
{{
  "executive_summary": "string",
  "top_strengths": ["string", "string", "string"],
  "critical_issues": ["string", "string", "string"],
  "bullet_rewrites": [{{"original": "string", "rewritten": "string", "why": "string"}}],
  "skill_suggestions": [{{"skill": "string", "reason": "string"}}],
  "interview_readiness": "string",
  "week_1_action": "string"
}}
No markdown, no code fences.
"""


def _build_prompt(score_result: dict, profile: dict, parsed: dict) -> str:
    from .scoring_engine import _extract_bullets

    all_issues = score_result.get("issues", [])
    exp_bullets  = _extract_bullets(parsed.get("experience", []))[:4]
    proj_bullets = _extract_bullets(parsed.get("projects", []))[:3]

    d = score_result["dimension_scores"]
    return PROMPT_TEMPLATE.format(
        name=profile.get("name", "Candidate"),
        role=profile["detected_role"],
        seniority=profile["seniority"],
        role_source=profile.get("role_source", "resume"),
        s_complete=d["completeness"]["score"],
        s_writing=d["writing_quality"]["score"],
        s_format=d["ats_format"]["score"],
        s_depth=d["content_depth"]["score"],
        final=score_result["final_score"],
        issues="\n".join(f"- {i}" for i in all_issues[:8]) or "- None",
        skills=", ".join(profile.get("skills", [])[:20]) or "None listed",
        summary=profile.get("summary", "")[:250],
        exp_sample="\n".join(f"- {b}" for b in exp_bullets) or "- None",
        proj_sample="\n".join(f"- {b}" for b in proj_bullets) or "- None",
    )


def _call(prompt: str) -> dict:
    """Try Groq (RR pool) with model fallback chain. Fast-fails on 429."""

    from app.modules.shared.llm_service import is_rr_api_available, generate_with_timeout_rr, _parse_llm_json

    if not is_rr_api_available():
        raise ConnectionError("Groq API (RR pool) not reachable (probe failed)")

    keys = _get_rr_pool_keys()
    models = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"]

    for key in keys:
        for model_name in models:
            try:
                from openai import OpenAI
                client = OpenAI(api_key=key, base_url="https://api.groq.com/openai/v1")

                resp = client.chat.completions.create(
                    model=model_name,
                    messages=[
                        {"role": "system", "content": SYSTEM_INSTRUCTION},
                        {"role": "user", "content": prompt},
                    ],
                    temperature=0.2,
                    max_tokens=4096,
                )
                text = resp.choices[0].message.content
                if not text or not text.strip():
                    continue
                result = _parse_llm_json(text)
                if result is None:
                    continue
                logger.info(f"Groq feedback via {model_name}")
                return result

            except Exception as e:
                err_str = str(e)
                if "429" in err_str or "Rate limit" in err_str or "quota" in err_str.lower():
                    logger.warning(f"Groq quota exhausted ({model_name})")
                    continue
                logger.warning(f"Groq error ({model_name}): {e}")
                continue

    raise ConnectionError("All Groq models/keys failed")


def _deterministic_fallback(score_result: dict, profile: dict) -> dict:
    issues = score_result.get("issues", [])
    wins   = score_result.get("wins", [])
    boosts = score_result.get("score_boosts", [])
    final  = score_result["final_score"]
    role   = profile["detected_role"]

    return {
        "executive_summary": f"Resume scored {final}/100 for {role}. {wins[0] if wins else 'Solid structure overall.'} {'Priority: ' + issues[0] if issues else 'See breakdown for details.'}",
        "top_strengths": wins[:3] or ["Resume has a clear structure"],
        "critical_issues": issues[:3] or ["Review the full score breakdown"],
        "bullet_rewrites": [],
        "skill_suggestions": [],
        "interview_readiness": "Likely to pass initial ATS screening." if final >= 75 else "May pass ATS but needs strengthening." if final >= 55 else "Needs improvement before applying.",
        "week_1_action": boosts[0]["action"] if boosts else "Review the issues list and address the top item",
        "_fallback": True,
    }


def generate_feedback(score_result: dict, profile: dict, parsed: dict) -> dict:
    try:
        prompt = _build_prompt(score_result, profile, parsed)
    except Exception as e:
        logger.error(f"Prompt build failed: {e}")
        return _deterministic_fallback(score_result, profile)

    try:
        result = _call(prompt)
        result["_fallback"] = False
        return result
    except Exception as e:
        logger.warning(f"Gemini unavailable - using fallback: {e}")
        return _deterministic_fallback(score_result, profile)
