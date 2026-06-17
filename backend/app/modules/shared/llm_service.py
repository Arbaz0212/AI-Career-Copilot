"""
Shared Groq LLM service with aggressive timeout and per-module key pools.

Groq (GroqCloud) — free tier, no billing needed, OpenAI-compatible API.

Key Pool Architecture:
  RR Pool  (Resume Review):   GROQ_API_KEY_1, GROQ_API_KEY_2, GROQ_API_KEY_5 (shared emergency)
  JD Pool  (JD Match):        GROQ_API_KEY_3, GROQ_API_KEY_4, GROQ_API_KEY_5 (shared emergency)

Each pool has its own _UNREACHABLE flag so quota exhaustion in one module
never affects the other. Key 5 is shared emergency.

Strategy:
  1. Quick HTTP probe (2s timeout) per pool to check if API is reachable
  2. Only create SDK client if probe succeeds
  3. Each API call wrapped with short timeout
"""

from __future__ import annotations
import os
import json
import logging
from openai import OpenAI

logger = logging.getLogger(__name__)

# Timeout for the probe call (seconds per attempt)
PROBE_TIMEOUT = 3.0

# Groq API base
GROQ_BASE_URL = "https://api.groq.com/openai/v1"

# ── PER-MODULE UNREACHABLE FLAGS ──────────────────────────────────────────────
_RR_API_UNREACHABLE: bool = False
_JD_API_UNREACHABLE: bool = False


# ── KEY POOL GETTERS ──────────────────────────────────────────────────────────

def _get_rr_api_key() -> str:
    """Returns first available key from the Resume Review pool (keys 1, 2, 5)."""
    keys = ["GROQ_API_KEY_1", "GROQ_API_KEY_2", "GROQ_API_KEY_5"]
    import random
    random.shuffle(keys)
    for var in keys:
        val = os.getenv(var, "").strip()
        if val:
            return val
    raise EnvironmentError("No Groq API key found in Resume Review pool (GROQ_API_KEY_1/2/5).")


def _get_jd_api_key() -> str:
    """Returns first available key from the JD Match pool (keys 3, 4, 5)."""
    keys = ["GROQ_API_KEY_3", "GROQ_API_KEY_4", "GROQ_API_KEY_5"]
    import random
    random.shuffle(keys)
    for var in keys:
        val = os.getenv(var, "").strip()
        if val:
            return val
    raise EnvironmentError("No Groq API key found in JD Match pool (GROQ_API_KEY_3/4/5).")


# ── MODEL NAMES ────────────────────────────────────────────────────────────────
# Fastest Groq models for text generation. Sorted speed-first.
# Llama 3 70B is most capable, Mixtral is faster, Gemma is fallback.

GENERATION_MODELS = [
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
]

# Groq does NOT support embeddings. The system falls through to local n-gram.
EMBEDDING_MODELS = []  # always uses local fallback


# ── FAST HTTP PROBE ────────────────────────────────────────────────────────────

def _probe_api(api_key: str, model: str = "llama-3.1-8b-instant") -> bool:
    """
    Quick probe to check if the Groq API is reachable with the given key.
    Uses OpenAI SDK with aggressive timeout.
    Returns True if reachable, False otherwise.
    """
    try:
        from openai import OpenAI, APITimeoutError, APIStatusError
        client = OpenAI(
            api_key=api_key,
            base_url=GROQ_BASE_URL,
            timeout=PROBE_TIMEOUT,
            max_retries=0,
        )
        client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": "ping"}],
            max_tokens=1,
        )
        logger.debug(f"Groq API probe succeeded ({model})")
        return True

    except APIStatusError as e:
        code = e.status_code
        if code == 429:
            logger.warning(f"Groq API probe: quota exhausted (429) — will use fallbacks.")
        elif code == 401:
            logger.warning(f"Groq API probe: invalid key (401)")
        elif code == 404:
            logger.warning(f"Groq API probe: model '{model}' not found (404)")
        else:
            logger.debug(f"Groq API probe HTTP error {code}")
        return False
    except APITimeoutError:
        logger.debug(f"Groq API probe timed out ({PROBE_TIMEOUT}s)")
        return False
    except Exception as e:
        logger.debug(f"Groq API probe failed: {e}")
        return False


# ── PER-POOL AVAILABILITY CHECKS ──────────────────────────────────────────────

def is_rr_api_available() -> bool:
    """Check if ANY key in the Resume Review pool has a reachable model."""
    global _RR_API_UNREACHABLE
    if _RR_API_UNREACHABLE:
        return False
    key_vars = ["GROQ_API_KEY_1", "GROQ_API_KEY_2", "GROQ_API_KEY_5"]
    for key_var in key_vars:
        api_key = os.getenv(key_var, "").strip()
        if not api_key:
            continue
        if _probe_api(api_key):
            return True
    _RR_API_UNREACHABLE = True
    return False


def is_jd_api_available() -> bool:
    """Check if ANY key in the JD Match pool has a reachable model.
    Always probes — allows recovery from transient failures.
    """
    global _JD_API_UNREACHABLE
    key_vars = ["GROQ_API_KEY_3", "GROQ_API_KEY_4", "GROQ_API_KEY_5"]
    for key_var in key_vars:
        api_key = os.getenv(key_var, "").strip()
        if not api_key:
            continue
        if _probe_api(api_key):
            _JD_API_UNREACHABLE = False
            return True
    _JD_API_UNREACHABLE = True
    return False


