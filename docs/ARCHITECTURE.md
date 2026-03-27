# SignalScope architecture

## Backend

- **`signalscope.main`**: FastAPI app, CORS, `/api` router.
- **`routers/api.py`**: Upload (multipart), analyze, history, detail, summary.
- **`services/parsing.py`**: CSV schema validation; tolerant column aliases.
- **`services/segmentation.py`**: Fixed-size windows in row order (sorted timestamps).
- **`services/metrics.py`**: Global and per-segment statistics; heuristic asymmetry/drift.
- **`services/anomaly.py`**: Z-score vs global stats, or rolling mean/std deviation.
- **`services/summaries.py`**: Rule-based insight strings (future: pluggable AI summarizer).
- **`services/pipeline.py`**: Orchestrates end-to-end analysis result.
- **`services/storage.py`**: SQLite persistence of JSON payloads for summaries and full detail.

## Frontend

- **Next.js App Router** with server components for dashboard/history/analysis list data fetching.
- **Client components** for upload flow and Plotly (`react-plotly.js` loaded with `dynamic(..., { ssr: false })`).
- **`src/lib/api.ts`**: Typed fetch helpers against `NEXT_PUBLIC_API_URL`.

## CLI

- **`signalscope.cli`**: Typer entry point calling the same parsing, pipeline, and storage layers as the API.
