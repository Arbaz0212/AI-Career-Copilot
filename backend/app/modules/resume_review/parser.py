#parser.py
import pdfplumber
import re
from difflib import SequenceMatcher

# ── MASTER SKILLS DATABASE ──────────────────────────────────────────────────
# Canonical skill names. Parser does case-insensitive + fuzzy match.
SKILLS_DB = [
    # Languages
    "Python", "Java", "JavaScript", "TypeScript", "C++", "C#", "C",
    "Go", "Rust", "Kotlin", "Swift", "R", "Scala", "Ruby", "PHP",
    # Frontend
    "React", "Next.js", "Vue", "Angular", "HTML", "CSS", "Tailwind",
    "Bootstrap", "Redux", "GraphQL", "Webpack",
    # Backend
    "Node.js", "Express", "FastAPI", "Flask", "Django", "Spring Boot",
    "ASP.NET", "REST API", "gRPC", "Microservices",
    # Databases
    "PostgreSQL", "MySQL", "MongoDB", "Redis", "SQLite", "Cassandra",
    "DynamoDB", "Elasticsearch", "Supabase", "Firebase",
    # Cloud & DevOps
    "AWS", "Azure", "GCP", "Docker", "Kubernetes", "Terraform",
    "Ansible", "Jenkins", "GitHub Actions", "CI/CD", "Linux",
    "Nginx", "Prometheus", "Grafana",
    # AI / ML / GenAI
    "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch",
    "Scikit-learn", "Keras", "NLP", "Computer Vision", "LLM",
    "LangChain", "LlamaIndex", "RAG", "FAISS", "Chroma", "Pinecone",
    "Hugging Face", "Transformers", "OpenAI", "Gemini", "Ollama",
    "CrewAI", "AutoGen", "Prompt Engineering", "Fine-tuning",
    "Vector Database", "Embeddings", "Agent Orchestration",
    "Generative AI", "GenAI", "LLM Agents",
    "RAG Pipeline", "Semantic Search", "Vector Search",
    "Model Evaluation", "Agentic AI", "Autonomous Agents",
    "Guardrails", "API Tool-calling", "Multi-step Reasoning",
    "Tool Integration", "Memory Retention", "Contextual Memory",
    "Fallback Guardrails", "Chatbot", "Automation Pipeline",
    "Workflow Automation", "Backend Services", "AI System Design",
    "Scalable Backend", "Candidate Ranking", "Skill-gap Detection",
    "Recruitment Intelligence", "Semantic Resume Matching",
    "Resume Scoring", "ATS Screening", "NLP Pipeline",
    # Data
    "Pandas", "NumPy", "Spark", "Hadoop", "Airflow", "dbt",
    "Tableau", "Power BI", "SQL",
    # Tools
    "Git", "GitHub", "GitLab", "Jira", "Postman", "VS Code",
    "Figma", "Notion",
]

# Aliases → canonical name (handles common resume variations)
SKILL_ALIASES = {
    "nodejs": "Node.js",
    "node": "Node.js",
    "reactjs": "React",
    "react.js": "React",
    "nextjs": "Next.js",
    "vuejs": "Vue",
    "vue.js": "Vue",
    "mongo": "MongoDB",
    "postgres": "PostgreSQL",
    "tensorflow": "TensorFlow",
    "pytorch": "PyTorch",
    "scikit learn": "Scikit-learn",
    "sklearn": "Scikit-learn",
    "langchain": "LangChain",
    "llamaindex": "LlamaIndex",
    "huggingface": "Hugging Face",
    "hugging face": "Hugging Face",
    "github actions": "GitHub Actions",
    "gcp": "GCP",
    "google cloud": "GCP",
    "amazon web services": "AWS",
    "microsoft azure": "Azure",
    "ci/cd": "CI/CD",
    "cicd": "CI/CD",
    "restful api": "REST API",
    "rest apis": "REST API",
    "vector db": "Vector Database",
    "vector databases": "Vector Database",
    "faiss": "FAISS",
    "chroma": "Chroma",
    "llms": "LLM",
    "llm": "LLM",
    "llm agent": "LLM Agents",
    "llm agents": "LLM Agents",
    "llm agent": "LLM Agents",
    "llm agents": "LLM Agents",
    "large language model": "LLM",
    "large language models": "LLM",
    "llm agents": "LLM Agents",
    "rag pipelines": "RAG",
    "rag pipeline": "RAG",
    "retrieval augmented generation": "RAG",
    "prompt eng": "Prompt Engineering",
    "natural language processing": "NLP",
    "nlp": "NLP",
    "ml": "Machine Learning",
    "machine learning": "Machine Learning",
    "dl": "Deep Learning",
    "deep learning": "Deep Learning",
    "cv": "Computer Vision",
    "computer vision": "Computer Vision",
    "fast api": "FastAPI",
}

