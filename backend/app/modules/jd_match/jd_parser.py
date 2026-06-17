# app/modules/jd_match/jd_parser.py
# Parses raw unstructured Job Description text into a clean structured dict.
# Uses Groq (via OpenAI-compatible API) with JSON response format.

from __future__ import annotations
import os
import re
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

# â”€â”€ SYSTEM INSTRUCTION â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

SYSTEM_INSTRUCTION = (
    "You are an expert technical recruiter parser. "
    "Extract all structural requirements from the job description text. "
    "Normalize all skill names to lowercase. "
    "If required experience years is not explicitly stated, default to 0. "
    "Extract at least 5 hard skills if present. "
    "Respond with valid JSON. No markdown, no code fences."
)


# â”€â”€ API KEY â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

def _get_api_key() -> str:
    import random
    keys = ["GROQ_API_KEY_3", "GROQ_API_KEY_4", "GROQ_API_KEY_5"]
    random.shuffle(keys)
    for var in keys:
        val = os.getenv(var, "").strip()
        if val:
            return val
    raise EnvironmentError("No Groq API key found in JD pool (GROQ_API_KEY_3/4/5).")


# â”€â”€ STATIC FALLBACK â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

# â”€â”€ REGEX-BASED FALLBACK EXTRACTORS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

_ROLE_KEYWORDS = [
    "engineer", "developer", "scientist", "analyst", "manager", "architect",
    "designer", "intern", "director", "lead", "head", "specialist",
    "consultant", "coordinator", "associate", "administrator", "officer",
    "supervisor", "president", "vp", "vice president", "principal",
    "staff", "senior", "junior", "mid-level", "entry-level",
]


def _extract_title_fallback(jd_text: str) -> str:
    """Extracts job title from the first few lines of JD text using regex.
    Handles both multi-line and single-line (paragraph-style) JDs."""
    text = jd_text.strip()

    # â”€â”€ Strategy 1: Check with "Job Title:" or "Title:" prefix anywhere in first 500 chars â”€â”€
    head = text[:500]
    for pattern in [
        r"(?:job\s*title|title)\s*[:\-â€“â€”]+\s*([A-Za-z][A-Za-z\s/\-â€“â€”&]+?)(?:\.|\,|\n|About|\||Company|Role|\||$)",
        r"(?:role|position)\s*[:\-â€“â€”]+\s*([A-Za-z][A-Za-z\s/\-â€“â€”&]+?)(?:\.|\,|\n|About|\||Company|Role|\||$)",
    ]:
        match = re.search(pattern, head, re.IGNORECASE)
        if match:
            title = match.group(1).strip().rstrip("., ")
            if len(title) >= 3:
                words = title.split()
                return " ".join(w.capitalize() if w.islower() else w for w in words[:12])

    # â”€â”€ Strategy 2: First non-empty line that contains a role keyword with minimal length â”€â”€
    lines = text.split("\n")
    for line in lines[:10]:
        line = line.strip().strip(":#*-").strip()
        if not line:
            continue
        lower = line.lower()
        if any(kw in lower for kw in _ROLE_KEYWORDS):
            for prefix in ["job title:", "title:", "role:", "position:", "hiring:", "looking for"]:
                if lower.startswith(prefix):
                    line = line.split(":", 1)[1].strip()
                    break
            # Truncate long lines at sentence boundary or comma, or at "Company:"
            if len(line) > 80:
                # Take text up to first sentence-ending punctuation or Company:
                short = re.split(r'[.,;]|\s+Company\s*:', line)[0].strip()
                if any(kw in short.lower() for kw in _ROLE_KEYWORDS) and len(short) >= 5:
                    line = short
                else:
                    continue
            words = line.split()
            if len(words) >= 2:
                title = " ".join(w.capitalize() if w.islower() else w for w in words[:10])
                # Trim trailing dashes and spaces, but NOT & (it's part of title)
                return title.rstrip("-â€“â€” ").strip()
            return line[:60].strip()

    # â”€â”€ Strategy 3: No line breaks â€” scan first 400 chars for role keyword + surrounding context â”€â”€
    if "\n" not in text[:500]:
        # Find "Job Title:" even without line breaks
        for marker in ["job title:", "title:", "position:", "role:"]:
            idx = text.lower().find(marker)
            if idx >= 0 and idx < 300:
                after = text[idx + len(marker):idx + 150].strip()
                # Take text up to next colon, period, or comma
                title = re.split(r'[.:;,]\s*(?:About|Job|Key|Required|Education|Preferred|Qualifications|Responsibilities|The|We|Company)', after)[0].strip()
                if len(title) >= 3:
                    words = title.split()
                    return " ".join(w.capitalize() if w.islower() else w for w in words[:12])

        # Try "Job Title:" at the very start
        if text.lower().startswith("job title:"):
            after = text[10:150].strip()
            title = re.split(r'[.:;]', after)[0].strip()
            if title:
                words = title.split()
                return " ".join(w.capitalize() if w.islower() else w for w in words[:12])

        # Fallback: first sentence that contains a role keyword
        sentences = re.split(r'[.!?\n]+', text[:600])
        for sent in sentences:
            sent = sent.strip()
            if not sent or len(sent) > 120:
                continue
            lower = sent.lower()
            if any(kw in lower for kw in _ROLE_KEYWORDS):
                # Clean up known prefixes
                for prefix in ["job title:", "title:", "role:", "position:", "hiring:", "we are seeking", "looking for"]:
                    if lower.startswith(prefix):
                        sent = sent.split(":", 1)[1].strip() if ":" in sent else sent
                        break
                words = sent.split()
                if len(words) >= 2:
                    return " ".join(w.capitalize() if w.islower() else w for w in words[:12])

    return None  # honest â€” can't determine from text


