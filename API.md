# REVU AI Code Reviewer — Backend API Specification (v2.0)

Clean, CORS-enabled REST & SSE API for beginner Python & C++ code review, static analysis, and LLM pedagogical feedback.

## 🚀 Base URL
Default local development: `http://localhost:7860`

---

## 📋 Endpoints Summary

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET`  | `/` | API health check & status | No |
| `POST` | `/review` | Execute static analysis + LLM feedback | No |
| `GET`  | `/review/stream` | Server-Sent Events (SSE) stream for LLM response | No |
| `POST` | `/rate` | Submit rating (+1 / -1) for a review | No |
| `POST` | `/ta-submit` | Submit review to human TA queue | No |
| `GET`  | `/metrics` | Aggregated CS-education research metrics | No |
| `GET`  | `/ta-queue` | Get list of reviews queued for TA attention | No |
| `GET`  | `/export` | Export dataset (JSON/CSV) | Yes (`RESEARCH_API_KEY`) |
| `GET`  | `/dashboard` | Internal researcher analytics dashboard HTML | Yes (`RESEARCH_API_KEY`) |

---

## 📥 Detailed Request & Response Contracts

### 1. `POST /review`
Accepts `multipart/form-data` with form fields:
- `language`: `"python"` or `"cpp"` (required)
- `code`: source code string (optional if file provided)
- `file`: uploaded file `.py` or `.cpp` (optional if code string provided)

#### Example Response Body (`200 OK`):
```json
{
  "review_id": "a1b2c3d4e5f6-1786435000",
  "language": "python",
  "code_hash": "2f0c7...",
  "issues": [
    {
      "line": "14",
      "severity": "warning",
      "message": "Unused variable 'res' (unused-variable)"
    }
  ],
  "issues_count": 1,
  "tool_warnings": [],
  "llm_feedback": "1. Unused variable 'res'...",
  "structured_feedback": [
    {
      "issue": "Unused variable 'res'",
      "line": 14,
      "explanation": "Variable 'res' is assigned a value on line 14 but is never referenced again.",
      "fix": "Remove line 14 or return 'res' directly."
    }
  ],
  "ai_available": true,
  "llm_available": true,
  "fallback_reason": null,
  "analysis_time_ms": 142,
  "cached": false,
  "consent_version": "v1.0"
}
```

---

### 2. `GET /review/stream`
Query parameters:
- `code`: source code string
- `language`: `"python"` or `"cpp"`

Returns Server-Sent Events (`text/event-stream`):
```text
data: {"token": "1. "}
data: {"token": "Consider "}
...
data: [DONE]
```

---

### 3. `POST /rate`
JSON Payload:
```json
{
  "review_id": "a1b2c3d4e5f6-1786435000",
  "rating": 1
}
```

---

### 4. `POST /ta-submit`
JSON Payload:
```json
{
  "review_id": "a1b2c3d4e5f6-1786435000"
}
```

---

### 5. `GET /export` (Protected)
Headers: `x-api-key: <RESEARCH_API_KEY>` (or query param `?api_key=...`)
Query parameter: `format=json` (default) or `format=csv`

---

### 6. `GET /dashboard` (Protected)
Headers: `x-api-key: <RESEARCH_API_KEY>` (or query param `?api_key=...`)
Returns HTML page displaying Chart.js analytics.
