"""SQLite persistence for analysis runs (local dev / single-node)."""

from __future__ import annotations

import json
import sqlite3
import uuid
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterator

from signalscope.schemas.models import (
    AnalysisConfig,
    AnalysisDetailResponse,
    AnalysisSummaryResponse,
    GlobalMetrics,
    HistoryItem,
    InsightItem,
)


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


class AnalysisStorage:
    """File-backed SQLite store for analysis metadata and serialized payloads."""

    def __init__(self, db_path: Path) -> None:
        self.db_path = db_path
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_db()

    @contextmanager
    def _conn(self) -> Iterator[sqlite3.Connection]:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
            conn.commit()
        finally:
            conn.close()

    def _init_db(self) -> None:
        with self._conn() as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS analyses (
                    analysis_id TEXT PRIMARY KEY,
                    filename TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    config_json TEXT NOT NULL,
                    summary_metrics_json TEXT NOT NULL,
                    detail_json TEXT NOT NULL
                )
                """
            )

    def save_analysis(self, detail: AnalysisDetailResponse) -> None:
        summary = AnalysisSummaryResponse(
            analysis_id=detail.analysis_id,
            filename=detail.filename,
            created_at=detail.created_at,
            config=detail.config,
            global_metrics=detail.global_metrics,
            anomaly_count=detail.anomaly_count,
            insights=detail.insights,
        )
        with self._conn() as conn:
            conn.execute(
                """
                INSERT OR REPLACE INTO analyses
                (analysis_id, filename, created_at, config_json, summary_metrics_json, detail_json)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    detail.analysis_id,
                    detail.filename,
                    detail.created_at.isoformat(),
                    detail.config.model_dump_json(),
                    summary.model_dump_json(),
                    detail.model_dump_json(),
                ),
            )

    def get_detail(self, analysis_id: str) -> AnalysisDetailResponse | None:
        with self._conn() as conn:
            row = conn.execute(
                "SELECT detail_json FROM analyses WHERE analysis_id = ?",
                (analysis_id,),
            ).fetchone()
        if row is None:
            return None
        return AnalysisDetailResponse.model_validate_json(row["detail_json"])

    def get_summary(self, analysis_id: str) -> AnalysisSummaryResponse | None:
        with self._conn() as conn:
            row = conn.execute(
                "SELECT summary_metrics_json FROM analyses WHERE analysis_id = ?",
                (analysis_id,),
            ).fetchone()
        if row is None:
            return None
        return AnalysisSummaryResponse.model_validate_json(row["summary_metrics_json"])

    def list_history(self, limit: int = 100) -> list[HistoryItem]:
        with self._conn() as conn:
            rows = conn.execute(
                """
                SELECT analysis_id, filename, created_at, config_json, summary_metrics_json
                FROM analyses
                ORDER BY datetime(created_at) DESC
                LIMIT ?
                """,
                (limit,),
            ).fetchall()
        out: list[HistoryItem] = []
        for r in rows:
            cfg = AnalysisConfig.model_validate_json(r["config_json"])
            sm = json.loads(r["summary_metrics_json"])
            gm = GlobalMetrics.model_validate(sm["global_metrics"])
            out.append(
                HistoryItem(
                    analysis_id=r["analysis_id"],
                    filename=r["filename"],
                    created_at=datetime.fromisoformat(r["created_at"]),
                    config=cfg,
                    global_metrics=gm,
                    anomaly_count=int(sm["anomaly_count"]),
                )
            )
        return out


def new_analysis_id() -> str:
    return str(uuid.uuid4())


def dump_json(obj: Any) -> str:
    return json.dumps(obj, indent=2, default=str)
