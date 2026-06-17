"""
app/modules/jd_match/resume_exporter.py
Tailored Resume Export — the premium "one-click" feature.

Transforms the user's resume into a role-optimised version:
  1. Reorders skills section to show JD-relevant skills first
  2. Inserts missing keywords naturally into the summary
  3. Rewrites experience bullets using AI feedback adjustments
  4. Adds contact info prominence
  5. Generates a clean HTML preview + plain text export

This is the feature that turns analysis into action — users pay for this.
"""

from __future__ import annotations
import re
import logging

logger = logging.getLogger(__name__)


# ── HELPER ──────────────────────────────────────────────────────────────────────

def _deduplicate_ordered(items: list[str]) -> list[str]:
    """Deduplicates while preserving order."""
    seen = set()
    return [x for x in items if not (x in seen or seen.add(x))]


def _normalise(s: str) -> str:
    return s.lower().strip()


# ── SKILLS REORDERING ──────────────────────────────────────────────────────────

def reorder_skills(
    candidate_skills: list[str],
    jd_hard_skills: list[str],
    exact_matches: list[str],
    semantic_matches: list[dict],
) -> list[str]:
    """
    Reorders the candidate's skills section for JD relevance:
    1. Exact matches (in JD match order)
    2. Semantic matches (high similarity first)
    3. Other candidate skills (still valuable context)
    """
    exact_set = {_normalise(s) for s in exact_matches}
    semantic_best = set()
    for sm in semantic_matches:
        match = sm.get("matched_with", "")
        if match:
            semantic_best.add(_normalise(match))

    # Build ranked list
    result = []

    # 1. Exact matches in JD order
    jd_norm = [_normalise(s) for s in jd_hard_skills]
    for jd_skill in jd_hard_skills:
        norm = _normalise(jd_skill)
        if norm in exact_set and jd_skill not in result:
            result.append(jd_skill)

    # 2. Semantic matches (already have the skill but named differently)
    for sm in semantic_matches:
        matched = sm.get("matched_with", "")
        if matched and _normalise(matched) not in exact_set:
            # Find the original casing from candidate skills
            for cs in candidate_skills:
                if _normalise(cs) == _normalise(matched):
                    if cs not in result:
                        result.append(cs)
                    break

    # 3. Other candidate skills not already listed
    for cs in candidate_skills:
        norm = _normalise(cs)
        if norm not in exact_set and norm not in semantic_best:
            if cs not in result:
                result.append(cs)

    return result


# ── SUMMARY OPTIMISATION ──────────────────────────────────────────────────────

def optimise_summary(
    original_summary: str,
    jd_title: str,
    exact_matches: list[str],
    missing_skills: list[str],
) -> str:
    """
    Enhances a resume summary to include JD-relevant keywords naturally.
    """
    if not original_summary or not original_summary.strip():
        # No existing summary — generate one
        if exact_matches:
            return (
                f"Results-driven professional with proven expertise in "
                f"{', '.join(exact_matches[:4])}. "
                f"Aiming to leverage deep technical skills and industry experience "
                f"to deliver impactful solutions as a {jd_title}."
            )
        return (
            f"Experienced professional seeking a {jd_title} position, "
            f"bringing a strong track record of delivering results "
            f"and rapidly acquiring new competencies."
        )

    summary = original_summary.strip()

    # Check if key skills are already in the summary
    summary_lower = summary.lower()
    skills_to_add = [s for s in exact_matches[:4] if _normalise(s) not in summary_lower]

    if skills_to_add:
        # Find a good insertion point — typically at the end of the first sentence
        sentences = re.split(r'(?<=[.!?])\s+', summary)
        if len(sentences) >= 1:
            # Insert skills after the first sentence
            skills_phrase = (
                f"Skilled in {', '.join(skills_to_add[:3])}"
            )
            if len(sentences) == 1:
                # For single-sentence summaries, append the skills
                sentences[0] = sentences[0].rstrip('.') + f", with strong skills in {', '.join(skills_to_add[:3])}."
            else:
                sentences.insert(1, f" {skills_phrase}. ")
            summary = " ".join(s.strip() for s in sentences if s.strip())

    return summary


# ── BULLET OPTIMISATION ────────────────────────────────────────────────────────

