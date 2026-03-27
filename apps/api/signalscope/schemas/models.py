from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class PointRow(BaseModel):
    """Single observation after normalization."""

    timestamp: str
    value: float
    series_id: str | None = None
    label: str | None = None


class UploadResponse(BaseModel):
    upload_id: str
    filename: str
    row_count: int
    columns_detected: list[str]
    preview: list[PointRow]
    sample_format_markdown: str = Field(
        description="Human-readable accepted CSV shape for UI display.",
    )


class AnalysisConfig(BaseModel):
    """Configuration persisted with each analysis run."""

    window_size: int = Field(ge=2, le=1_000_000, description="Fixed-size window length in points.")
    segmentation_enabled: bool = True
    anomaly_method: Literal["zscore", "rolling"] = "zscore"
    z_threshold: float = Field(default=3.0, ge=0.5, le=20.0)
    rolling_window: int = Field(default=20, ge=3, le=10_000)


class AnalyzeRequest(BaseModel):
    upload_id: str
    config: AnalysisConfig = Field(default_factory=AnalysisConfig)


class AnomalyPoint(BaseModel):
    timestamp: str
    value: float
    score: float
    reason: str


class SegmentMetrics(BaseModel):
    segment_index: int
    start_timestamp: str
    end_timestamp: str
    point_count: int
    mean: float
    std: float
    min: float
    max: float
    trend_slope: float
    local_peak_count: int
    asymmetry_score: float
    drift_score: float


class GlobalMetrics(BaseModel):
    mean: float
    std: float
    min: float
    max: float
    trend_slope: float
    local_peak_count: int
    asymmetry_score: float
    drift_score: float


class InsightItem(BaseModel):
    text: str
    severity: Literal["info", "warning", "notice"] = "info"


class AnalysisDetailResponse(BaseModel):
    analysis_id: str
    filename: str
    created_at: datetime
    config: AnalysisConfig
    points: list[PointRow]
    segments: list[SegmentMetrics]
    global_metrics: GlobalMetrics
    anomalies: list[AnomalyPoint]
    anomaly_count: int
    insights: list[InsightItem]
    segment_boundaries: list[str] = Field(
        default_factory=list,
        description="Timestamps where a new segment starts (for chart overlays).",
    )


class AnalysisSummaryResponse(BaseModel):
    analysis_id: str
    filename: str
    created_at: datetime
    config: AnalysisConfig
    global_metrics: GlobalMetrics
    anomaly_count: int
    insights: list[InsightItem]


class HistoryItem(BaseModel):
    analysis_id: str
    filename: str
    created_at: datetime
    config: AnalysisConfig
    global_metrics: GlobalMetrics
    anomaly_count: int
