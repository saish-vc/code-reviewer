import hashlib
import json
import unittest
from fastapi.testclient import TestClient

from app import app
from nim_client import (
    build_prompt,
    call_fallback_llm,
    call_nvidia_nim,
    get_ai_feedback,
    parse_structured_feedback,
)
from static_analysis import parse_bandit, parse_cpplint, parse_pylint

client = TestClient(app)


class TestV2Suite(unittest.TestCase):

    # === 1. PURE FUNCTION UNIT TESTS ===

    def test_parse_pylint(self):
        sample_output = "submission.py:14:0: W0612: Unused variable 'res' (unused-variable)\nsubmission.py:20:4: E0602: Undefined variable 'foo' (undefined-variable)"
        issues = parse_pylint(sample_output)
        self.assertEqual(len(issues), 2)
        self.assertEqual(issues[0]["line"], "14")
        self.assertEqual(issues[0]["severity"], "warning")
        self.assertIn("Unused variable 'res'", issues[0]["message"])
        self.assertEqual(issues[1]["severity"], "error")

    def test_parse_pylint_malformed_and_empty(self):
        self.assertEqual(parse_pylint(""), [])
        self.assertEqual(parse_pylint("Random unparseable log text\nno colon here"), [])

    def test_parse_bandit(self):
        sample_output = ">> Issue: [B101:assert_used] Use of assert detected.\n   Severity: Medium   Confidence: High\n   Location: submission.py:25"
        issues = parse_bandit(sample_output)
        self.assertEqual(len(issues), 1)
        self.assertEqual(issues[0]["line"], "25")
        self.assertEqual(issues[0]["severity"], "medium")
        self.assertIn("[Security]", issues[0]["message"])

    def test_parse_bandit_empty(self):
        self.assertEqual(parse_bandit(""), [])

    def test_parse_cpplint(self):
        stderr_sample = "submission.cpp:10:  Should have a space between string and [build/header_guard]"
        issues = parse_cpplint(stderr_sample)
        self.assertEqual(len(issues), 1)
        self.assertEqual(issues[0]["line"], "10")
        self.assertEqual(issues[0]["severity"], "warning")

    def test_code_hash_generation(self):
        code = "def add(a, b):\n    return a + b"
        h1 = hashlib.sha256(code.strip().encode()).hexdigest()
        h2 = hashlib.sha256(code.strip().encode()).hexdigest()
        self.assertEqual(h1, h2)
        self.assertEqual(len(h1), 64)

    def test_parse_structured_feedback_valid_json(self):
        json_text = """[
            {
                "issue": "Unused variable",
                "line": 14,
                "explanation": "Variable 'res' is assigned but never read.",
                "fix": "Remove or return 'res'."
            }
        ]"""
        points, raw = parse_structured_feedback(json_text)
        self.assertEqual(len(points), 1)
        self.assertEqual(points[0]["issue"], "Unused variable")
        self.assertEqual(points[0]["line"], 14)

    def test_parse_structured_feedback_markdown_wrapped(self):
        markdown_json = """```json
        [
            {
                "issue": "Buffer Overflow",
                "line": 10,
                "explanation": "Array indexing exceeds bound.",
                "fix": "Check loop condition i < 10."
            }
        ]
        ```"""
        points, raw = parse_structured_feedback(markdown_json)
        self.assertEqual(len(points), 1)
        self.assertEqual(points[0]["issue"], "Buffer Overflow")

    def test_parse_structured_feedback_malformed(self):
        points, raw = parse_structured_feedback("This is just free text not JSON")
        self.assertEqual(points, [])
        self.assertEqual(raw, "This is just free text not JSON")

    # === 2. MOCKED NIM & FALLBACK LOGIC TESTS ===

    def test_get_ai_feedback_nim_success(self):
        import nim_client
        orig_nim = nim_client.call_nvidia_nim
        try:
            nim_client.call_nvidia_nim = lambda prompt: ('[{"issue": "Mock NIM", "line": 1, "explanation": "Ok", "fix": "Fix"}]', True, None)
            raw, structured, available, reason = get_ai_feedback("test prompt")
            self.assertTrue(available)
            self.assertEqual(len(structured), 1)
            self.assertEqual(structured[0]["issue"], "Mock NIM")
            self.assertIsNone(reason)
        finally:
            nim_client.call_nvidia_nim = orig_nim

    def test_get_ai_feedback_fallback_trigger(self):
        import nim_client
        orig_nim = nim_client.call_nvidia_nim
        orig_fallback = nim_client.call_fallback_llm
        try:
            nim_client.call_nvidia_nim = lambda prompt: ("", False, "NVIDIA NIM timeout")
            nim_client.call_fallback_llm = lambda prompt: ('[{"issue": "Mock Groq Fallback", "line": 5, "explanation": "Fallback active", "fix": "Fixed"}]', True, None)

            raw, structured, available, reason = get_ai_feedback("test prompt")
            self.assertTrue(available)
            self.assertEqual(len(structured), 1)
            self.assertEqual(structured[0]["issue"], "Mock Groq Fallback")
        finally:
            nim_client.call_nvidia_nim = orig_nim
            nim_client.call_fallback_llm = orig_fallback

    def test_get_ai_feedback_all_fail(self):
        import nim_client
        orig_nim = nim_client.call_nvidia_nim
        orig_fallback = nim_client.call_fallback_llm
        try:
            nim_client.call_nvidia_nim = lambda prompt: ("", False, "NIM offline")
            nim_client.call_fallback_llm = lambda prompt: ("", False, "No fallback key")

            raw, structured, available, reason = get_ai_feedback("test prompt")
            self.assertFalse(available)
            self.assertEqual(structured, [])
            self.assertIn("NIM offline", reason)
        finally:
            nim_client.call_nvidia_nim = orig_nim
            nim_client.call_fallback_llm = orig_fallback

    # === 3. INTEGRATION TESTS FOR V2 API CONTRACT ===

    def test_api_health_check(self):
        res = client.get("/")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "ok")
        self.assertEqual(data["version"], "v2.0")

    def test_api_review_contract(self):
        snippet = "def add(a, b):\n    return a + b\n"
        response = client.post("/review", data={"language": "python", "code": snippet})
        self.assertEqual(response.status_code, 200)
        data = response.json()

        self.assertIn("review_id", data)
        self.assertIsInstance(data["review_id"], str)
        self.assertIn("code_hash", data)
        self.assertIn("issues", data)
        self.assertIsInstance(data["issues"], list)
        self.assertIn("issues_count", data)
        self.assertIn("llm_feedback", data)
        self.assertIn("ai_available", data)
        self.assertIsInstance(data["ai_available"], bool)
        self.assertIn("analysis_time_ms", data)

    def test_api_review_validation_errors(self):
        res1 = client.post("/review", data={"language": "java", "code": "class Main{}"})
        self.assertEqual(res1.status_code, 400)

        big_code = "\n".join([f"x = {i}" for i in range(515)])
        res2 = client.post("/review", data={"language": "python", "code": big_code})
        self.assertEqual(res2.status_code, 400)
        self.assertIn("500-line limit", res2.json()["detail"])

    def test_api_rating_and_ta_submit(self):
        res = client.post("/review", data={"language": "python", "code": "x = 10\nprint(x)"})
        self.assertEqual(res.status_code, 200)
        review_id = res.json()["review_id"]

        rate_res = client.post("/rate", json={"review_id": review_id, "rating": 1})
        self.assertEqual(rate_res.status_code, 200)
        self.assertEqual(rate_res.json()["status"], "ok")

        ta_res = client.post("/ta-submit", json={"review_id": review_id})
        self.assertEqual(ta_res.status_code, 200)
        self.assertEqual(ta_res.json()["status"], "queued")

        q_res = client.get("/ta-queue")
        self.assertEqual(q_res.status_code, 200)
        queue_data = q_res.json()["queue"]
        self.assertTrue(any(q["review_id"] == review_id for q in queue_data))


if __name__ == "__main__":
    unittest.main()