# Section header variants
SECTION_HEADERS = {
    "experience": [
        "EXPERIENCE", "WORK EXPERIENCE", "PROFESSIONAL EXPERIENCE",
        "EMPLOYMENT", "EMPLOYMENT HISTORY", "WORK HISTORY", "INTERNSHIP",
        "INTERNSHIPS", "CAREER HISTORY",
    ],
    "projects": [
        "PROJECTS", "PROJECT EXPERIENCE", "PERSONAL PROJECTS",
        "ACADEMIC PROJECTS", "KEY PROJECTS", "TECHNICAL PROJECTS",
        "PROJECT HIGHLIGHTS",
    ],
    "education": [
        "EDUCATION", "EDUCATIONAL BACKGROUND", "ACADEMIC BACKGROUND",
        "ACADEMIC QUALIFICATIONS", "QUALIFICATIONS",
    ],
    "skills": [
        "SKILLS", "TECHNICAL SKILLS", "CORE SKILLS", "KEY SKILLS",
        "COMPETENCIES", "TECHNOLOGIES", "TECH STACK",
    ],
    "summary": [
        "SUMMARY", "PROFESSIONAL SUMMARY", "OBJECTIVE", "PROFILE",
        "ABOUT ME", "CAREER OBJECTIVE", "CAREER SUMMARY",
    ],
    "certifications": [
        "CERTIFICATIONS", "CERTIFICATES", "COURSES", "ACHIEVEMENTS",
        "AWARDS", "HONORS",
    ],
}

ALL_HEADERS = set(
    h for headers in SECTION_HEADERS.values() for h in headers
)


# ── TEXT EXTRACTION ──────────────────────────────────────────────────────────

def extract_text_from_pdf(pdf_path: str) -> str:
    """Extract raw text from PDF preserving layout as much as possible."""
    text = ""
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text(
                    x_tolerance=2,
                    y_tolerance=2,
                )
                if page_text:
                    text += page_text + "\n"
    except Exception as e:
        raise ValueError(f"Failed to extract PDF text: {e}")

    if not text.strip():
        raise ValueError("PDF appears to be empty or image-based (no extractable text).")

    return text


# ── CONTACT EXTRACTION ───────────────────────────────────────────────────────

def extract_email(text: str) -> str:
    match = re.search(
        r"[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}",
        text,
    )
    return match.group(0).lower() if match else ""


def extract_phone(text: str) -> str:
    # Indian + international formats
    match = re.search(
        r"(\+?91[\-\s]?)?[6-9]\d{9}|\+?[1-9]\d{7,14}",
        text,
    )
    return match.group(0).strip() if match else ""


def extract_name(text: str) -> str:
    """
    Strategy: name is almost always in the first 5 non-empty lines,
    is 2-4 words, no digits, no special chars, not an email/phone/URL.
    """
    lines = [l.strip() for l in text.split("\n") if l.strip()]
    email = extract_email(text)

    for line in lines[:6]:
        # Skip if contains email, phone digits, URLs, or known section headers
        if email and email.lower() in line.lower():
            continue
        if re.search(r"\d{5,}|http|www\.|linkedin|github|@", line.lower()):
            continue
        if line.upper() in ALL_HEADERS:
            continue
        words = line.split()
        if 2 <= len(words) <= 5 and all(
                re.match(r"^[A-Za-z\.\-']+$", w) for w in words
        ):
            return line.title()

    return lines[0] if lines else "Unknown"


