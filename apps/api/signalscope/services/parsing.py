"""
CSV parsing and schema validation for SignalScope uploads.

Expected columns (case-insensitive header match):
  - timestamp (required)
  - value (required)
  - series_id (optional)
  - label (optional)
"""

from __future__ import annotations

import re
import uuid
from pathlib import Path

import pandas as pd

from signalscope.schemas.models import PointRow

REQUIRED_ALIASES = {
    "timestamp": ["timestamp", "time", "ts", "datetime", "date"],
    "value": ["value", "val", "y", "signal", "measurement"],
}
OPTIONAL_ALIASES = {
    "series_id": ["series_id", "series", "id", "seriesid"],
    "label": ["label", "tag", "category"],
}


def _normalize_columns(cols: list[str]) -> dict[str, str]:
    """Map normalized lowercase stripped names to original column names."""
    return {c.strip().lower(): c for c in cols}


def _resolve_field(norm: dict[str, str], aliases: list[str]) -> str | None:
    for a in aliases:
        if a in norm:
            return norm[a]
    return None


class ParseError(Exception):
    """User-facing validation error."""

    def __init__(self, message: str) -> None:
        self.message = message
        super().__init__(message)


SAMPLE_FORMAT = """```csv
timestamp,value
2024-01-01T00:00:00Z,1.02
2024-01-01T00:01:00Z,1.05
2024-01-01T00:02:00Z,0.98
```

Optional columns: `series_id`, `label`  
Timestamps may be ISO-8601 strings or parseable date/time values."""


def validate_and_load_csv(path: Path) -> tuple[pd.DataFrame, list[str]]:
    """
    Read CSV from disk, validate schema, return a normalized DataFrame and detected columns.

    Raises:
        ParseError: on missing columns, empty files, or non-numeric values.
    """
    if not path.exists():
        raise ParseError(f"File not found: {path}")

    try:
        df = pd.read_csv(path)
    except Exception as exc:  # noqa: BLE001 — surface as validation
        raise ParseError(f"Could not read CSV: {exc}") from exc

    if df.empty:
        raise ParseError("CSV has no rows.")

    norm = _normalize_columns(list(df.columns))

    ts_col = _resolve_field(norm, REQUIRED_ALIASES["timestamp"])
    val_col = _resolve_field(norm, REQUIRED_ALIASES["value"])
    missing = []
    if ts_col is None:
        missing.append("timestamp (or time/ts/datetime)")
    if val_col is None:
        missing.append("value (or val/y/signal)")
    if missing:
        raise ParseError(
            "Missing required column(s): " + ", ".join(missing) + ". "
            "Headers are matched case-insensitively.",
        )

    sid_col = _resolve_field(norm, OPTIONAL_ALIASES["series_id"])
    lbl_col = _resolve_field(norm, OPTIONAL_ALIASES["label"])

    out = pd.DataFrame(
        {
            "timestamp": pd.to_datetime(df[ts_col], utc=True, errors="coerce"),
            "value": pd.to_numeric(df[val_col], errors="coerce"),
        }
    )

    if sid_col:
        out["series_id"] = df[sid_col].astype(str)
    else:
        out["series_id"] = None
    if lbl_col:
        out["label"] = df[lbl_col].astype(str)
    else:
        out["label"] = None

    bad_ts = out["timestamp"].isna()
    bad_val = out["value"].isna()
    if bad_ts.any() or bad_val.any():
        bad_rows = (bad_ts | bad_val).sum()
        raise ParseError(
            f"{bad_rows} row(s) have invalid timestamp or non-numeric value. "
            "Check data types and formats.",
        )

    out = out.sort_values("timestamp").reset_index(drop=True)

    detected = ["timestamp", "value"]
    if sid_col:
        detected.append("series_id")
    if lbl_col:
        detected.append("label")

    return out, detected


def dataframe_to_points(df: pd.DataFrame) -> list[PointRow]:
    rows: list[PointRow] = []
    for _, r in df.iterrows():
        ts = r["timestamp"]
        if hasattr(ts, "isoformat"):
            tstr = ts.isoformat()
        else:
            tstr = str(ts)
        rows.append(
            PointRow(
                timestamp=tstr,
                value=float(r["value"]),
                series_id=r["series_id"] if pd.notna(r.get("series_id")) else None,
                label=r["label"] if pd.notna(r.get("label")) else None,
            )
        )
    return rows


def new_upload_id() -> str:
    return str(uuid.uuid4())


def safe_filename(name: str) -> str:
    base = Path(name).name
    base = re.sub(r"[^A-Za-z0-9._-]+", "_", base)
    return base or "upload.csv"