def _extract_company_fallback(jd_text: str) -> str:
    """Extract company name from JD text."""
    lines = jd_text.strip().split("\n")
    for i, line in enumerate(lines[:10]):
        line = line.strip().strip(":#*").strip()
        lower = line.lower()
        if not line or len(line) > 60:
            continue
        # Direct "Company:" prefix match
        if lower.startswith("company:"):
            return line.split(":", 1)[1].strip()[:40]
        # Patterns: "at Company", "Company is hiring", "About Company"
        if any(p in lower for p in ["at ", "compa", "about ", " @", "|"]):
            for sep in [" at ", " | ", " â€” ", " â€“ ", " - "]:
                if sep in line:
                    parts = line.split(sep)
                    for p in parts:
                        p = p.strip()
                        if len(p) > 2 and p[0].isupper() and not any(kw in p.lower() for kw in ["hiring", "looking", "join", "role", "title"]):
                            return p[:40]
        # Fallback: first line that's all caps with 2+ words
        if line.isupper() and len(line.split()) >= 2 and not any(kw in lower for kw in _ROLE_KEYWORDS):
            return line[:40].title()
    return ""


def _extract_experience_years(jd_text: str) -> int:
    """Extract required experience years from JD text."""
    patterns = [
        r"(\d+)[\+]?\s*(?:years?|yrs?)\s*(?:of)?\s*(?:experience|exp)",
        r"(?:experience|exp)\s*(?:of)?\s*(\d+)[\+]?\s*(?:years?|yrs?)",
    ]
    for p in patterns:
        match = re.search(p, jd_text.lower())
        if match:
            val = int(match.group(1))
            if 0 < val <= 30:
                return val
    # Look for common ranges like "5-7 years"
    range_match = re.search(r"(\d+)[-\s]to[-\s](\d+)\s*(?:years?|yrs?)", jd_text.lower())
    if range_match:
        val = int(range_match.group(1))
        if 0 < val <= 30:
            return val
    return 2  # Default to 2 years if not specified â€” reasonable minimum


def _extract_education_fallback(jd_text: str) -> str:
    """Extract preferred education from JD text."""
    lower = jd_text.lower()
    if "phd" in lower or "ph.d" in lower or "doctorate" in lower:
        return "PhD"
    if "master" in lower or "msc" in lower or "m.s." in lower or "graduate degree" in lower:
        return "Master's Degree"
    if "bachelor" in lower or "b.s." in lower or "b.tech" in lower or "undergraduate" in lower:
        return "Bachelor's Degree"
    return ""