def extract_linkedin(text: str) -> str:
    match = re.search(
        r"linkedin\.com/in/([A-Za-z0-9\-\_]+)",
        text, re.IGNORECASE,
    )
    return f"linkedin.com/in/{match.group(1)}" if match else ""


def extract_github(text: str) -> str:
    match = re.search(
        r"github\.com/([A-Za-z0-9\-\_]+)",
        text, re.IGNORECASE,
    )
    return f"github.com/{match.group(1)}" if match else ""


# ── SKILLS EXTRACTION ────────────────────────────────────────────────────────

def _fuzzy_match(word: str, skill: str, threshold: float = 0.88) -> bool:
    """Check if word is a close enough fuzzy match to a skill token."""
    return SequenceMatcher(None, word.lower(), skill.lower()).ratio() >= threshold


def extract_skills(text: str) -> list:
    """
    Multi-strategy skill extraction:
    1. Alias dictionary (handles variants like 'nodejs', 'scikit learn')
    2. Exact case-insensitive match against SKILLS_DB
    3. Fuzzy match for close variants (typos, minor differences)
    Returns deduplicated list of canonical skill names.
    """
    found = set()
    lower_text = text.lower()

    # Pass 1: alias matching
    for alias, canonical in SKILL_ALIASES.items():
        if alias in lower_text:
            found.add(canonical)

    # Pass 2: exact match from DB
    for skill in SKILLS_DB:
        if skill.lower() in lower_text:
            found.add(skill)

    # Pass 3: token-level fuzzy match for multi-word skills already not found
    tokens = re.findall(r"[A-Za-z][A-Za-z0-9\.\+\#\-]+", text)
    token_pairs = [
        f"{tokens[i].lower()} {tokens[i + 1].lower()}"
        for i in range(len(tokens) - 1)
    ]
    all_tokens = [t.lower() for t in tokens] + token_pairs

    for skill in SKILLS_DB:
        if skill in found:
            continue
        skill_lower = skill.lower()
        for token in all_tokens:
            if _fuzzy_match(token, skill_lower, threshold=0.90):
                found.add(skill)
                break

    return sorted(found)


# ── SECTION EXTRACTION ───────────────────────────────────────────────────────

def _is_section_header(line: str) -> bool:
    """Check if a line is any known section header."""
    return line.strip().upper() in ALL_HEADERS


def _get_section_type(line: str) -> str | None:
    """Return section key if line matches, else None."""
    upper = line.strip().upper()
    for section_key, headers in SECTION_HEADERS.items():
        if upper in headers:
            return section_key
    return None


def extract_sections(text: str) -> dict:
    """
    Single-pass section extractor. Splits resume into labelled sections.
    Returns dict: { section_key: [lines] }
    """
    sections = {k: [] for k in SECTION_HEADERS}
    current_section = None

    for line in text.split("\n"):
        clean = line.strip()
        if not clean:
            continue

        section_type = _get_section_type(clean)
        if section_type:
            current_section = section_type
            continue

        if current_section:
            # Filter out CID garbage (PDF encoding artifacts)
            if re.match(r"^\(cid:\d+\)$", clean):
                continue
            sections[current_section].append(clean)

    return sections


def extract_summary(sections: dict, full_text: str) -> str:
    """Extract professional summary/objective."""
    lines = sections.get("summary", [])
    if lines:
        return " ".join(lines[:5])  # cap at 5 lines

    # Fallback: first substantial paragraph before any known header
    paragraphs = full_text.split("\n\n")
    for para in paragraphs[1:4]:  # skip first (usually name/contact)
        para = para.strip()
        if len(para) > 80 and not _is_section_header(para.split("\n")[0]):
            return para
    return ""


# ── MAIN PARSER ──────────────────────────────────────────────────────────────

def parse_resume(text: str) -> dict:
    sections = extract_sections(text)

    return {
        "name": extract_name(text),
        "email": extract_email(text),
        "phone": extract_phone(text),
        "linkedin": extract_linkedin(text),
        "github": extract_github(text),
        "summary": extract_summary(sections, text),
        "skills": extract_skills(text),
        "experience": sections.get("experience", []),
        "projects": sections.get("projects", []),
        "education": sections.get("education", []),
        "certifications": sections.get("certifications", []),
    }
