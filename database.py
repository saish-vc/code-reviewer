import json
import sqlite3
from datetime import datetime
from typing import Any, Dict, List, Optional

DB_PATH = "reviews.db"


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with get_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS reviews (
                review_id TEXT PRIMARY KEY,
                timestamp TEXT NOT NULL,
                code_hash TEXT NOT NULL,
                language TEXT NOT NULL,
                code_snippet TEXT NOT NULL,
                issues_count INTEGER NOT NULL,
                issues_json TEXT NOT NULL,
                tool_warnings_json TEXT NOT NULL DEFAULT '[]',
                llm_feedback TEXT NOT NULL,
                llm_available INTEGER NOT NULL DEFAULT 1,
                fallback_reason TEXT,
                rating INTEGER DEFAULT 0,
                analysis_time_ms INTEGER NOT NULL,
                llm_response_length INTEGER NOT NULL,
                in_ta_queue INTEGER DEFAULT 0,
                consent_version TEXT DEFAULT 'v1.0'
            )
        """)
        conn.execute("CREATE INDEX IF NOT EXISTS idx_code_hash ON reviews(code_hash, language)")
        conn.commit()


def get_cached_review(code_hash: str, language: str) -> Optional[Dict[str, Any]]:
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            """
            SELECT * FROM reviews 
            WHERE code_hash = ? AND language = ? 
            ORDER BY timestamp DESC LIMIT 1
            """,
            (code_hash, language),
        )
        row = cur.fetchone()
        if row:
            d = dict(row)
            d["issues"] = json.loads(d["issues_json"])
            d["tool_warnings"] = json.loads(d.get("tool_warnings_json") or "[]")
            d["llm_available"] = bool(d["llm_available"])
            return d
    return None


def save_review(record: Dict[str, Any]) -> None:
    with get_db() as conn:
        conn.execute(
            """
            INSERT OR REPLACE INTO reviews (
                review_id, timestamp, code_hash, language, code_snippet,
                issues_count, issues_json, tool_warnings_json, llm_feedback,
                llm_available, fallback_reason, rating, analysis_time_ms,
                llm_response_length, in_ta_queue, consent_version
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                record["review_id"],
                record.get("timestamp", datetime.utcnow().isoformat()),
                record["code_hash"],
                record["language"],
                record.get("code_snippet", "")[:1000],
                record["issues_count"],
                json.dumps(record.get("issues", [])),
                json.dumps(record.get("tool_warnings", [])),
                record.get("llm_feedback", ""),
                1 if record.get("llm_available", True) else 0,
                record.get("fallback_reason"),
                record.get("rating", 0),
                record.get("analysis_time_ms", 0),
                len(record.get("llm_feedback", "")),
                record.get("in_ta_queue", 0),
                record.get("consent_version", "v1.0"),
            ),
        )
        conn.commit()


def update_rating(review_id: str, rating: int) -> bool:
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("UPDATE reviews SET rating = ? WHERE review_id = ?", (rating, review_id))
        conn.commit()
        return cur.rowcount > 0


def update_ta_queue(review_id: str) -> bool:
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("UPDATE reviews SET in_ta_queue = 1 WHERE review_id = ?", (review_id,))
        conn.commit()
        return cur.rowcount > 0


def get_ta_queue_records() -> List[Dict[str, Any]]:
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("SELECT * FROM reviews WHERE in_ta_queue = 1 ORDER BY timestamp DESC")
        rows = cur.fetchall()
        result = []
        for r in rows:
            d = dict(r)
            d["issues"] = json.loads(d["issues_json"])
            d["tool_warnings"] = json.loads(d.get("tool_warnings_json") or "[]")
            d["llm_available"] = bool(d["llm_available"])
            result.append(d)
        return result


def get_all_reviews() -> List[Dict[str, Any]]:
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("SELECT * FROM reviews ORDER BY timestamp DESC")
        rows = cur.fetchall()
        result = []
        for r in rows:
            d = dict(r)
            d["issues"] = json.loads(d["issues_json"])
            d["tool_warnings"] = json.loads(d.get("tool_warnings_json") or "[]")
            d["llm_available"] = bool(d["llm_available"])
            result.append(d)
        return result
