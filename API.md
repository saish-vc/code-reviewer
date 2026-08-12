# REVU AI Code Reviewer — Backend API Specification (v3.0)

Clean, CORS-enabled REST & SSE API for student code review, static analysis, resubmission diffing, and LLM pedagogical feedback.

## 🚀 Base URL
Default local development: `http://localhost:7860`

---

## 📋 Endpoints Summary

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET`  | `/` | API health check & status | No |
| `POST` | `/review` | Execute static analysis + LLM feedback | No |
| `POST` | `/reviews/{review_id}/resubmit` | Resubmit revised code linked to parent review | No |
| `GET`  | `/reviews/{review_id}/comparison` | Compare original vs resubmitted findings & diff | No |
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

#### Response Body (`200 OK`):
```json
{
  "review_id": "a1b2c3d4e5f6-1786435000",
  "parent_review_id": null,
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

### 2. `POST /reviews/{review_id}/resubmit`
Accepts `multipart/form-data`:
- `language`: `"python"` or `"cpp"` (optional, defaults to parent review's language)
- `code`: revised code string
- `file`: revised uploaded file

#### Response Body (`200 OK`):
```json
{
  "review_id": "c9d8e7f6a5b4-1786435999",
  "parent_review_id": "a1b2c3d4e5f6-1786435000",
  "language": "python",
  "issues": [],
  "issues_count": 0,
  "delta_summary": {
    "static_issue_count_change": -1,
    "original_static_count": 1,
    "revised_static_count": 0,
    "severity_changes": { "warning": -1 },
    "ai_issue_count_change": -1,
    "original_ai_count": 1,
    "revised_ai_count": 0
  },
  "line_diff": "--- original\n+++ revised\n@@ -1,4 +1,3 @@\n..."
}
```

---

### 3. `GET /reviews/{review_id}/comparison`
Returns side-by-side comparison between original and revised submissions:
```json
{
  "original_review": { ... },
  "revised_review": { ... },
  "delta_summary": { ... },
  "line_diff": "..."
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
