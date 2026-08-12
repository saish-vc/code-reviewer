from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class StaticIssue(BaseModel):
    line: str
    severity: str
    message: str


class StructuredFeedbackPoint(BaseModel):
    issue: str
    line: Optional[int] = None
    explanation: str
    fix: str


class ReviewRequest(BaseModel):
    language: str
    code: Optional[str] = None


class DeltaSummary(BaseModel):
    static_issue_count_change: int
    original_static_count: int
    revised_static_count: int
    severity_changes: Dict[str, int]
    ai_issue_count_change: int
    original_ai_count: int
    revised_ai_count: int


class ReviewResponse(BaseModel):
    review_id: str
    parent_review_id: Optional[str] = None
    language: str
    code_hash: str
    issues: List[StaticIssue]
    issues_count: int
    tool_warnings: List[str]
    llm_feedback: str
    structured_feedback: Optional[List[StructuredFeedbackPoint]] = None
    llm_available: bool = Field(default=True, alias="ai_available")
    ai_available: bool = True
    fallback_reason: Optional[str] = None
    analysis_time_ms: int
    cached: bool = False
    consent_version: str = "v1.0"
    delta_summary: Optional[DeltaSummary] = None
    line_diff: Optional[str] = None

    class Config:
        populate_by_name = True


class ComparisonResponse(BaseModel):
    original_review: Dict[str, Any]
    revised_review: Dict[str, Any]
    delta_summary: DeltaSummary
    line_diff: str


class RatingRequest(BaseModel):
    review_id: str
    rating: int


class TaSubmitRequest(BaseModel):
    review_id: str


class MetricsResponse(BaseModel):
    total_reviews: int
    rated_reviews: int
    avg_rating: Optional[float]
    avg_analysis_time_ms: int
    avg_issues_per_review: float
    avg_llm_response_length: int
    ta_queue_size: int


class HealthResponse(BaseModel):
    status: str = "ok"
    service: str = "REVU API"
    version: str = "v3.0"

