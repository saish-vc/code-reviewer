import json
import os
import re
from typing import Any, AsyncGenerator, Dict, List, Optional, Tuple

try:
    from openai import OpenAI
    _openai_available = True
except ImportError:
    _openai_available = False


STRUCTURED_PROMPT_SYSTEM = """You are a helpful Computer Science teaching assistant reviewing beginner code.
Provide targeted, encouraging, step-by-step pedagogical feedback.
You MUST output strictly valid JSON matching this schema:
[
  {
    "issue": "Short summary of problem",
    "line": 14,
    "explanation": "Clear explanation of why this matters to a beginner",
    "fix": "Actionable suggestion or code snippet on how to fix it"
  }
]
Do not include markdown code block formatting (like ```json), commentary, or preambles outside the JSON array.
"""


def build_prompt(code: str, language: str, issues: List[Dict[str, str]]) -> str:
    issues_summary = "\n".join(
        f"- Line {i.get('line', '?')} [{i.get('severity', 'info')}]: {i.get('message', '')}"
        for i in issues[:20]
    ) or "No static analysis issues detected."
    lang_label = "Python" if language == "python" else "C++"
    return (
        f"Language: {lang_label}\n\n"
        f"Static analysis findings:\n{issues_summary}\n\n"
        f"Student Submission:\n```{lang_label.lower()}\n{code[:3000]}\n```\n\n"
        "Provide 2 to 4 structured feedback points in JSON format."
    )


def parse_structured_feedback(raw_text: str) -> Tuple[List[Dict[str, Any]], str]:
    """Parses JSON feedback array from LLM response string."""
    clean = raw_text.strip()
    if clean.startswith("```"):
        clean = re.sub(r"^```(?:json)?\n?", "", clean)
        clean = re.sub(r"\n?```$", "", clean)

    try:
        data = json.loads(clean)
        if isinstance(data, list):
            valid_points = []
            for pt in data:
                if isinstance(pt, dict) and "issue" in pt and "explanation" in pt:
                    valid_points.append({
                        "issue": str(pt.get("issue", "")),
                        "line": int(pt["line"]) if pt.get("line") is not None and str(pt.get("line")).isdigit() else None,
                        "explanation": str(pt.get("explanation", "")),
                        "fix": str(pt.get("fix", ""))
                    })
            return valid_points, raw_text
    except Exception:
        pass

    return [], raw_text


def call_nvidia_nim(prompt: str) -> Tuple[str, bool, Optional[str]]:
    """Primary LLM call via NVIDIA NIM (Llama 3.1 8B Instruct)."""
    if not _openai_available:
        return "", False, "OpenAI SDK not installed."
    
    api_key = os.environ.get("NVIDIA_API_KEY", "")
    if not api_key:
        return "", False, "NVIDIA_API_KEY environment variable not set."

    try:
        client = OpenAI(base_url="https://integrate.api.nvidia.com/v1", api_key=api_key)
        response = client.chat.completions.create(
            model="meta/llama-3.1-8b-instruct",
            messages=[
                {"role": "system", "content": STRUCTURED_PROMPT_SYSTEM},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=700,
            timeout=20,
        )
        content = response.choices[0].message.content or ""
        return content, True, None
    except Exception as e:
        return "", False, f"NVIDIA NIM error: {str(e)}"


def call_fallback_llm(prompt: str) -> Tuple[str, bool, Optional[str]]:
    """Fallback LLM call via Groq or Cerebras API if configured."""
    if not _openai_available:
        return "", False, "OpenAI SDK not installed."

    groq_key = os.environ.get("GROQ_API_KEY", "")
    if groq_key:
        try:
            client = OpenAI(base_url="https://api.groq.com/openai/v1", api_key=groq_key)
            response = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[
                    {"role": "system", "content": STRUCTURED_PROMPT_SYSTEM},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=700,
                timeout=15,
            )
            content = response.choices[0].message.content or ""
            return content, True, None
        except Exception as e:
            return "", False, f"Groq fallback error: {str(e)}"

    cerebras_key = os.environ.get("CEREBRAS_API_KEY", "")
    if cerebras_key:
        try:
            client = OpenAI(base_url="https://api.cerebras.ai/v1", api_key=cerebras_key)
            response = client.chat.completions.create(
                model="llama3.1-8b",
                messages=[
                    {"role": "system", "content": STRUCTURED_PROMPT_SYSTEM},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=700,
                timeout=15,
            )
            content = response.choices[0].message.content or ""
            return content, True, None
        except Exception as e:
            return "", False, f"Cerebras fallback error: {str(e)}"

    return "", False, "No fallback LLM API keys configured (set GROQ_API_KEY or CEREBRAS_API_KEY)."


def get_ai_feedback(prompt: str) -> Tuple[str, List[Dict[str, Any]], bool, Optional[str]]:
    """Attempt NVIDIA NIM first, falling back to Groq/Cerebras if NIM fails."""
    content, ok, reason = call_nvidia_nim(prompt)
    if ok and content:
        parsed, raw = parse_structured_feedback(content)
        return content, parsed, True, None

    # Fallback to secondary provider
    fallback_content, fallback_ok, fallback_reason = call_fallback_llm(prompt)
    if fallback_ok and fallback_content:
        parsed, raw = parse_structured_feedback(fallback_content)
        return fallback_content, parsed, True, None

    combined_reason = f"Primary NIM: {reason} | Fallback: {fallback_reason}"
    return "", [], False, combined_reason


async def generate_ai_stream(prompt: str) -> AsyncGenerator[str, None]:
    """Streams SSE events of the AI response for progressive rendering."""
    api_key = os.environ.get("NVIDIA_API_KEY") or os.environ.get("GROQ_API_KEY")
    if not api_key or not _openai_available:
        yield f"data: {json.dumps({'error': 'LLM API key unavailable'})}\n\n"
        return

    try:
        base_url = "https://api.groq.com/openai/v1" if os.environ.get("GROQ_API_KEY") else "https://integrate.api.nvidia.com/v1"
        model = "llama-3.1-8b-instant" if os.environ.get("GROQ_API_KEY") else "meta/llama-3.1-8b-instruct"
        
        client = OpenAI(base_url=base_url, api_key=api_key)
        stream = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": STRUCTURED_PROMPT_SYSTEM},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=700,
            stream=True,
        )
        for chunk in stream:
            token = chunk.choices[0].delta.content or ""
            if token:
                yield f"data: {json.dumps({'token': token})}\n\n"
        yield "data: [DONE]\n\n"
    except Exception as e:
        yield f"data: {json.dumps({'error': str(e)})}\n\n"
