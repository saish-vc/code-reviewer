import hashlib
import io
import json
import os
import time
from collections import defaultdict
from typing import Optional

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

import uvicorn
from fastapi import FastAPI, File, Form, Header, HTTPException, Query, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse, StreamingResponse

from database import (
    get_all_reviews,
    get_cached_review,
    get_ta_queue_records,
    init_db,
    save_review,
    update_rating,
    update_ta_queue,
)
from models import (
    HealthResponse,
    MetricsResponse,
    RatingRequest,
    ReviewResponse,
    StaticIssue,
    StructuredFeedbackPoint,
    TaSubmitRequest,
)
from nim_client import build_prompt, generate_ai_stream, get_ai_feedback
from static_analysis import run_static_analysis_async

# Initialize database tables on startup
init_db()

app = FastAPI(
    title="REVU AI Code Reviewer API",
    version="2.0",
    description="CS-education research backend API combining static analysis and LLM feedback.",
)

# Configure CORS from ALLOWED_ORIGINS env var
raw_origins = os.environ.get("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:7860,http://127.0.0.1:5173,http://127.0.0.1:7860")
allowed_origins = [o.strip() for o in raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_rate_limits: dict[str, list[float]] = defaultdict(list)
RESEARCH_API_KEY = os.environ.get("RESEARCH_API_KEY", "revu-research-secret-2026")


def _check_rate_limit(client_ip: str, limit: int = 15, window: int = 60) -> bool:
    now = time.time()
    _rate_limits[client_ip] = [t for t in _rate_limits[client_ip] if now - t < window]
    if len(_rate_limits[client_ip]) >= limit:
        return False
    _rate_limits[client_ip].append(now)
    return True


def _verify_api_key(x_api_key: Optional[str], api_key: Optional[str]):
    token = x_api_key or api_key
    if not token or token != RESEARCH_API_KEY:
        raise HTTPException(status_code=401, detail="Unauthorized: Invalid research API key.")


@app.get("/", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """Returns simple API status JSON response for v2 API."""
    return HealthResponse()


@app.post("/review", response_model=ReviewResponse)
async def review_code(
    request: Request,
    language: str = Form(...),
    code: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
) -> JSONResponse:
    """Core code review endpoint performing static analysis + LLM pedagogical review."""
    client_ip = request.client.host if request.client else "unknown"
    if not _check_rate_limit(client_ip):
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded. Please wait a minute before retrying.",
        )

    if language not in ("python", "cpp"):
        raise HTTPException(status_code=400, detail="Unsupported language. Choose 'python' or 'cpp'.")

    raw_code = ""
    if file is not None:
        filename = file.filename or ""
        ext = os.path.splitext(filename)[1].lower()
        if ext not in (".py", ".cpp"):
            raise HTTPException(status_code=400, detail="Invalid file type. Only .py and .cpp are accepted.")
        content_bytes = await file.read()
        if len(content_bytes) > 50 * 1024:
            raise HTTPException(status_code=400, detail="File exceeds 50 KB limit.")
        try:
            raw_code = content_bytes.decode("utf-8")
        except UnicodeDecodeError:
            raise HTTPException(status_code=400, detail="File must be valid UTF-8 text.")
    elif code:
        raw_code = code
    else:
        raise HTTPException(status_code=400, detail="No code submitted.")

    clean_code = raw_code.strip()
    if not clean_code:
        raise HTTPException(status_code=400, detail="Code submission cannot be empty.")

    lines = clean_code.splitlines()
    if len(lines) > 500:
        raise HTTPException(status_code=400, detail=f"Code exceeds 500-line limit ({len(lines)} lines).")

    code_hash = hashlib.sha256(clean_code.encode()).hexdigest()

    # Check SQLite cache for exact code_hash match
    cached = get_cached_review(code_hash, language)
    if cached:
        return JSONResponse({
            "review_id": cached["review_id"],
            "language": cached["language"],
            "code_hash": cached["code_hash"],
            "issues": cached["issues"],
            "issues_count": cached["issues_count"],
            "tool_warnings": cached.get("tool_warnings", []),
            "llm_feedback": cached["llm_feedback"],
            "ai_available": cached["llm_available"],
            "llm_available": cached["llm_available"],
            "fallback_reason": cached.get("fallback_reason"),
            "analysis_time_ms": cached["analysis_time_ms"],
            "cached": True,
            "consent_version": cached.get("consent_version", "v1.0"),
        })

    t_start = time.monotonic()

    # Run static checkers concurrently via asyncio
    issues, tool_warnings = await run_static_analysis_async(clean_code, language)

    # Get AI feedback (NIM primary, Groq/Cerebras fallback)
    prompt = build_prompt(clean_code, language, issues)
    llm_text, structured, ai_available, fallback_reason = get_ai_feedback(prompt)

    analysis_time_ms = int((time.monotonic() - t_start) * 1000)
    review_id = f"{code_hash[:12]}-{int(time.time())}"

    record = {
        "review_id": review_id,
        "code_hash": code_hash,
        "language": language,
        "code_snippet": clean_code[:1000],
        "issues": issues,
        "issues_count": len(issues),
        "tool_warnings": tool_warnings,
        "llm_feedback": llm_text,
        "llm_available": ai_available,
        "fallback_reason": fallback_reason,
        "rating": 0,
        "analysis_time_ms": analysis_time_ms,
        "in_ta_queue": 0,
        "consent_version": "v1.0",
    }
    save_review(record)

    return JSONResponse({
        "review_id": review_id,
        "language": language,
        "code_hash": code_hash,
        "issues": issues,
        "issues_count": len(issues),
        "tool_warnings": tool_warnings,
        "llm_feedback": llm_text,
        "structured_feedback": structured,
        "ai_available": ai_available,
        "llm_available": ai_available,
        "fallback_reason": fallback_reason,
        "analysis_time_ms": analysis_time_ms,
        "cached": False,
        "consent_version": "v1.0",
    })


@app.get("/review/stream")
async def stream_review(code: str, language: str = "python"):
    """Server-Sent Events (SSE) streaming endpoint for AI response progression."""
    clean_code = code.strip()
    prompt = build_prompt(clean_code, language, [])
    return StreamingResponse(
        generate_ai_stream(prompt),
        media_type="text/event-stream"
    )


@app.post("/rate")
async def rate_review(request: Request) -> JSONResponse:
    """Saves student rating (+1 or -1) for a specific review_id."""
    body = await request.json()
    review_id = body.get("review_id", "")
    rating = body.get("rating", 0)
    if rating not in (-1, 1):
        raise HTTPException(status_code=400, detail="Rating must be 1 or -1.")

    success = update_rating(review_id, rating)
    if success:
        return JSONResponse({"status": "ok", "review_id": review_id, "rating": rating})
    raise HTTPException(status_code=404, detail="Review ID not found.")


@app.post("/ta-submit")
async def ta_submit(request: Request) -> JSONResponse:
    """Submits a review to the human TA verification queue."""
    body = await request.json()
    review_id = body.get("review_id", "")
    success = update_ta_queue(review_id)
    if success:
        return JSONResponse({"status": "queued", "review_id": review_id})
    raise HTTPException(status_code=404, detail="Review ID not found.")


@app.get("/metrics", response_model=MetricsResponse)
async def get_metrics() -> JSONResponse:
    """Returns aggregated research metrics."""
    all_records = get_all_reviews()
    total = len(all_records)
    rated = [e for e in all_records if e.get("rating") in (-1, 1)]
    avg_rating = sum(e["rating"] for e in rated) / len(rated) if rated else None
    avg_time = int(sum(e.get("analysis_time_ms", 0) for e in all_records) / total) if total else 0
    avg_issues = round(sum(e.get("issues_count", 0) for e in all_records) / total, 2) if total else 0
    avg_llm_len = int(sum(len(e.get("llm_feedback", "")) for e in all_records) / total) if total else 0
    ta_queue = get_ta_queue_records()

    return JSONResponse({
        "total_reviews": total,
        "rated_reviews": len(rated),
        "avg_rating": avg_rating,
        "avg_analysis_time_ms": avg_time,
        "avg_issues_per_review": avg_issues,
        "avg_llm_response_length": avg_llm_len,
        "ta_queue_size": len(ta_queue),
    })


@app.get("/ta-queue")
async def get_ta_queue() -> JSONResponse:
    """Returns active queue of submissions needing TA review."""
    queue = get_ta_queue_records()
    safe = [
        {
            "review_id": e.get("review_id"),
            "timestamp": e.get("timestamp"),
            "language": e.get("language"),
            "issues_count": e.get("issues_count"),
            "rating": e.get("rating"),
            "code_snippet": e.get("code_snippet", "")[:300],
            "llm_suggestions": e.get("llm_feedback", "")[:400],
        }
        for e in queue
    ]
    return JSONResponse({"queue": safe, "total": len(safe)})


@app.get("/export")
async def export_dataset(
    format: str = Query("json", pattern="^(json|csv)$"),
    x_api_key: Optional[str] = Header(None),
    api_key: Optional[str] = Query(None),
):
    """Exports anonymized research dataset as JSON or CSV (protected by API key)."""
    _verify_api_key(x_api_key, api_key)
    all_records = get_all_reviews()

    if format == "csv":
        output = io.StringIO()
        headers = [
            "review_id", "timestamp", "code_hash", "language", "issues_count",
            "rating", "analysis_time_ms", "llm_available", "consent_version"
        ]
        import csv
        writer = csv.DictWriter(output, fieldnames=headers)
        writer.writeheader()
        for r in all_records:
            writer.writerow({k: r.get(k, "") for k in headers})
        output.seek(0)
        return StreamingResponse(
            io.BytesIO(output.getvalue().encode("utf-8")),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=revu_dataset.csv"}
        )

    return JSONResponse({"dataset": all_records, "count": len(all_records)})


@app.get("/dashboard", response_class=HTMLResponse)
async def researcher_dashboard(
    x_api_key: Optional[str] = Header(None),
    api_key: Optional[str] = Query(None),
):
    """Server-rendered internal research analytics dashboard with Chart.js."""
    _verify_api_key(x_api_key, api_key)
    all_records = get_all_reviews()
    
    ratings_dist = {"helpful (+1)": 0, "unhelpful (-1)": 0, "unrated (0)": 0}
    for r in all_records:
        rt = r.get("rating", 0)
        if rt == 1:
            ratings_dist["helpful (+1)"] += 1
        elif rt == -1:
            ratings_dist["unhelpful (-1)"] += 1
        else:
            ratings_dist["unrated (0)"] += 1

    chart_data = {
        "labels": [r["review_id"][:8] for r in all_records[:20]],
        "issues": [r["issues_count"] for r in all_records[:20]],
        "latencies": [r["analysis_time_ms"] for r in all_records[:20]],
    }

    html = f"""<!DOCTYPE html>
<html>
<head>
    <title>REVU Research Dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body {{ font-family: system-ui, sans-serif; background: #0B0C0E; color: #fff; padding: 2rem; }}
        .card {{ background: #14161B; border: 1px solid #2A2E38; padding: 1.5rem; border-radius: 8px; margin-bottom: 2rem; }}
        h1 {{ color: #F30000; font-size: 1.8rem; }}
        .grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }}
    </style>
</head>
<body>
    <h1>🤖 REVU CS-Education Research Dashboard</h1>
    <p style="color: #9A9A9A">Internal analytics view for IRB Protocol #2026-CS-088</p>
    
    <div class="card">
        <h3>Total Submissions Logged: {len(all_records)}</h3>
    </div>

    <div class="grid">
        <div class="card">
            <h3>Student Rating Distribution</h3>
            <canvas id="ratingsChart"></canvas>
        </div>
        <div class="card">
            <h3>Analysis Latency (ms)</h3>
            <canvas id="latencyChart"></canvas>
        </div>
    </div>

    <script>
        const ratingsCtx = document.getElementById('ratingsChart').getContext('2d');
        new Chart(ratingsCtx, {{
            type: 'doughnut',
            data: {{
                labels: {json.dumps(list(ratings_dist.keys()))},
                datasets: [{{
                    data: {json.dumps(list(ratings_dist.values()))},
                    backgroundColor: ['#22c55e', '#ef4444', '#6B7280']
                }}]
            }}
        }});

        const latencyCtx = document.getElementById('latencyChart').getContext('2d');
        new Chart(latencyCtx, {{
            type: 'bar',
            data: {{
                labels: {json.dumps(chart_data['labels'])},
                datasets: [{{
                    label: 'Latency (ms)',
                    data: {json.dumps(chart_data['latencies'])},
                    backgroundColor: '#F30000'
                }}]
            }}
        }});
    </script>
</body>
</html>"""
    return HTMLResponse(content=html)


if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=7860, reload=False)
