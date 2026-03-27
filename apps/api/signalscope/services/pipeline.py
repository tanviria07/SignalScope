"""Orchestrates parsing config + dataframe into a full `AnalysisDetailResponse`."""

from __future__ import annotations

import pandas as pd

from signalscope.schemas.models import AnalysisConfig, AnalysisDetailResponse
from signalscope.services.anomaly import detect_anomalies
from signalscope.services.metrics import global_metrics_from_df, segment_metrics_from_chunk
from signalscope.services.parsing import dataframe_to_points
from signalscope.services.segmentation import segment_start_timestamps, split_fixed_windows
from signalscope.services.storage import new_analysis_id
from signalscope.services.summaries import generate_insights


def run_analysis(
    df: pd.DataFrame,
    filename: str,
    config: AnalysisConfig,
    analysis_id: str | None = None,
) -> AnalysisDetailResponse:
    from datetime import datetime, timezone

    aid = analysis_id or new_analysis_id()
    points = dataframe_to_points(df)

    global_metrics = global_metrics_from_df(df)

    segments: list = []
    boundaries: list[str] = []
    if config.segmentation_enabled and len(df) >= 2:
        chunks = split_fixed_windows(df, config.window_size)
        boundaries = segment_start_timestamps(chunks)
        for i, ch in enumerate(chunks):
            segments.append(segment_metrics_from_chunk(ch, i))

    anomalies = detect_anomalies(
        df,
        method=config.anomaly_method,
        z_threshold=config.z_threshold,
        rolling_window=config.rolling_window,
    )
    anomaly_ts = [a.timestamp for a in anomalies]

    insights = generate_insights(segments, anomaly_ts, config)

    return AnalysisDetailResponse(
        analysis_id=aid,
        filename=filename,
        created_at=datetime.now(timezone.utc),
        config=config,
        points=points,
        segments=segments,
        global_metrics=global_metrics,
        anomalies=anomalies,
        anomaly_count=len(anomalies),
        insights=insights,
        segment_boundaries=boundaries,
    )