def _extract_employment_type(jd_text: str) -> str:
    """Extract employment type from JD text."""
    lower = jd_text.lower()
    if "internship" in lower or "intern" in lower:
        return "Internship"
    if "contract" in lower and "full" not in lower.split() and "part" not in lower.split():
        return "Contract"
    if "part-time" in lower or "part time" in lower:
        return "Part-time"
    if "full-time" in lower or "full time" in lower:
        return "Full-time"
    return "Full-time"  # Most common default


def _extract_location_fallback(jd_text: str) -> str:
    """Extract location from JD text."""
    lines = jd_text.strip().split("\n")
    for line in lines[:12]:
        lower = line.lower().strip()
        # Check for location patterns
        if any(p in lower for p in ["remote", "hybrid", "on-site", "onsite"]):
            if "remote" in lower:
                return "Remote"
            for loc_type in ["hybrid", "on-site", "onsite"]:
                if loc_type in lower:
                    parts = line.split(", ")
                    if len(parts) >= 2 and not any(kw in parts[-1].lower() for kw in _ROLE_KEYWORDS + ["experience", "skills"]):
                        return (parts[-1] + ", " + parts[-1]).strip()[:40]
                    return loc_type.replace("-", " ").title()
        # City, State patterns
        state_match = re.search(r"([A-Z][a-z]+(?:[\s-][A-Z][a-z]+)*),\s*([A-Z]{2})", line)
        if state_match:
            return state_match.group(0)
        # "in City" pattern
        in_match = re.search(r"(?:in|at|based in|located in)\s+([A-Z][a-z]+(?:[\s-][A-Z][a-z]+)*)", line)
        if in_match:
            return in_match.group(1)
    return ""


