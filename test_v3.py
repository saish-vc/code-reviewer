import unittest
from fastapi.testclient import TestClient

from app import app, _compute_delta_and_diff

client = TestClient(app)


class TestTask1Resubmission(unittest.TestCase):

    def test_compute_delta_and_diff_helper(self):
        orig_code = "def add(a,b):\n    res = a + b\n    return res\n"
        rev_code = "def add(a, b):\n    return a + b\n"
        orig_issues = [{"line": "2", "severity": "warning", "message": "Unused variable res"}]
        rev_issues = []
        orig_struct = [{"issue": "Unused variable", "line": 2, "explanation": "res is redundant", "fix": "Return directly"}]
        rev_struct = []

        delta, diff = _compute_delta_and_diff(
            orig_code, rev_code, orig_issues, rev_issues, orig_struct, rev_struct
        )

        self.assertEqual(delta["static_issue_count_change"], -1)
        self.assertEqual(delta["original_static_count"], 1)
        self.assertEqual(delta["revised_static_count"], 0)
        self.assertEqual(delta["severity_changes"]["warning"], -1)
        self.assertEqual(delta["ai_issue_count_change"], -1)
        self.assertIn("-    res = a + b", diff)
        self.assertIn("+    return a + b", diff)

    def test_resubmit_flow_and_comparison_api(self):
        orig_code = "def foo():\n    x = 10\n    return 0\n"
        # 1. Post initial review
        r1 = client.post("/review", data={"language": "python", "code": orig_code})
        self.assertEqual(r1.status_code, 200)
        data1 = r1.json()
        parent_id = data1["review_id"]
        self.assertIsNone(data1.get("parent_review_id"))

        # 2. Resubmit revised version
        rev_code = "def foo():\n    return 0\n"
        r2 = client.post(f"/reviews/{parent_id}/resubmit", data={"language": "python", "code": rev_code})
        self.assertEqual(r2.status_code, 200)
        data2 = r2.json()
        resubmit_id = data2["review_id"]
        self.assertEqual(data2["parent_review_id"], parent_id)
        self.assertIn("delta_summary", data2)
        self.assertIn("line_diff", data2)

        # 3. Get comparison
        r3 = client.get(f"/reviews/{resubmit_id}/comparison")
        self.assertEqual(r3.status_code, 200)
        comp_data = r3.json()
        self.assertIn("original_review", comp_data)
        self.assertIn("revised_review", comp_data)
        self.assertIn("delta_summary", comp_data)
        self.assertIn("line_diff", comp_data)
        self.assertEqual(comp_data["original_review"]["review_id"], parent_id)
        self.assertEqual(comp_data["revised_review"]["review_id"], resubmit_id)

    def test_resubmit_nonexistent_parent(self):
        r = client.post("/reviews/fake-id-12345/resubmit", data={"language": "python", "code": "print(1)"})
        self.assertEqual(r.status_code, 404)


if __name__ == "__main__":
    unittest.main()
