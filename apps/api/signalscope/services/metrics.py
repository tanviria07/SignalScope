"""
Per-window and global signal metrics.

Asymmetry and drift scores are **heuristic developer-tool metrics** for comparing
segments and spotting obvious shape changes. They are not formal scientific
standards; see inline comments for definitions.
"""

from __future__ import annotations

import numpy as np
import pandas as pd

from signalscope.schemas.models import GlobalMetrics, SegmentMetrics


def _trend_slope(values: np.ndarray) -> float:
    """Least-squares slope vs index (unit: value per step)."""
    n = len(values)
    if n < 2:
        return 0.0
    x = np.arange(n, dtype=float)
    coef = np.polyfit(x, values.astype(float), 1)
    return float(coef[0])


def _local_peak_count(values: np.ndarray) -> int:
    """Count strict local maxima in the interior (simple engineering heuristic)."""
    if len(values) < 3:
        return 0
    v = values.astype(float)
    peaks = 0
    for i in range(1, len(v) - 1):
        if v[i] > v[i - 1] and v[i] > v[i + 1]:
            peaks += 1
    return peaks


def asymmetry_score(values: np.ndarray) -> float:
    """
    Heuristic asymmetry: scaled difference between mean and median, normalized by spread.

    - Uses (mean - median) / (IQR + eps) as a robust-ish skew proxy for tool UX.
    - Not a formal skewness statistic; kept transparent for developers.
    """
    v = values.astype(float)
    if len(v) < 2:
        return 0.0
    med = float(np.median(v))
    mean = float(np.mean(v))
    q25, q75 = np.percentile(v, [25, 75])
    iqr = float(q75 - q25)
    eps = 1e-9
    return float((mean - med) / (iqr + eps))


def drift_score(values: np.ndarray) -> float:
    """
    Heuristic drift: split window into first/second halves; compare means.

    score = |mean(second) - mean(first)| / (std(full_window) + eps)

    Captures step-like level shifts within a window; useful for segmented views.
    """
    v = values.astype(float)
    n = len(v)
    if n < 4:
        return 0.0
    mid = n // 2
    a, b = v[:mid], v[mid:]
    diff = abs(float(np.mean(b)) - float(np.mean(a)))
    std = float(np.std(v, ddof=0))
    eps = 1e-9
    return float(diff / (std + eps))


def compute_for_array(values: np.ndarray) -> tuple[float, float, float, float, float, int, float, float]:
    """Returns mean, std, min, max, slope, peaks, asymmetry, drift."""
    if len(values) == 0:
        return 0.0, 0.0, 0.0, 0.0, 0.0, 0, 0.0, 0.0
    v = values.astype(float)
    mean = float(np.mean(v))
    std = float(np.std(v, ddof=0))
    return (
        mean,
        std,
        float(np.min(v)),
        float(np.max(v)),
        _trend_slope(v),
        _local_peak_count(v),
        asymmetry_score(v),
        drift_score(v),
    )


def global_metrics_from_df(df: pd.DataFrame) -> GlobalMetrics:
    vals = df["value"].to_numpy()
    mean, std, vmin, vmax, slope, peaks, asym, drift = compute_for_array(vals)
    return GlobalMetrics(
        mean=mean,
        std=std,
        min=vmin,
        max=vmax,
        trend_slope=slope,
        local_peak_count=peaks,
        asymmetry_score=asym,
        drift_score=drift,
    )


def segment_metrics_from_chunk(chunk: pd.DataFrame, segment_index: int) -> SegmentMetrics:
    vals = chunk["value"].to_numpy()
    mean, std, vmin, vmax, slope, peaks, asym, drift = compute_for_array(vals)
    ts0 = chunk.iloc[0]["timestamp"]
    ts1 = chunk.iloc[-1]["timestamp"]
    t0 = ts0.isoformat() if hasattr(ts0, "isoformat") else str(ts0)
    t1 = ts1.isoformat() if hasattr(ts1, "isoformat") else str(ts1)
    return SegmentMetrics(
        segment_index=segment_index,
        start_timestamp=t0,
        end_timestamp=t1,
        point_count=len(chunk),
        mean=mean,
        std=std,
        min=vmin,
        max=vmax,
        trend_slope=slope,
        local_peak_count=peaks,
        asymmetry_score=asym,
        drift_score=drift,
    )
