# app/modules/jd_match/premium_engine.py
# Premium value-add engine for JD match.
# Produces: improvement_path, skill_analysis (with learning resources),
# interview_kit (talking points + technical questions), cover_letter_draft,
# and the complete summary block.
# All content is data-driven — never hardcoded placeholders.

from __future__ import annotations
import os
import json
import logging
from .learning_resources import get_resources, get_how_to_acquire, estimate_acquisition_time

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

logger = logging.getLogger(__name__)


# ── HELPER: Clean company name ─────────────────────────────────────────────────

def _safe_company(company: str | None) -> str:
    """Returns a clean company name or a graceful alternative."""
    if company and company.lower() not in ("the company", "the organisation", "", "none", "null", "n/a", "the organisation"):
        return company
    return "your organisation"

def _safe_title(title: str | None) -> str:
    """Returns a clean job title — never 'the role' since templates add 'the' themselves."""
    if title and title.lower() not in ("the role", "the target role", "the role role", "", "none", "null", "n/a"):
        return title
    return "role"


# ── CONFIDENCE SCORE ──────────────────────────────────────────────────────────

def _compute_confidence(skills_gap: dict, parsed_jd: dict, match_percentage: int = 0) -> str:
    """Determines confidence level based on data completeness and match score."""
    missing = len(skills_gap.get("missing_skills", []))
    total = skills_gap.get("total_required", 0) or max(missing + skills_gap.get("total_matched", 0), 1)
    has_title = bool(parsed_jd.get("job_title")) and parsed_jd.get("job_title", "").lower() not in ("the role", "the target role", "", "none", "null", "n/a")
    has_company = bool(parsed_jd.get("company_name"))
    has_years = bool(parsed_jd.get("required_experience_years"))

    if has_title and has_company and has_years and missing <= total * 0.3:
        return "high"
    elif has_title and missing <= total * 0.5:
        return "medium"
    elif match_percentage >= 70:
        # High score with missing metadata — still medium, not low
        return "medium"
    else:
        return "low"


# ── SUMMARY BLOCK ─────────────────────────────────────────────────────────────

def build_summary(
    match_percentage: int,
    verdict: str,
    parsed_jd: dict,
    skills_gap: dict,
) -> dict:
    """Builds the premium summary block."""
    raw_title = parsed_jd.get("job_title")
    # Determine if we have a real job title from the JD
    has_real_title = bool(raw_title) and raw_title.lower() not in (
        "the role", "the target role", "the role role", "", "none", "null", "n/a"
    )
    display_title = raw_title if has_real_title else "Target Role"
    return {
        "overall_score": match_percentage,
        "verdict": verdict,
        "confidence": _compute_confidence(skills_gap, parsed_jd, match_percentage),
        "job_title": display_title,
        "company_name": _safe_company(parsed_jd.get("company_name")),
        "target_role": display_title,
    }


# ── SKILL ANALYSIS ────────────────────────────────────────────────────────────

def _compute_impact(missing_count: int, total_required: int) -> str:
    """Estimates % match gain from learning a missing skill."""
    if total_required == 0:
        return "+5%"
    per_skill = 100 / total_required
    gain = round(per_skill * 0.7)  # 70% of the per-skill value
    return f"+{max(gain, 3)}%"


def _get_priority(impact_str: str) -> str:
    """Maps impact to priority level."""
    num = int(impact_str.strip("+%"))
    if num >= 10:
        return "critical"
    elif num >= 6:
        return "high"
    elif num >= 4:
        return "medium"
    else:
        return "low"


def _get_current_status(skill: str, exact_matches: list[str], semantic_matches: list[dict]) -> str:
    """Determines current status of a skill."""
    if skill in exact_matches:
        return "matched"
    for sm in semantic_matches:
        if sm["required"] == skill:
            return "partial"
    return "missing"


def _build_resume_action(skill: str, job_title: str) -> str:
    """Generates a concrete resume action for a missing skill."""
    templates = [
        f"Add a bullet point describing your experience with {skill}, "
        f"even if from a personal project or coursework — recruiters scan for this keyword in {job_title} positions.",
        f"In your experience section, mention a specific outcome where {skill} was applied — "
        f"e.g., 'implemented {skill} to achieve X result'.",
        f"If you've used {skill} in any capacity, ensure it appears in your Skills section "
        f"and at least once in your Experience bullets for this application.",
    ]
    # Deterministic selection based on skill name
    idx = sum(ord(c) for c in skill) % len(templates)
    return templates[idx]