def optimise_experience_bullets(
    experience: list,
    adjustments: list[dict],
) -> list[dict]:
    """
    Applies the AI-suggested resume adjustments to actual experience bullets.
    Returns enhanced experience entries.
    """
    if not isinstance(experience, list):
        return []

    enhanced = []
    for item in experience[:5]:
        if isinstance(item, str):
            entry = {"description": item, "optimised": item}
            # Check if any adjustment's original bullet matches
            for adj in adjustments:
                if adj.get("original_bullet", "").strip().lower() in item.lower():
                    entry["optimised"] = adj.get("optimized_bullet", item)
                    break
            enhanced.append(entry)
        elif isinstance(item, dict):
            entry = dict(item)
            # Get description
            desc = ""
            for key in ("description", "summary", "details"):
                val = item.get(key, "")
                if isinstance(val, str):
                    desc = val
                    break
                elif isinstance(val, list):
                    desc = " ".join(str(b) for b in val[:3])
                    break

            if desc:
                for adj in adjustments:
                    orig = adj.get("original_bullet", "").strip().lower()
                    if orig and (orig in desc.lower() or desc.lower().startswith(orig)):
                        entry["optimised_bullet"] = adj.get("optimized_bullet", desc)
                        entry["reason_for_change"] = adj.get("reason_for_change", "")
                        break
                else:
                    entry["optimised_bullet"] = desc
            enhanced.append(entry)

    return enhanced


# ── FULL RESUME GENERATION ────────────────────────────────────────────────────

