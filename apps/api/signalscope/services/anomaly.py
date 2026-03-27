"""
Simple anomaly detectors: global z-score or rolling deviation.

Intended for highlighting suspicious points in engineering telemetry, not for
production alerting without tuning.
"""

from __future__ import annotations

import numpy as np
import pandas as pd

from signalscope.schemas.models import AnomalyPoint


def detect_anomalies(
    df: pd.DataFrame,
    method: str,
    z_threshold: float,
    rolling_window: int,
) -> list[AnomalyPoint]:
    """
    Flag points as anomalies.

    - zscore: |z| > threshold vs global mean/std.
    - rolling: deviation from rolling mean vs rolling std (first `rolling_window` points skipped).
    """
    vals = df["value"].to_numpy(dtype=float)
    ts_series = df["timestamp"]
    n = len(vals)
    if n == 0:
        return []

    anomalies: list[AnomalyPoint] = []

    if method == "zscore":
        mu = float(np.mean(vals))
        sigma = float(np.std(vals, ddof=0))
        if sigma < 1e-12:
            sigma = 1e-12
        z = (vals - mu) / sigma
        for i in range(n):
            if abs(z[i]) > z_threshold:
                ts = ts_series.iloc[i]
                tstr = ts.isoformat() if hasattr(ts, "isoformat") else str(ts)
                anomalies.append(
                    AnomalyPoint(
                        timestamp=tstr,
                        value=float(vals[i]),
                        score=float(abs(z[i])),
                        reason=f"Global z-score {z[i]:.2f} exceeds ±{z_threshold}",
                    )
                )
        return anomalies

    # rolling
    w = max(3, min(rolling_window, n))
    series = pd.Series(vals)
    roll_mean = series.rolling(window=w, min_periods=w).mean()
    roll_std = series.rolling(window=w, min_periods=w).std(ddof=0)
    for i in range(n):
        if pd.isna(roll_mean.iloc[i]) or pd.isna(roll_std.iloc[i]):
            continue
        rs = float(roll_std.iloc[i])
        if rs < 1e-12:
            rs = 1e-12
        dev = abs(float(vals[i]) - float(roll_mean.iloc[i])) / rs
        if dev > z_threshold:
            ts = ts_series.iloc[i]
            tstr = ts.isoformat() if hasattr(ts, "isoformat") else str(ts)
            anomalies.append(
                AnomalyPoint(
                    timestamp=tstr,
                    value=float(vals[i]),
                    score=float(dev),
                    reason=f"Rolling deviation {dev:.2f} (window={w}) exceeds {z_threshold}",
                )
            )
    return anomalies