def build_skill_analysis(
    skills_gap: dict,
    parsed_jd: dict,
    parsed_resume: dict,
) -> dict:
    """
    Builds the detailed skill analysis with learning resources,
    improvement plan, strengths, and quick wins.
    """
    exact_matches = skills_gap.get("exact_matches", [])
    semantic_matches = skills_gap.get("semantic_matches", [])
    missing_skills = skills_gap.get("missing_skills", [])
    soft_gaps = skills_gap.get("soft_skill_gaps", [])
    match_pct = skills_gap.get("match_pct", 0)
    total_required = skills_gap.get("total_required", 0) or len(missing_skills) + len(exact_matches) + len(semantic_matches)
    total_matched = skills_gap.get("total_matched", 0) or len(exact_matches) + len(semantic_matches)
    job_title = _safe_title(parsed_jd.get("job_title"))

    # Build improvement plan for each missing skill
    improvement_plan = []
    for skill in missing_skills[:8]:  # max 8 skills in plan
        impact = _compute_impact(len(missing_skills), max(total_required, 1))
        resources = get_resources(skill)
        how_to = get_how_to_acquire(skill)
        timeline = estimate_acquisition_time(skill)

        item = {
            "skill": skill,
            "priority": _get_priority(impact),
            "impact": impact,
            "current_status": _get_current_status(skill, exact_matches, semantic_matches),
            "how_to_acquire": how_to,
            "resume_action": _build_resume_action(skill, job_title),
            "timeline": timeline,
        }
        if resources:
            item["learning_resources"] = resources
        improvement_plan.append(item)

    # Identify strengths (exact + semantic matches with high similarity)
    strengths = []
    if exact_matches:
        top_exact = exact_matches[:3]
        strengths.append(f"Your expertise in {', '.join(top_exact)} is a strong match for this role")
    if semantic_matches:
        for sm in semantic_matches[:2]:
            sim = sm.get("similarity_score", sm.get("similarity", 0))
            if sim >= 80:
                strengths.append(
                    f"Your {sm['matched_with']} skills overlap strongly with the "
                    f"JD's need for {sm['required']} ({sim}% similarity)"
                )
    if not strengths:
        strengths.append("Your resume shows initiative and domain familiarity — building targeted skills will strengthen alignment")

    # Quick wins
    quick_wins = []
    if exact_matches:
        quick_wins.append("Your existing skill matches are strong — lead your resume with these keywords prominently")
    if soft_gaps:
        quick_wins.append(f"Add {', '.join(soft_gaps[:2])} to your summary or skills section — the JD specifically requires these")
    if not missing_skills:
        quick_wins.append("You already have all the skills this role requires — focus on interview preparation")
    if not quick_wins:
        quick_wins.append(f"Learning {', '.join(missing_skills[:2])} would significantly boost your match for {job_title}")

    return {
        "exact_matches": exact_matches,
        "semantic_matches": semantic_matches,
        "missing_skills": missing_skills,
        "match_percentage": match_pct,
        "total_required": total_required,
        "matched_count": total_matched,
        "improvement_plan": improvement_plan,
        "strengths": strengths[:3],
        "quick_wins": quick_wins[:3],
    }


# ── IMPROVEMENT PATH ──────────────────────────────────────────────────────────