def generate_tailored_resume(
    parsed_resume: dict,
    parsed_jd: dict,
    skills_gap: dict,
    adjustments: list[dict],
) -> dict:
    """
    Generates a complete tailored resume document.

    Returns a dict with:
        - version: "v1"
        - generated_for: job title + company
        - tailored: dict of the optimised sections
        - changes_summary: list of what was changed
        - html_preview: ready-to-render HTML string
        - plain_text: plain text version
    """
    job_title = parsed_jd.get("job_title", "the role") or "the role"
    company = parsed_jd.get("company_name") or "your target company"

    candidate_name = parsed_resume.get("name", "Candidate")
    candidate_email = parsed_resume.get("email", "")
    candidate_phone = parsed_resume.get("phone", "")
    candidate_linkedin = parsed_resume.get("linkedin", "")
    candidate_github = parsed_resume.get("github", "")

    # 1. Reorder skills
    original_skills = parsed_resume.get("skills", [])
    exact = skills_gap.get("exact_matches", [])
    semantic = skills_gap.get("semantic_matches", [])
    jd_hard = parsed_jd.get("hard_skills", [])
    missing = skills_gap.get("missing_skills", [])

    reordered = reorder_skills(original_skills, jd_hard, exact, semantic)
    skills_to_add = [s for s in exact if _normalise(s) not in (_normalise(x) for x in original_skills)]

    # 2. Optimise summary
    original_summary = parsed_resume.get("summary", "") or ""
    optimised_summary = optimise_summary(original_summary, job_title, exact, missing)

    # 3. Optimise experience
    original_experience = parsed_resume.get("experience", [])
    optimised_experience = optimise_experience_bullets(original_experience, adjustments)

    # 4. Add missing skills that are exact matches (they should be in the resume)
    if skills_to_add:
        reordered = skills_to_add + [s for s in reordered if _normalise(s) not in (_normalise(x) for x in skills_to_add)]
        reordered = _deduplicate_ordered(reordered)

    # 5. Build changes summary
    changes = []
    if original_summary != optimised_summary:
        changes.append("Summary optimised with role-specific keywords")
    if reordered != original_skills:
        changes.append(f"Skills reordered to highlight {len(exact)} exact matches")
    if len(optimised_experience) > 0:
        enhanced_count = sum(1 for e in optimised_experience if "optimised_bullet" in e and e.get("reason_for_change"))
        if enhanced_count > 0:
            changes.append(f"{enhanced_count} experience bullets rewritten for better keyword alignment")
    if skills_to_add:
        changes.append(f"Added {len(skills_to_add)} missing skills to skills section: {', '.join(skills_to_add[:4])}")

    # ── Build plain text resume ──
    lines = []
    if candidate_name:
        lines.append(candidate_name.upper())
    contact_parts = [p for p in [candidate_email, candidate_phone, candidate_linkedin, candidate_github] if p]
    if contact_parts:
        lines.append(" | ".join(contact_parts))
    lines.append("")

    # Summary
    if optimised_summary:
        lines.append("PROFESSIONAL SUMMARY")
        lines.append(optimised_summary)
        lines.append("")

    # Skills
    if reordered:
        lines.append("SKILLS")
        lines.append(", ".join(reordered))
        lines.append("")

    # Experience
    if optimised_experience:
        lines.append("EXPERIENCE")
        for entry in optimised_experience:
            bullet = entry.get("optimised_bullet") or entry.get("description", "")
            if bullet:
                lines.append(f"- {bullet}")
        lines.append("")

    # Education
    education = parsed_resume.get("education", [])
    if education and isinstance(education, list):
        lines.append("EDUCATION")
        for edu in education:
            if isinstance(edu, str):
                lines.append(f"- {edu}")
            elif isinstance(edu, dict):
                parts = [edu.get(k, "") for k in ("degree", "institution", "year") if edu.get(k)]
                if parts:
                    lines.append(f"- {', '.join(parts)}")

    plain_text = "\n".join(lines)

    # ── Build HTML preview ──
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Tailored Resume — {candidate_name}</title>
<style>
  body {{ font-family: 'Segoe UI', Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #1a1a2e; }}
  h1 {{ font-size: 28px; margin-bottom: 4px; border-bottom: 2px solid #2563eb; padding-bottom: 8px; }}
  h2 {{ font-size: 18px; color: #2563eb; margin-top: 24px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px; }}
  .contact {{ color: #64748b; font-size: 14px; margin-bottom: 20px; }}
  .summary {{ line-height: 1.6; margin-bottom: 16px; }}
  .skill {{ display: inline-block; background: #eef2ff; color: #4338ca; padding: 4px 12px; border-radius: 12px; font-size: 13px; margin: 3px; }}
  .skill.match {{ background: #d1fae5; color: #065f46; }}
  .skill.missing {{ background: #fef2f2; color: #991b1b; }}
  .bullet {{ margin: 6px 0; line-height: 1.5; }}
  .change {{ background: #f0f9ff; border-left: 3px solid #2563eb; padding: 12px 16px; margin: 16px 0; border-radius: 4px; font-size: 14px; }}
  .change:before {{ content: "âœ… "; }}
  .badge {{ display: inline-block; background: #2563eb; color: white; padding: 2px 10px; border-radius: 10px; font-size: 11px; }}
  .label {{ font-size: 12px; color: #64748b; }}
</style>
</head>
<body>
<div class="label">Tailored for: {job_title} at {company}</div>
<h1>{candidate_name}</h1>
<div class="contact">{' | '.join(contact_parts)}</div>

<h2>Professional Summary</h2>
<p class="summary">{optimised_summary}</p>

<h2>Skills</h2>
<div>"""
    for skill in reordered:
        css = "skill match" if _normalise(skill) in (_normalise(s) for s in exact) else "skill"
        html += f'<span class="{css}">{skill}</span>\n'

    html += """</div>

<h2>Experience</h2>"""
    for entry in optimised_experience:
        bullet = entry.get("optimised_bullet") or entry.get("description", "")
        reason = entry.get("reason_for_change", "")
        if bullet:
            html += f'<p class="bullet">â€¢ {bullet}</p>'
            if reason:
                html += f'<div class="change">{reason}</div>'

    html += """
<h2>Changes Applied</h2>"""
    for change in changes:
        html += f'<div class="change">{change}</div>'

    html += """
</body>
</html>"""

    return {
        "version": "v1",
        "generated_for": f"{job_title} at {company}",
        "tailored": {
            "contact": {
                "name": candidate_name,
                "email": candidate_email,
                "phone": candidate_phone,
                "linkedin": candidate_linkedin,
                "github": candidate_github,
            },
            "summary": optimised_summary,
            "skills": reordered,
            "experience": optimised_experience,
            "changes_applied": changes,
        },
        "html_preview": html,
        "plain_text": plain_text,
    }