# ── FORCE UNREACHABLE (backward compat) ──────────────────────────────────────

def _force_api_unreachable():
    """Force ALL pools unreachable. Used by old modules that don't know about pools."""
    global _RR_API_UNREACHABLE, _JD_API_UNREACHABLE
    _RR_API_UNREACHABLE = True
    _JD_API_UNREACHABLE = True
    logger.warning("Forced all Groq API pools unreachable (legacy compat call).")


# Keep backward compat alias — semantic_match.py uses this.
is_api_available = is_jd_api_available


# ── SDK CLIENTS ────────────────────────────────────────────────────────────────

def get_rr_client() -> OpenAI:
    """Returns an OpenAI client configured with RR pool key pointing to Groq."""
    return OpenAI(api_key=_get_rr_api_key(), base_url=GROQ_BASE_URL)


def get_jd_client() -> OpenAI:
    """Returns an OpenAI client configured with JD pool key pointing to Groq."""
    return OpenAI(api_key=_get_jd_api_key(), base_url=GROQ_BASE_URL)


# Keep backward compat alias
get_client = get_rr_client


# ── HELPER: Parse JSON from LLM response ──────────────────────────────────────
# Groq/OpenAI chat completions return a string. We need to extract valid JSON.
# The model is instructed to output JSON, but sometimes it wraps in ```json ... ```

def _parse_llm_json(text: str) -> dict | None:
    """Extract and parse JSON from an LLM response string."""
    if not text:
        return None
    text = text.strip()
    # Strip markdown code fences if present
    if text.startswith("```"):
        lines = text.split("\n")
        # Remove first line (```json) and last line (```)
        start = 0
        for i, line in enumerate(lines):
            if line.strip().startswith("```"):
                start = i + 1
                break
        end = len(lines)
        for i in range(len(lines) - 1, -1, -1):
            if lines[i].strip() == "```":
                end = i
                break
        text = "\n".join(lines[start:end]).strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return None


# ── GENERATION WITH TIMEOUT (RR pool) ────────────────────────────────────────

def generate_with_timeout_rr(
    messages: list[dict],
    *,
    model: str | None = None,
    system_instruction: str | None = None,
    response_format_type: str | None = None,
    temperature: float = 0.2,
    max_tokens: int = 4096,
) -> str | None:
    """Generate content using RR pool (Groq). Returns response text or None on failure."""
    global _RR_API_UNREACHABLE
    if _RR_API_UNREACHABLE:
        return None

    use_model = model or GENERATION_MODELS[0]

    try:
        client = OpenAI(
            api_key=_get_rr_api_key(),
            base_url=GROQ_BASE_URL,
        )

        msgs = list(messages)
        if system_instruction:
            msgs.insert(0, {"role": "system", "content": system_instruction})

        kwargs = {
            "model": use_model,
            "messages": msgs,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        if response_format_type:
            kwargs["response_format"] = {"type": response_format_type}

        response = client.chat.completions.create(**kwargs)
        text = response.choices[0].message.content
        return text.strip() if text else None

    except Exception as e:
        err_str = str(e)
        if "429" in err_str or "Rate limit" in err_str or "quota" in err_str.lower():
            logger.debug(f"Groq quota exhausted (RR pool): {e}")
            _RR_API_UNREACHABLE = True
        else:
            logger.debug(f"Groq LLM call failed (RR pool): {e}")
        return None


# ── GENERATION WITH TIMEOUT (JD pool) ────────────────────────────────────────

def generate_with_timeout_jd(
    messages: list[dict],
    *,
    model: str | None = None,
    system_instruction: str | None = None,
    response_format_type: str | None = None,
    temperature: float = 0.2,
    max_tokens: int = 4096,
) -> str | None:
    """Generate content using JD pool (Groq). Returns response text or None on failure."""
    global _JD_API_UNREACHABLE
    if _JD_API_UNREACHABLE:
        return None

    use_model = model or GENERATION_MODELS[0]

    try:
        client = OpenAI(
            api_key=_get_jd_api_key(),
            base_url=GROQ_BASE_URL,
        )

        msgs = list(messages)
        if system_instruction:
            msgs.insert(0, {"role": "system", "content": system_instruction})

        kwargs = {
            "model": use_model,
            "messages": msgs,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        if response_format_type:
            kwargs["response_format"] = {"type": response_format_type}

        response = client.chat.completions.create(**kwargs)
        text = response.choices[0].message.content
        return text.strip() if text else None

    except Exception as e:
        err_str = str(e)
        if "429" in err_str or "Rate limit" in err_str or "quota" in err_str.lower():
            logger.debug(f"Groq quota exhausted (JD pool): {e}")
            _JD_API_UNREACHABLE = True
        else:
            logger.debug(f"Groq LLM call failed (JD pool): {e}")
        return None


# Backward compat
generate_with_timeout = generate_with_timeout_rr


# ── EMBEDDING ──────────────────────────────────────────────────────────────────
# Groq does not support embeddings. Always returns None (callers fall back
# to local n-gram hashing, which is already implemented in vectordb.py).

def embed_with_timeout(model: str, contents: str) -> list[float] | None:
    """Groq does not support embeddings. Returns None — local fallback is used."""
    logger.debug("Groq does not support embeddings — using local n-gram fallback.")
    return None


# ── INTERNAL KEY GETTER (for vectordb.py backward compat) ────────────────────

def _get_api_key() -> str:
    """Legacy: returns RR pool key. Used only by vectordb.py fallback probe."""
    return _get_rr_api_key()