def build_improvement_path(
    current_score: int,
    skills_gap: dict,
    section_scores: dict,
) -> dict:
    """
    Builds a step-by-step improvement path from current score to max achievable score.
    Each step shows: action, potential_gain, effort, priority.
    """
    missing = skills_gap.get("missing_skills", [])
    semantic = skills_gap.get("semantic_matches", [])
    soft_gaps = skills_gap.get("soft_skill_gaps", [])

    steps = []
    total_gain = 0

    # Each missing skill adds ~5-8%
    if missing:
        gain = min(len(missing) * 7, 25)
        total_gain += gain
        steps.append({
            "action": f"Learn or add these missing skills to your resume: {', '.join(missing[:5])}",
            "potential_gain": f"+{gain}",
            "effort": "2-4 weeks of focused learning",
            "priority": "high",
        })

    # Semantic matches can be improved
    if semantic:
        gain = min(len(semantic) * 4, 15)
        total_gain += gain
        steps.append({
            "action": f"Replace or supplement skills like {semantic[0]['matched_with']} → {semantic[0]['required']} in your resume to improve exact keyword matching",
            "potential_gain": f"+{gain}",
            "effort": "1-2 hours of resume editing",
            "priority": "medium",
        })

    # Soft skills
    if soft_gaps:
        gain = min(len(soft_gaps) * 3, 10)
        total_gain += gain
        steps.append({
            "action": f"Add these soft skills to your profile: {', '.join(soft_gaps[:3])}",
            "potential_gain": f"+{gain}",
            "effort": "30 minutes of resume refinement",
            "priority": "low",
        })

    # Content depth improvement
    content_score = section_scores.get("content_depth", {}).get("score", 50) if isinstance(section_scores, dict) else 50
    if content_score < 70:
        gain = 8
        total_gain += gain
        steps.append({
            "action": "Add quantifiable achievements (numbers, percentages) to your experience bullets",
            "potential_gain": f"+{gain}",
            "effort": "2-3 hours of resume rewriting",
            "priority": "medium",
        })

    target_score = min(current_score + total_gain, 97)

    # Always have at least one action step, even when no critical gaps found
    if not steps:
        steps.append({
            "action": "Your resume already aligns well with this role. Focus on tailoring your cover letter and preparing specific project examples for the interview.",
            "potential_gain": "+3",
            "effort": "1-2 hours of interview preparation",
            "priority": "low",
        })

    # Estimated effort
    total_weeks = 0
    for s in steps:
        if "week" in s["effort"].lower():
            import re
            nums = re.findall(r'\d+', s["effort"])
            if nums:
                total_weeks += int(nums[0])
    estimated = f"{max(total_weeks, 1)}-{max(total_weeks + 2, 3)} weeks" if total_weeks > 0 else "1-2 weeks"

    return {
        "current_score": current_score,
        "target_score": target_score,
        "max_achievable_score": target_score,
        "steps": sorted(steps, key=lambda s: 0 if s["priority"] == "high" else 1 if s["priority"] == "medium" else 2),
        "estimated_effort": estimated,
    }


# ── INTERVIEW KIT ─────────────────────────────────────────────────────────────

def _generate_talking_points(
    parsed_resume: dict,
    parsed_jd: dict,
    skills_gap: dict,
    score_data: dict,
) -> list[str]:
    """Generates personalised interview talking points."""
    points = []
    name = parsed_resume.get("name", "You")
    job_title = _safe_title(parsed_jd.get("job_title"))
    company = _safe_company(parsed_jd.get("company_name"))
    exact = skills_gap.get("exact_matches", [])
    semantic = skills_gap.get("semantic_matches", [])
    missing = skills_gap.get("missing_skills", [])
    seniority = score_data.get("seniority_fit", {})
    candidate_years = seniority.get("candidate_years", 0)
    required_years = seniority.get("required_years", 0)
    skills = parsed_resume.get("skills", [])

    # Lead with strengths — specific, not generic
    if exact:
        points.append(
            f"Your expertise in {', '.join(exact[:2])} is exactly what "
            f"this {job_title} position requires. Lead your responses "
            f"with specific outcomes from projects where you applied these skills."
        )
    elif semantic:
        sim = semantic[0]
        points.append(
            f"Your {sim['matched_with']} experience is closely related to the JD's "
            f"need for {sim['required']}. Frame your narrative around how this "
            f"adjacent expertise prepares you for the role."
        )
    elif skills:
        points.append(
            f"Your background in {', '.join(skills[:3])} maps to core needs of "
            f"this {job_title} position. Structure your examples around outcomes, "
            f"not just responsibilities."
        )

    # Experience narrative
    if candidate_years and required_years:
        points.append(
            f"With {candidate_years} years of experience against the {required_years} requested, "
            f"focus your narrative on progressive responsibility and measurable impact — "
            f"this signals readiness beyond just years on paper."
        )
    elif candidate_years:
        points.append(
            f"Your {candidate_years} years of experience provide a solid foundation "
            f"for this role. Be ready to discuss how your breadth of experience "
            f"maps to the specific challenges in the job description."
        )

    # Address gaps proactively — only if there are real gaps
    if missing:
        points.append(
            f"Be upfront about building expertise in {', '.join(missing[:2])} "
            f"by mentioning self-directed projects or coursework. Framing gaps as "
            f"growth areas signals self-awareness and initiative."
        )

    # Company research tip — graceful when company is unknown
    if company and company.lower() != "your organisation":
        points.append(
            f"Before the interview, research {company}'s recent product launches, "
            f"engineering blog, or tech stack announcements. Referencing their specific "
            f"challenges shows genuine interest and thorough preparation."
        )
    else:
        points.append(
            f"Research the company's products, engineering culture, and recent news "
            f"before the interview. Walking in informed about their stack and challenges "
            f"makes a strong impression regardless of the role."
        )

    return points[:4]