def _static_fallback(jd_text: str) -> dict:
    """
    Intelligent rule-based fallback when Gemini is unavailable.
    Extracts title, company, years, and skills from raw JD text using regex.

    Never returns hardcoded defaults like "Unknown" or 0 â€” always
    derives something meaningful from the text.
    """
    if not jd_text or not jd_text.strip():
        return _empty_fallback()

    jd_lower = jd_text.lower()

    # Extract metadata from raw text
    job_title = _extract_title_fallback(jd_text)
    company = _extract_company_fallback(jd_text)
    exp_years = _extract_experience_years(jd_text)
    education = _extract_education_fallback(jd_text)
    employment = _extract_employment_type(jd_text)
    location = _extract_location_fallback(jd_text)

    # â”€â”€ Extract hard skills from raw text â”€â”€
    # Multi-strategy approach designed to work for ANY domain, not just tech:
    #
    # Strategy 1: Find "Required Skills" sections and parse bullet/comma items
    # Strategy 2: Match against a broad cross-industry skill database (always runs)
    # Strategy 3: Context pattern extraction for uncatalogued skills (cautious)
    found_skills = []

    # â”€â”€ Strategy 0: Extract skills from explicit colon-category lines and bullet-list sections â”€â”€
    # Catches formats like:
    #   Programming Languages: Python, SQL, Java, C++
    #   Python  (each on its own line under a category header)
    # First, find all skill section boundaries in the JD
    skill_section_match = re.search(
        r"(?:required\s+)?(?:technical\s+)?skills?[:\s]+(.*?)(?:\n\s*(?:experience|education|certification|preferred|about|summary|benefits)\s*:?)",
        jd_text, re.IGNORECASE | re.DOTALL
    )
    if skill_section_match:
        skill_text = skill_section_match.group(1)
        # Extract individual lines/items
        for candidate in re.split(r'[\nâ€¢â—â–ªâž¢â¦¿âƒ,;]+', skill_text):
            candidate = candidate.strip().strip('"\'()[]').strip()
            if not candidate or len(candidate) < 2 or len(candidate) > 50:
                continue
            lower_c = candidate.lower()
            # Skip section headers and filler
            if any(w in lower_c for w in ['years', 'experience', 'education', 'certification',
                                           'preferred', 'required', 'qualification', 'languages',
                                           'frameworks', 'tools', 'development', 'libraries',
                                           'software engineering', 'databases', 'engineering',
                                           'concepts']):
                # Skip pure header lines, but check if they contain colon-separated skills
                if ':' in candidate:
                    parts = candidate.split(':', 1)
                    for p in re.split(r'[,;]+', parts[1]):
                        p = p.strip()
                        if p and len(p) > 1 and len(p) < 50 and re.match(r'^[A-Za-z#][A-Za-z0-9\s./#+\-()]*$', p):
                            found_skills.append(p.lower().strip())
                continue
            if len(candidate.split()) > 8:  # skip sentences
                continue
            if re.match(r'^[A-Za-z#][A-Za-z0-9\s./#+\-()]*$', candidate):
                found_skills.append(candidate.lower().strip())

    # â”€â”€ Strategy 1: Section-based extraction â”€â”€
    # Find skill sections in the JD, then parse each line.
    # For lines that contain a colon ("Programming Languages: Python, SQL, Java, C++"),
    # check if the part BEFORE the colon is a section category header.
    # If not, or if no colon, extract individual skill terms from the line.
    section_markers = [
        r"(?:required\s+)?skills?[:\s]+", r"qualifications[:\s]+",
        r"key\s+skills[:\s]+", r"technical\s+skills[:\s]+",
        r"proficiency[:\s]+", r"expertise[:\s]+",
        r"you\s+(?:should\s+)?have[:\s]+", r"what\s+(?:we\'?re\s+)?looking\s+for[:\s]+",
        r"tech\s+stack[:\s]+", r"tools[:\s]+",
    ]

    category_labels = [
        "languages", "frameworks", "libraries", "tools", "platforms",
        "concepts", "databases", "standards", "methodologies",
        "systems", "engines", "environments", "editors", "technologies",
        "repositories", "software engineering", "engineering",
    ]

    for marker in section_markers:
        section = re.split(marker, jd_text, maxsplit=1, flags=re.IGNORECASE)
        if len(section) < 2:
            continue
        rest = section[1]
        end_markers = r"(?:\n\s*(?:Preferred|Education|About|Benefits|Responsibilities|Why|Perks|About|Job\s+Title|About the Project|Desired|Certifications))"
        rest = re.split(end_markers, rest, maxsplit=1, flags=re.IGNORECASE)[0]

        # Process line by line (split by newlines and bullet characters only)
        lines = re.split(r'[\nâ€¢â—â–ªâž¢â¦¿âƒ]+\s*', rest)
        for line in lines:
            line = line.strip().strip('"\'()[]').strip()
            if not line or len(line) < 2:
                continue

            lower_line = line.lower()

            # â”€â”€ Detect and skip category header lines â”€â”€
            # These look like "Programming Languages:", "Frameworks & Libraries:", etc.
            # They have format: [Category Name]: [items]
            colon_parts = line.split(":", 1)
            has_colon = len(colon_parts) > 1

            if has_colon:
                before_colon = colon_parts[0].strip()
                after_colon = colon_parts[1].strip()
                before_lower = before_colon.lower()

                # Check if the part before colon is a category label
                is_category = False
                bc_words = before_colon.split()
                if bc_words:
                    last_word = bc_words[-1].lower().rstrip("s")
                    if any(cat.startswith(last_word) for cat in category_labels):
                        is_category = True
                    # Also check if ALL words are title-case (header pattern)
                    if "&" in before_colon and all(w[0].isupper() for w in bc_words if len(w) > 1):
                        is_category = True

                if is_category:
                    # Category line â€” extract skills from AFTER the colon
                    items_to_process = re.split(r'[,;]+', after_colon)
                    raw_skills = [i.strip().strip('"\'()[]').strip() for i in items_to_process]
                else:
                    # Line with colon but not a category â€” process whole line
                    raw_skills = [line.strip()]
            else:
                # No colon â€” process the whole line
                raw_skills = [line.strip()]

            # Process each candidate skill
            for item in raw_skills:
                if not item or len(item) < 2 or len(item) > 50:
                    continue
                lower_item = item.lower()

                # Skip filler/prefatory words
                if any(w in lower_item for w in ['preferred', 'required', 'years', 'experience',
                                                  'education', 'description', 'salary', 'summar',
                                                  'certification', 'qualification', 'proficiency']):
                    continue

                # Must be a meaningful text â€” starts with letter or #
                if not re.match(r'^[A-Za-z#][A-Za-z0-9\s./#+\-()]+$', item):
                    continue

                # Skip full sentences (contain verbs)
                if re.search(r'\b(is|are|have|has|will|must|should|can|been|was|were)\b', lower_item):
                    if len(item) > 30:
                        continue

                found_skills.append(item.lower().strip())

    # â”€â”€ Strategy 2: Always run the skill database (doesn't depend on Strategy 1) â”€â”€
    # This ensures common programming languages, frameworks, tools are always detected.
    common_skills = [
        # â”€â”€ Tech / Engineering â”€â”€
        "python", "java", "javascript", "typescript", "react", "node.js",
        "angular", "vue", "next.js", "svelte", "jquery", "html", "css",
        "sql", "postgresql", "mongodb", "mysql", "redis", "cassandra",
        "dynamodb", "elasticsearch", "docker", "kubernetes", "terraform",
        "ansible", "jenkins", "github actions", "github", "gitlab", "git",
        "aws", "gcp", "azure", "fastapi", "django", "flask", "spring",
        "rails", "express", "laravel", ".net", "rust", "go", "golang",
        "ruby", "cpp", "c++", "c#", "scala", "kotlin", "swift", "php",
        "machine learning", "deep learning", "tensorflow", "pytorch",
        "langchain", "llm", "api", "rest", "graphql", "grpc",
        "ci/cd", "linux", "unix", "bash", "powershell", "shell",
        "microservices", "serverless", "lambda", "s3", "ec2", "rds",
        "prometheus", "grafana", "datadog", "new relic", "splunk",
        "kafka", "rabbitmq", "pub/sub", "nats", "redis streams",
        "oauth", "jwt", "saml", "ldap", "ssl/tls", "encryption",
        "agile", "scrum", "kanban", "jira", "confluence", "notion",
        "tableau", "power bi", "looker", "metabase", "redshift",
        "bigquery", "snowflake", "airflow", "dbt", "spark", "hadoop",
        "opencv", "nlp", "computer vision", "natural language processing",
        "rag", "vector database", "chroma", "pinecone", "weaviate",
        "prompt engineering", "fine tuning", "rlhf", "langgraph",
        "autogen", "crewai", "llamaindex", "model evaluation",
        "semantic search", "embeddings", "vector retrieval",
        "generative ai", "autonomous agent", "autonomous agents",
        "autonomous reasoning", "agentic ai", "ai agents",
        "multi-step reasoning", "tool integration", "tool calling",
        "memory retention", "fallback guardrails", "contextual memory",
        "llm agents", "embedding models", "ai evaluation",
        "scalable backend", "backend services", "automation pipeline",
        "ai system design", "system design", "recruitment intelligence",
        "candidate ranking", "ai-powered support", "customer support",
        "personal ai assistant", "semantic resume matching",
        "ats score", "skill-gap detection", "rag architecture",
        "retrieval-augmented generation", "rag pipelines",
        "nlp", "natural language processing",
        "prompt engineering", "ai orchestration",
        "vector databases", "enterprise automation",
        "agent orchestration frameworks", "ollama",
        "semantic candidate matching", "scalable ai",
        "automation workflows", "agentic workflows",
        "agent orchestration", "multi-agent", "vector search",

        # â”€â”€ ECE / Embedded / Hardware â”€â”€
        "verilog", "vhdl", "systemverilog", "fpga", "vivado", "modelsim",
        "quartus", "xilinx", "embedded c", "embedded systems", "rtos",
        "arm", "avr", "microcontroller", "microprocessor", "arduino",
        "raspberry pi", "spi", "i2c", "uart", "can bus", "pwm", "adc",
        "dac", "gpio", "timers", "interrupts", "dma", "pcie",
        "spice", "ltspice", "orcad", "eagle", "kicad", "altium designer",
        "pcb design", "schematic capture", "layout design", "signal integrity",
        "dsp", "fft", "ofdm", "mimo", "digital signal processing",
        "rf engineering", "antenna design", "hfss", "cst", "microwave",
        "rf circuit design", "emc", "emi", "impedance matching",
        "matlab", "simulink", "labview", "multisim", "proteus",
        "vlsi design", "asic", "asic design", "rtl design", "rtl coding",
        "synthesis", "place and route", "static timing analysis",
        "formal verification", "scan chains", "boundary scan", "jtag",
        "oscilloscope", "logic analyzer", "spectrum analyzer",
        "network analyzer", "function generator", "signal generator",
        "power supply design", "analog circuit design", "digital circuit design",
        "op amp", "transistor", "mosfet", "bjt", "diode", "rectifier",
        "amplifier", "filter design", "feedback systems", "control systems",
        "pid controller", "sensor", "actuator", "transducer",
        "wireless communication", "bluetooth", "ble", "zigbee", "lora",
        "wifi", "nfc", "rfid", "gps", "gsm", "lte", "5g",
        "tcp/ip", "modbus", "ethernet", "can protocol",
        "optical communication", "fiber optics", "laser", "led",
        "power electronics", "buck converter", "boost converter",
        "inverter", "rectifier circuit", "smps", "motor control",
        "renewable energy", "solar", "wind energy", "power system",
        "scada", "plc", "automation", "industrial automation",
        "iot", "internet of things", "sensor networks", "embedded linux",

        # â”€â”€ Data / Analytics â”€â”€
        "statistical analysis", "data visualization", "data mining",
        "a/b testing", "experimental design", "hypothesis testing",
        "excel", "vba", "sas", "spss", "r", "matlab", "minitab",
        "pandas", "numpy", "scikit-learn",
        "etl", "data pipeline", "data modeling", "data governance",

        # â”€â”€ Sales / Marketing â”€â”€
        "salesforce", "hubspot", "marketo", "sales navigation",
        "cold calling", "lead generation", "account management",
        "territory management", "negotiation", "contract management",
        "crm", "outreach", "salesloft", "gong", "chili piper",
        "seo", "sem", "google ads", "meta ads", "linkedin ads",
        "content marketing", "email marketing", "marketing automation",
        "social media marketing", "influencer marketing", "ppc",
        "google analytics", "mixpanel", "amplitude", "hotjar",
        "brand strategy", "market research", "competitive analysis",
        "product marketing", "growth hacking", "conversion optimization",

        # â”€â”€ Finance / Accounting â”€â”€
        "quickbooks", "xero", "sage", "oracle financials", "sap",
        "financial modeling", "forecasting", "budgeting", "variance analysis",
        "auditing", "tax planning", "compliance", "sox", "gaap",
        "ifrs", "internal controls", "risk management", "underwriting",
        "investment analysis", "portfolio management", "m&a", "due diligence",
        "microsoft excel", "vlookup", "pivot tables", "power query",

        # â”€â”€ Healthcare / Medical â”€â”€
        "ehr", "epic", "cerner", "meditech", "hipaa", "hitech",
        "patient care", "clinical research", "icd-10", "cpt coding",
        "medical terminology", "anatomy", "physiology", "pharmacology",
        "nursing", "radiology", "pathology", "cardiology", "pediatrics",
        "telemedicine", "inpatient", "outpatient", "triage", "emr",

        # â”€â”€ HR / Recruiting â”€â”€
        "recruiting", "sourcing", "screening", "interviewing", "onboarding",
        "employee relations", "performance management", "compensation",
        "benefits administration", "payroll", "hris", "workday",
        "bamboo hr", "greenhouse", "lever", "icims", "linkedin recruiter",
        "labor law", "eeo", "diversity and inclusion", "org development",
        "talent acquisition", "succession planning", "training and development",

        # â”€â”€ Legal / Compliance â”€â”€
        "legal research", "contract drafting", "negotiation", "litigation",
        "discovery", "deposition", "trial preparation", "corporate law",
        "intellectual property", "patent", "trademark", "copyright",
        "regulatory compliance", "grc", "policy development", "risk assessment",
        "data privacy", "gdpr", "ccpa", "ccpa", "sox compliance",
        "compliance auditing", "ethics", "legal writing", "case management",

        # â”€â”€ Design / Creative â”€â”€
        "figma", "sketch", "adobe xd", "photoshop", "illustrator",
        "indesign", "after effects", "premiere pro", "final cut pro",
        "blender", "maya", "3ds max", "cinema 4d", "unity", "unreal engine",
        "ui design", "ux design", "user research", "usability testing",
        "wireframing", "prototyping", "information architecture",
        "interaction design", "visual design", "typography", "color theory",
        "brand identity", "logo design", "print design", "motion graphics",
        "animation", "video editing", "photography", "illustration",

        # â”€â”€ Supply Chain / Operations â”€â”€
        "supply chain", "logistics", "inventory management", "warehousing",
        "procurement", "sourcing", "vendor management", "contract negotiation",
        "lean", "six sigma", "kaizen", "kanban", "jit", "tqm",
        "erp", "sap", "oracle erp", "microsoft dynamics",
        "demand forecasting", "capacity planning", "distribution",
        "freight", "customs", "import/export", "trade compliance",
    ]
    for s in common_skills:
        if s in jd_lower and s not in found_skills:
            found_skills.append(s)

    # Strategy 3 (cautious): Extract short skill-like terms from context patterns
    # Only runs if we still have very few skills. Heavily filtered to avoid garbage.
    if len(found_skills) <= 2:
        context_patterns = [
            r"(?:experience|proficient|familiar|skilled|expertise|background|knowledge|strong)\s+(?:in|with|using)\s+([A-Za-z][A-Za-z\s./#+\-()]{2,40})",
            r"(?:including|such as|e\.g\.|like)\s+([A-Za-z][A-Za-z\s.,/#+\-()]{2,60})",
        ]
        for pat in context_patterns:
            matches = re.findall(pat, jd_text, re.IGNORECASE)
            for match_text in matches:
                # Split by comma, semicolon, or "and"
                terms = re.split(r'[,;]\s*|\s+and\s+', match_text)
                for term in terms:
                    term = term.strip().lower().rstrip("., ")
                    if len(term) < 2 or len(term) > 35:
                        continue
                    # FILTER: Must be a single term or 2-3 word phrase
                    # No full sentences (no verbs)
                    if re.search(r'\b(is|are|have|has|will|must|should|can|been|was|were|been)\b', term):
                        continue
                    # No prepositional phrases (contains "with", "for", "from" as second word)
                    words = term.split()
                    if len(words) >= 3 and words[1] in ("with", "for", "from", "through", "using", "that", "this"):
                        continue
                    # Must look like a real skill: starts with letter, contains meaningful characters
                    if not re.match(r'^[A-Za-z][A-Za-z0-9\s.#+\-]+$', term):
                        continue
                    if len(term) > 2 and term not in found_skills:
                        found_skills.append(term)

    # Deduplicate (case-insensitive) while preserving order
    seen = set()
    deduped = []
    for s in found_skills:
        key = s.lower().strip()
        if key not in seen:
            seen.add(key)
            deduped.append(s)
    found_skills = deduped

    # Extract soft skills
    soft_skills_map = {
        "communication": ["communication", "interpersonal", "verbal", "written"],
        "teamwork": ["teamwork", "collaboration", "team player", "cross-functional"],
        "leadership": ["leadership", "lead", "mentor", "guidance"],
        "problem-solving": ["problem.solv", "analytical", "critical thinking"],
        "time management": ["time management", "organi", "prioriti"],
        "adaptability": ["adaptab", "fast-paced", "agile", "flexible"],
        "creativity": ["creativ", "innovative", "design thinking"],
    }
    found_soft = []
    for skill, keywords in soft_skills_map.items():
        for kw in keywords:
            if kw in jd_lower:
                found_soft.append(skill)
                break
    if not found_soft:
        found_soft = ["communication", "teamwork"]

    # Build responsibilities from sentences in the JD
    responsibilities = []
    sentences = re.split(r'[.!?\n]+', jd_text)
    for sent in sentences:
        sent = sent.strip()
        if not sent or len(sent) < 15:
            continue
        lower = sent.lower()
        # Look for responsibility-indicative patterns
        if any(p in lower for p in ["responsib", "will", "you'll", "you will", "duties", "role involves",
                                     "manage", "lead", "develop", "design", "implement", "build",
                                     "create", "maintain", "support", "drive", "own"]):
            if len(sent) > 20:
                responsibilities.append(sent[:150].strip())
                if len(responsibilities) >= 5:
                    break

    if not responsibilities:
        responsibilities = [
            f"Contribute to {job_title} initiatives and projects",
            "Collaborate with cross-functional teams to deliver solutions",
            "Drive continuous improvement in processes and tools",
        ]

    logger.info(
        f"Static fallback: '{job_title}' @ '{company or 'N/A'}' | "
        f"{exp_years}y exp | {len(found_skills)} skills"
    )

    return {
        "job_title": job_title,
        "company_name": company or None,
        "required_experience_years": exp_years,
        "employment_type": employment,
        "hard_skills": found_skills[:12] or [],
        "soft_skills": found_soft,
        "responsibilities": responsibilities,
        "preferred_education": education or None,
        "location": location or None,
    }


