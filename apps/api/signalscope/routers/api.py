"""REST API: upload, analyze, history, detail, summary."""

from __future__ import annotations

import json
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from signalscope.config import settings
from signalscope.schemas.models import (
    AnalysisDetailResponse,
    AnalysisSummaryResponse,
    AnalyzeRequest,
    HistoryItem,
    UploadResponse,
)
from signalscope.services.parsing import (
    SAMPLE_FORMAT,
    ParseError,
    dataframe_to_points,
    new_upload_id,
    safe_filename,
    validate_and_load_csv,
)
from signalscope.services.pipeline import run_analysis
from signalscope.services.storage import AnalysisStorage

router = APIRouter()


def get_storage() -> AnalysisStorage:
    return AnalysisStorage(settings.resolved_db_path())


@router.post("/upload", response_model=UploadResponse)
async def upload_csv(
    file: UploadFile = File(...),
    storage: AnalysisStorage = Depends(get_storage),
) -> UploadResponse:
    """Accept a CSV upload, validate schema, persist to disk, return `upload_id`."""
    _ = storage  # storage warms DB; uploads are file-based
    raw_name = file.filename or "upload.csv"
    name = safe_filename(raw_name)
    uid = new_upload_id()
    upload_dir = settings.upload_dir()
    dest = upload_dir / f"{uid}.csv"
    content = await file.read()
    dest.write_bytes(content)
    meta_path = upload_dir / f"{uid}.meta.json"
    meta_path.write_text(json.dumps({"original_filename": name}), encoding="utf-8")

    try:
        df, detected = validate_and_load_csv(dest)
    except ParseError as e:
        dest.unlink(missing_ok=True)
        raise HTTPException(status_code=400, detail=e.message) from e

    preview = dataframe_to_points(df.head(20))
    return UploadResponse(
        upload_id=uid,
        filename=name,
        row_count=len(df),
        columns_detected=detected,
        preview=preview,
        sample_format_markdown=SAMPLE_FORMAT,
    )


def _upload_path(upload_id: str) -> Path:
    p = settings.upload_dir() / f"{upload_id}.csv"
    if not p.exists():
        raise HTTPException(status_code=404, detail="Unknown upload_id or file expired.")
    return p


def _original_filename(upload_id: str, path: Path) -> str:
    meta = settings.upload_dir() / f"{upload_id}.meta.json"
    if meta.exists():
        try:
            data = json.loads(meta.read_text(encoding="utf-8"))
            return str(data.get("original_filename") or path.name)
        except (json.JSONDecodeError, OSError):
            pass
    return path.name


@router.post("/analyze", response_model=AnalysisDetailResponse)
def analyze(
    body: AnalyzeRequest,
    storage: AnalysisStorage = Depends(get_storage),
) -> AnalysisDetailResponse:
    path = _upload_path(body.upload_id)
    try:
        df, _ = validate_and_load_csv(path)
    except ParseError as e:
        raise HTTPException(status_code=400, detail=e.message) from e

    display_name = _original_filename(body.upload_id, path)
    detail = run_analysis(df, filename=display_name, config=body.config)
    storage.save_analysis(detail)
    return detail


@router.get("/analysis/{analysis_id}", response_model=AnalysisDetailResponse)
def get_analysis(
    analysis_id: str,
    storage: AnalysisStorage = Depends(get_storage),
) -> AnalysisDetailResponse:
    d = storage.get_detail(analysis_id)
    if d is None:
        raise HTTPException(status_code=404, detail="Analysis not found.")
    return d


@router.get("/analysis/{analysis_id}/summary", response_model=AnalysisSummaryResponse)
def get_analysis_summary(
    analysis_id: str,
    storage: AnalysisStorage = Depends(get_storage),
) -> AnalysisSummaryResponse:
    s = storage.get_summary(analysis_id)
    if s is None:
        raise HTTPException(status_code=404, detail="Analysis not found.")
    return s


@router.get("/history", response_model=list[HistoryItem])
def history(
    limit: int = 100,
    storage: AnalysisStorage = Depends(get_storage),
) -> list[HistoryItem]:
    return storage.list_history(limit=min(limit, 500))