def _generate_technical_questions(
    parsed_jd: dict,
    parsed_resume: dict,
    skills_gap: dict,
) -> list[dict]:
    """Generates role-specific technical interview questions with prep tips."""
    job_title = _safe_title(parsed_jd.get("job_title"))
    hard_skills = parsed_jd.get("hard_skills", []) or []
    responsibilities = parsed_jd.get("responsibilities", []) or []
    missing = skills_gap.get("missing_skills", []) or []
    questions = []

    # Generate questions from JD responsibilities — dynamically phrased
    resp_keywords = {
        "design": "How would you approach designing a scalable system for this use case?",
        "implement": "Walk us through your implementation process for a complex feature from requirements to deployment.",
        "develop": "Describe your development workflow and how you ensure code quality in production systems.",
        "manage": "How do you prioritise and manage competing technical requirements in a fast-paced environment?",
        "lead": "Describe a situation where you led a technical initiative — how did you ensure team alignment and delivery?",
        "build": "How do you approach building a new component or service from scratch?",
        "optimise": "What's your methodology for identifying and resolving performance bottlenecks?",
        "migrate": "Walk us through a migration or upgrade you've led — what was your rollback strategy?",
        "test": "How do you ensure adequate test coverage without slowing down development velocity?",
        "deploy": "Describe your ideal CI/CD pipeline and how you handle deployment failures.",
        "scale": "How do you approach scaling a system that's experiencing rapid growth in users or data volume?",
        "secure": "What security considerations do you build into your development workflow from the start?",
        "monitor": "How do you approach monitoring, alerting, and observability in production systems?",
        "automate": "Walk us through a process you automated — what was the impact on time or error rate?",
    }

    # Pick questions based on JD content
    used_resp = set()
    for resp in responsibilities[:4]:
        lower = resp.lower()
        for keyword, question in resp_keywords.items():
            if keyword in lower and keyword not in used_resp:
                tip = f"Review your experience with {keyword} and prepare a specific example using the STAR method."
                questions.append({
                    "question": question,
                    "preparation_tip": tip + f" The {job_title} position mentions: '{resp[:80]}...'",
                })
                used_resp.add(keyword)
                break

    # Skill-based questions
    skill_questions = {
        "python": "How do you manage memory and performance in Python for high-throughput applications?",
        "sql": "How would you optimise a slow-running query on a table with millions of rows?",
        "docker": "How would you design a multi-container Docker setup for a microservices architecture?",
        "kubernetes": "Explain how you'd set up a Kubernetes deployment with health checks and auto-scaling.",
        "aws": "How would you architect a fault-tolerant application on AWS? What services would you use and why?",
        "terraform": "How do you manage Terraform state in a team environment and handle infrastructure drift?",
        "machine learning": "Walk through your approach to deploying and monitoring a machine learning model in production.",
        "langchain": "How would you design a RAG pipeline using LangChain for a document Q&A application?",
        "react": "How do you manage state and side effects in a large React application?",
        "fastapi": "How would you design a FastAPI application with background task processing and WebSocket support?",
        "postgresql": "How do you approach database indexing strategies and query optimisation in PostgreSQL?",
        "redis": "Describe a use case where you chose Redis over a traditional database — what were the trade-offs?",
        "kafka": "How would you design a fault-tolerant event-driven system using Kafka?",
    }

    for skill in hard_skills[:4]:
        lower = skill.lower().strip()
        if lower in skill_questions and len(questions) < 5:
            q_text = skill_questions[lower]
            tip = f"Review {skill} best practices and prepare an example from your experience."
            if lower in missing:
                tip += f" Since you're still building this skill, frame your answer around your learning approach and adjacent experience."
            questions.append({
                "question": q_text,
                "preparation_tip": tip,
            })

    # Ensure we have at least 2 questions
    if len(questions) < 2:
        questions.append({
            "question": f"Tell us about a challenging technical problem you solved recently and how you approached it.",
            "preparation_tip": "Use the STAR method: Situation, Task, Action, Result. Be specific about the outcome.",
        })
        questions.append({
            "question": f"What interests you most about this {job_title} position, and how does your experience align?",
            "preparation_tip": "Review the JD responsibilities and map 2-3 of your achievements to them before the interview.",
        })

    return questions[:5]