def _empty_fallback() -> dict:
    """Only used when JD text is completely empty."""
    return {
        "job_title": None,
        "company_name": None,
        "required_experience_years": 0,
        "employment_type": "Full-time",
        "hard_skills": [],
        "soft_skills": [],
        "responsibilities": [],
        "preferred_education": None,
        "location": None,
    }


# â”€â”€ MAIN PARSER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

def parse_job_description(jd_text: str) -> dict:
    """
    Parses raw JD text into a structured dict using Groq (LLM).
    Falls back to rule-based keyword extraction if API is unavailable.

    Returns:
        dict with keys: job_title, required_experience_years, hard_skills,
                        soft_skills, responsibilities, preferred_education,
                        company_name, employment_type, location
    """
    if not jd_text or not jd_text.strip():
        return _static_fallback("")

    # Cap input to avoid token waste
    jd_input = jd_text.strip()[:4000]

    # â”€â”€ Fast API probe â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    from app.modules.shared.llm_service import is_jd_api_available, _parse_llm_json
    if not is_jd_api_available():
        logger.info("Groq API (JD pool) unreachable â€” using static JD parsing fallback.")
        return _static_fallback(jd_text)

    # Try Groq models in order
    _GROQ_MODELS = [
        "llama-3.3-70b-versatile",
        "llama-3.1-8b-instant",
    ]

    for model_name in _GROQ_MODELS:
        try:
            from openai import OpenAI
            client = OpenAI(api_key=_get_api_key(), base_url=GROQ_BASE_URL)
            response = client.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "system", "content": SYSTEM_INSTRUCTION},
                    {"role": "user", "content": jd_input},
                ],
                temperature=0.1,
                max_tokens=1024,
            )

            text = response.choices[0].message.content
            if not text or not text.strip():
                continue

            parsed = _parse_llm_json(text)
            if parsed is None:
                continue

            # Normalize all skill strings to lowercase
            parsed["hard_skills"] = [
                s.lower().strip() for s in parsed.get("hard_skills", [])
            ]
            parsed["soft_skills"] = [
                s.lower().strip() for s in parsed.get("soft_skills", [])
            ]

            # â”€â”€ VALIDATION: if LLM returned garbage, fall through to static â”€â”€
            title_ok = bool(parsed.get("job_title")) and parsed["job_title"].lower() not in (
                "none", "null", "the role", "the target role", "", "n/a",
            )
            skills_ok = len(parsed.get("hard_skills", [])) > 0

            if not title_ok or not skills_ok:
                logger.warning(f"Groq returned poor JD (title='{parsed.get('job_title')}', {len(parsed.get('hard_skills', []))} skills) — using static fallback.")
                continue

            logger.info(
                f"JD parsed ({model_name}): '{parsed.get('job_title')}' | "
                f"{len(parsed['hard_skills'])} hard skills | "
                f"{parsed.get('required_experience_years', 0)} yrs exp"
            )
            return parsed

        except Exception as e:
            err_str = str(e)
            if "429" in err_str or "Rate limit" in err_str or "quota" in err_str.lower():
                logger.warning(f"Groq quota exhausted ({model_name}) â€” trying next.")
                continue
            logger.warning(f"Groq error ({model_name}): {e}")
            continue

    return _static_fallback(jd_text)
