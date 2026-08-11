"""
Dry-run test suite for app.py.
Run with: python test_app.py
All tests are synchronous HTTP calls against a running server (started in subprocess).
"""
import sys
if sys.stdout.encoding and sys.stdout.encoding.lower() not in ('utf-8', 'utf-16'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
import hashlib
import io
import json
import os
import subprocess
import tempfile
import time
import urllib.request
import urllib.error

BASE = "http://127.0.0.1:7860"
PASS = "\033[92mPASS\033[0m"
FAIL = "\033[91mFAIL\033[0m"
results: list[tuple[str, bool, str]] = []


def req(method: str, path: str, data=None, headers=None, raw_body=None):
    url = BASE + path
    h = headers or {}
    body = None
    if raw_body is not None:
        body = raw_body
    elif data is not None:
        body = json.dumps(data).encode()
        h.setdefault("Content-Type", "application/json")
    r = urllib.request.Request(url, data=body, headers=h, method=method)
    try:
        with urllib.request.urlopen(r, timeout=60) as resp:
            return resp.status, json.loads(resp.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read())


def multipart_post(path: str, fields: dict, files: dict = None):
    """Minimal multipart/form-data encoder."""
    boundary = "----TestBoundary7860"
    parts = []
    for name, value in fields.items():
        parts.append(
            f"------TestBoundary7860\r\nContent-Disposition: form-data; name=\"{name}\"\r\n\r\n{value}\r\n"
        )
    if files:
        for name, (filename, content, ctype) in files.items():
            parts.append(
                f"------TestBoundary7860\r\nContent-Disposition: form-data; name=\"{name}\"; filename=\"{filename}\"\r\nContent-Type: {ctype}\r\n\r\n"
            )
            parts_bytes = [p.encode() for p in parts]
            parts_bytes.append(content if isinstance(content, bytes) else content.encode())
            parts_bytes.append(b"\r\n")
            parts = []
            body = b"".join(parts_bytes) + f"------TestBoundary7860--\r\n".encode()
            headers = {"Content-Type": f"multipart/form-data; boundary=----TestBoundary7860"}
            r = urllib.request.Request(BASE + path, data=body, headers=headers, method="POST")
            try:
                with urllib.request.urlopen(r, timeout=60) as resp:
                    return resp.status, json.loads(resp.read())
            except urllib.error.HTTPError as e:
                return e.code, json.loads(e.read())
    body_str = "".join(parts) + "------TestBoundary7860--\r\n"
    body_bytes = body_str.encode()
    headers = {"Content-Type": f"multipart/form-data; boundary=----TestBoundary7860"}
    r = urllib.request.Request(BASE + path, data=body_bytes, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(r, timeout=60) as resp:
            return resp.status, json.loads(resp.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read())


def check(name: str, condition: bool, detail: str = ""):
    results.append((name, condition, detail))
    status = PASS if condition else FAIL
    print(f"  [{status}] {name}" + (f" — {detail}" if detail else ""))


def wait_for_server(max_wait: int = 20):
    for _ in range(max_wait * 2):
        try:
            urllib.request.urlopen(BASE + "/", timeout=2)
            return True
        except Exception:
            time.sleep(0.5)
    return False


PYTHON_SNIPPET = """\
def add(a,b):
    x=a+b
    return x
result=add(1,2)
print(result)
"""

CPP_SNIPPET = """\
#include<iostream>
using namespace std;
int main(){
int x=5;
cout<<x<<endl;
return 0;
}
"""

TOO_LONG_CODE = "\n".join(f"x_{i} = {i}" for i in range(510))


def run_tests():
    print("\n=== TEST: GET / (homepage) ===")
    try:
        with urllib.request.urlopen(BASE + "/", timeout=10) as r:
            body = r.read().decode()
            check("Returns 200", r.status == 200)
            check("Contains title", "AI Code Reviewer" in body)
            check("Contains form", "review-form" in body)
            check("Prism.js loaded", "prism" in body)
    except Exception as e:
        check("GET / reachable", False, str(e))

    print("\n=== TEST: POST /review — Python code (text) ===")
    status, data = multipart_post("/review", {"language": "python", "code": PYTHON_SNIPPET})
    check("Returns 200", status == 200, str(status))
    check("Has review_id", "review_id" in data)
    check("Has issues list", "issues" in data and isinstance(data["issues"], list))
    check("Has issues_count", "issues_count" in data)
    check("Has tool_warnings", "tool_warnings" in data)
    check("Has llm_available flag", "llm_available" in data)
    check("Has analysis_time_ms", "analysis_time_ms" in data and data["analysis_time_ms"] >= 0)
    review_id_py = data.get("review_id", "")

    print("\n=== TEST: POST /review — C++ code (text) ===")
    status, data = multipart_post("/review", {"language": "cpp", "code": CPP_SNIPPET})
    check("Returns 200", status == 200, str(status))
    check("Has review_id", "review_id" in data)
    check("Has issues list", "issues" in data and isinstance(data["issues"], list))
    review_id_cpp = data.get("review_id", "")

    print("\n=== TEST: POST /review — File upload (.py) ===")
    status, data = multipart_post(
        "/review",
        {"language": "python"},
        files={"file": ("test.py", PYTHON_SNIPPET, "text/plain")},
    )
    check("File upload returns 200", status == 200, str(status))
    check("Has review_id", "review_id" in data)

    print("\n=== TEST: POST /review — Validation errors ===")
    status, data = multipart_post("/review", {"language": "python", "code": ""})
    check("Empty code -> 400", status == 400, str(status))

    status, data = multipart_post("/review", {"language": "cobol", "code": "x=1"})
    check("Bad language -> 400", status == 400, str(status))

    status, data = multipart_post("/review", {"language": "python", "code": TOO_LONG_CODE})
    check("Too-long code -> 400", status == 400, str(status))
    check("Error message mentions limit", "500" in data.get("detail", ""), data.get("detail", ""))

    print("\n=== TEST: POST /rate ===")
    status, data = req("POST", "/rate", {"review_id": review_id_py, "rating": 1})
    check("Rate thumbs-up -> 200", status == 200, str(status))
    check("Response has status ok", data.get("status") == "ok")

    status, data = req("POST", "/rate", {"review_id": review_id_py, "rating": -1})
    check("Rate thumbs-down -> 200", status == 200, str(status))

    status, data = req("POST", "/rate", {"review_id": "nonexistent-id", "rating": 1})
    check("Rate unknown id -> 404", status == 404, str(status))

    status, data = req("POST", "/rate", {"review_id": review_id_py, "rating": 99})
    check("Invalid rating -> 400", status == 400, str(status))

    print("\n=== TEST: POST /ta-submit ===")
    status, data = req("POST", "/ta-submit", {"review_id": review_id_cpp})
    check("TA submit -> 200", status == 200, str(status))
    check("Response queued", data.get("status") == "queued")

    status, data = req("POST", "/ta-submit", {"review_id": "bad-id"})
    check("TA submit unknown -> 404", status == 404, str(status))

    status, data = req("POST", "/ta-submit", {"review_id": review_id_cpp})
    check("TA submit duplicate -> still 200", status == 200, str(status))

    print("\n=== TEST: GET /metrics ===")
    status, data = req("GET", "/metrics")
    check("Metrics → 200", status == 200, str(status))
    for key in ("total_reviews", "rated_reviews", "avg_analysis_time_ms", "avg_issues_per_review", "avg_llm_response_length", "ta_queue_size"):
        check(f"Metrics has '{key}'", key in data, str(data.get(key)))
    check("total_reviews >= 3", data.get("total_reviews", 0) >= 3, str(data.get("total_reviews")))
    check("ta_queue_size >= 1", data.get("ta_queue_size", 0) >= 1)

    print("\n=== TEST: GET /ta-queue ===")
    status, data = req("GET", "/ta-queue")
    check("TA queue → 200", status == 200, str(status))
    check("Has 'queue' key", "queue" in data)
    check("Has 'total' key", "total" in data)
    check("Queue is non-empty", data.get("total", 0) >= 1)
    if data.get("queue"):
        entry = data["queue"][0]
        for key in ("review_id", "timestamp", "language", "issues_count"):
            check(f"Queue entry has '{key}'", key in entry)

    print("\n=== TEST: Rate limiting (simulated) ===")
    # Send 10 more rapid requests from same "IP" (127.0.0.1) — server has 10/min limit
    # We've already sent several; sending more in a tight loop to trip the limiter
    hit_limit = False
    for _ in range(15):
        s, _ = multipart_post("/review", {"language": "python", "code": "x = 1"})
        if s == 429:
            hit_limit = True
            break
    check("Rate limiter triggers 429", hit_limit)

    print("\n" + "=" * 55)
    passed = sum(1 for _, ok, _ in results if ok)
    total = len(results)
    print(f"  Results: {passed}/{total} passed")
    if passed == total:
        print(f"  \033[92mAll tests passed!\033[0m")
    else:
        failed = [(n, d) for n, ok, d in results if not ok]
        print(f"  \033[91m{len(failed)} failed:\033[0m")
        for name, detail in failed:
            print(f"    - {name}: {detail}")
    print("=" * 55)
    return passed == total


if __name__ == "__main__":
    server = subprocess.Popen(
        [sys.executable, "app.py"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        env={**os.environ, "NVIDIA_API_KEY": ""},
    )
    print("Starting server...")
    if not wait_for_server(30):
        print("Server failed to start. Stderr:")
        print(server.stderr.read().decode())
        server.terminate()
        sys.exit(1)
    print("Server ready.\n")
    try:
        ok = run_tests()
    finally:
        server.terminate()
        server.wait()
    sys.exit(0 if ok else 1)