def build_interview_kit(
    parsed_resume: dict,
    parsed_jd: dict,
    skills_gap: dict,
    score_data: dict,
) -> dict:
    """Builds the complete interview preparation kit."""
    talking_points = _generate_talking_points(parsed_resume, parsed_jd, skills_gap, score_data)
    technical_questions = _generate_technical_questions(parsed_jd, parsed_resume, skills_gap)

    company = _safe_company(parsed_jd.get("company_name"))
    if company and company.lower() not in ("your organisation", ""):
        company_tip = (
            f"Research {company}'s engineering blog, recent product launches, "
            f"and tech stack before the interview. Understanding their current challenges "
            f"and technology choices will help you tailor your responses."
        )
    else:
        company_tip = (
            "Research the company's engineering blog, product roadmap, and tech stack "
            "before the interview. Tailoring your responses to their specific challenges "
            "demonstrates genuine interest and preparation."
        )

    return {
        "talking_points": talking_points,
        "technical_questions": technical_questions,
        "company_research_tips": company_tip,
    }


# ── COVER LETTER DRAFT ────────────────────────────────────────────────────────

def _get_groq_api_key() -> str:
    import random
    keys = ["GROQ_API_KEY_3", "GROQ_API_KEY_4", "GROQ_API_KEY_5"]
    random.shuffle(keys)
    for var in keys:
        val = os.getenv(var, "").strip()
        if val:
            return val
    return ""


def _build_cover_letter_prompt(
    parsed_resume: dict,
    parsed_jd: dict,
    skills_gap: dict,
    match_percentage: int,
) -> str:
    """Builds a focused prompt for Groq to write a cover letter."""
    name = parsed_resume.get("name", "the candidate")
    job_title = _safe_title(parsed_jd.get("job_title"))
    company = _safe_company(parsed_jd.get("company_name"))
    exact = skills_gap.get("exact_matches", [])
    missing = skills_gap.get("missing_skills", [])
    candidate_years = parsed_resume.get("estimated_years", 0) or 0
    summary = parsed_resume.get("summary", "") or ""
    skills = parsed_resume.get("skills", [])
    experience = parsed_resume.get("experience", [])

    exp_bullets = ""
    if isinstance(experience, list):
        for item in experience[:3]:
            if isinstance(item, str):
                exp_bullets += f"- {item}\n"
            elif isinstance(item, dict):
                desc = item.get("description", item.get("summary", ""))
                if isinstance(desc, str) and desc:
                    exp_bullets += f"- {desc}\n"
                elif isinstance(desc, list):
                    for b in desc[:3]:
                        if isinstance(b, str):
                            exp_bullets += f"- {b}\n"

    return f"""Write a professional cover letter (3 paragraphs max) for:

Candidate: {name}
Target Role: {job_title} at {company}
Years of Experience: {candidate_years}
Match Score: {match_percentage}%
Skills: {', '.join(skills[:10]) or 'Not listed'}
Skills That Match Exactly: {', '.join(exact[:5]) or 'None'}
Skills Being Developed: {', '.join(missing[:5]) or 'None'}
Summary: {summary[:200]}

Key Experience:
{exp_bullets or '- Not detailed'}

Rules:
- Professional but not robotic. Sound like a real person, not a template.
- Reference the specific role, company, and 1-2 relevant skills.
- If exact matches exist, mention them. If not, focus on transferable strengths.
- Keep it tight — 3 paragraphs, no fluff, no clichés.
- Never use phrases like "I am writing to express" or "I am confident in my ability."
- Start directly and sound like you mean it.
- Sign off naturally without "Thank you for your consideration."
"""


def _try_groq_cover_letter(
    parsed_resume: dict,
    parsed_jd: dict,
    skills_gap: dict,
    match_percentage: int,
) -> str | None:
    """Tries Groq for a personalised cover letter. Returns None if unavailable."""
    api_key = _get_groq_api_key()
    if not api_key:
        return None

    prompt = _build_cover_letter_prompt(parsed_resume, parsed_jd, skills_gap, match_percentage)
    models = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"]

    for model_name in models:
        try:
            from openai import OpenAI
            client = OpenAI(api_key=api_key, base_url="https://api.groq.com/openai/v1")
            response = client.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "system", "content": "You are a professional cover letter writer. Write a concise, personalised cover letter. No markdown, no formatting, just plain text paragraphs."},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.4,
                max_tokens=1536,
            )
            text = response.choices[0].message.content.strip()
            if len(text) > 80:
                # Only reject if it's clearly cut off mid-sentence
                if text.rstrip().endswith(('-', '—', 'the', 'and', 'or', 'but', 'to', 'with', 'for')):
                    logger.warning(f"Cover letter from {model_name} appears cut off — trying next model.")
                    continue
                logger.info(f"Cover letter generated via {model_name}")
                return text
        except Exception as e:
            err_str = str(e)
            if "429" in err_str or "Rate limit" in err_str or "quota" in err_str.lower():
                logger.warning(f"Cover letter quota ({model_name}) — trying next.")
                continue
            logger.warning(f"Cover letter error ({model_name}): {e}")
            continue

    return None


