"""
Fixed-window segmentation over ordered time series.

Windows are contiguous in row order (already sorted by timestamp upstream).
"""

from __future__ import annotations

import pandas as pd


def split_fixed_windows(df: pd.DataFrame, window_size: int) -> list[pd.DataFrame]:
    """
    Split `df` into chunks of length `window_size` (last chunk may be shorter).

    Args:
        df: Must include columns timestamp, value.
        window_size: Number of points per segment (>=2 enforced at API layer).
    """
    if len(df) == 0:
        return []
    chunks: list[pd.DataFrame] = []
    i = 0
    n = len(df)
    while i < n:
        chunks.append(df.iloc[i : i + window_size].copy())
        i += window_size
    return chunks


def segment_start_timestamps(chunks: list[pd.DataFrame]) -> list[str]:
    """First timestamp in each chunk as ISO strings for chart boundaries."""
    out: list[str] = []
    for ch in chunks:
        if ch.empty:
            continue
        ts = ch.iloc[0]["timestamp"]
        out.append(ts.isoformat() if hasattr(ts, "isoformat") else str(ts))
    return out