def _build_fallback_cover_letter(
    parsed_resume: dict,
    parsed_jd: dict,
    skills_gap: dict,
    match_percentage: int,
) -> str:
    """Rule-based cover letter — personalised, no filler, no clichés."""
    name = parsed_resume.get("name", "The Candidate")
    job_title = _safe_title(parsed_jd.get("job_title"))
    company = _safe_company(parsed_jd.get("company_name"))
    exact = skills_gap.get("exact_matches", [])
    missing = skills_gap.get("missing_skills", [])
    candidate_years = parsed_resume.get("estimated_years", 0) or 0
    summary = parsed_resume.get("summary", "") or ""
    skills = parsed_resume.get("skills", [])

    name_first = name.split()[0] if name != "The Candidate" else "I"

    # Opening — start strong, never "I am writing to express"
    if summary:
        opening = summary.strip().rstrip(".")[:120]
    elif candidate_years and exact:
        opening = (
            f"{name_first} is a professional with {candidate_years} years of experience "
            f"specialising in {', '.join(exact[:3])} — directly what this role demands"
        )
    elif candidate_years:
        opening = (
            f"With {candidate_years} years of experience and a strong track record in "
            f"{', '.join(skills[:3]) if skills else 'technology'}, "
            f"{name_first} is well positioned to contribute to the {job_title} position"
        )
    else:
        opening = (
            f"{name_first} brings relevant experience across "
            f"{', '.join(skills[:3]) if skills else 'key technical areas'} "
            f"that map to the {job_title} position"
        )

    # Body — specific match evidence
    body = ""
    if exact:
        body += (
            f"My expertise in {', '.join(exact[:3])} maps directly to your requirements, "
            f"and I have applied these skills to deliver real outcomes in past roles."
        )
    elif skills:
        body += (
            f"My work across {', '.join(skills[:4])} has prepared me for the "
            f"challenges this role presents. "
        )

    if missing:
        body += (
            f" While building deeper expertise in {', '.join(missing[:2])} "
            f"is a focus area, I bring adjacent capabilities and a demonstrated "
            f"ability to ramp quickly on new technologies."
        )
    elif body:
        body += " I am ready to hit the ground running from day one."

    if not body:
        body = f"I am genuinely excited about the {job_title} position and believe my background aligns well."

    # Closing
    closing = (
        f"I would welcome the chance to discuss how my experience can contribute to "
        f"the work {company} is doing. Looking forward to speaking with you."
    )

    letter = (
        f"Dear Hiring Manager,\n\n"
        f"{opening}. "
        f"{body}\n\n"
        f"{closing}"
    )

    return letter


def build_cover_letter_draft(
    parsed_resume: dict,
    parsed_jd: dict,
    skills_gap: dict,
    match_percentage: int,
) -> str:
    """
    Generates a personalised cover letter draft — Groq if available,
    rule-based fallback otherwise. Never returns a generic template.
    """
    groq_letter = _try_groq_cover_letter(parsed_resume, parsed_jd, skills_gap, match_percentage)
    if groq_letter:
        return groq_letter

    logger.info("Groq unavailable for cover letter — using high-quality fallback.")
    return _build_fallback_cover_letter(parsed_resume, parsed_jd, skills_gap, match_percentage)


# ── RESUME ADJUSTMENTS ENHANCEMENT ───────────────────────────────────────────

def enhance_adjustments(resume_adjustments: list[dict]) -> list[dict]:
    """Adds ats_impact field to each adjustment."""
    enhanced = []
    for adj in resume_adjustments:
        adj["ats_impact"] = "high" if "keyword" in adj.get("reason_for_change", "").lower() or "align" in adj.get("reason_for_change", "").lower() else "medium"
        enhanced.append(adj)
    return enhanced
