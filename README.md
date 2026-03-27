# SignalScope

SignalScope is a monorepo developer tool for inspecting CSV time series: upload and validate data, visualize signals with Plotly (zoom/pan), run fixed-window segmentation, compute engineering metrics (including heuristic asymmetry and drift scores), detect anomalies (z-score or rolling deviation), and review rule-based insights. Analyses are persisted locally (SQLite) for history and reopen.

## Monorepo layout

```
EBS/
├── apps/
│   ├── api/                 # FastAPI + Pydantic + services + Typer CLI
│   └── web/                 # Next.js (App Router) + TypeScript + Tailwind + Plotly
├── data/                    # Sample CSVs (generated) + local DB/uploads at runtime
├── docs/                    # Architecture notes
├── scripts/                 # Helper scripts (sample data generation)
├── .env.example
└── README.md
```

## Prerequisites

- **Python** 3.11+
- **Node.js** 20+ (for Next.js)

## Backend (FastAPI)

```bash
cd apps/api
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -e .
```

Run the API (default: `http://127.0.0.1:8000`):

```bash
uvicorn signalscope.main:app --reload --host 127.0.0.1 --port 8000
```

### API (selected)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/upload` | Multipart CSV upload; validates schema; returns `upload_id` |
| `POST` | `/api/analyze` | Body: `upload_id` + `config`; runs pipeline; persists analysis |
| `GET` | `/api/analysis/{analysis_id}` | Full detail (points, segments, anomalies, insights) |
| `GET` | `/api/analysis/{analysis_id}/summary` | Compact summary |
| `GET` | `/api/history` | Recent runs |
| `GET` | `/health` | Liveness |

Optional environment variables (see `.env.example`): `SIGNALSCOPE_DATA_DIR`, `SIGNALSCOPE_DB_PATH`, `SIGNALSCOPE_CORS_ORIGINS`.

## CLI (Typer)

After `pip install -e .` from `apps/api`:

```bash
signalscope analyze ../../data/sample_stable.csv --window-size 100
signalscope analyze ../../data/sample_drift_asymmetry.csv --window-size 50 --save
signalscope summary <analysis_id>
```

Use `--json-out path.json` to write full analysis JSON. `--save` stores the run in the same SQLite DB as the API (default path under `data/`).

## Frontend (Next.js)

```bash
cd apps/web
npm install
```

Create `apps/web/.env.local` (or copy from repo `.env.example`):

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

```bash
npm run dev
```

Open `http://localhost:3000`. Pages: **Dashboard**, **Upload**, **History**, **Analysis detail** (`/analysis/[id]`), **About**.

## Sample data

Regenerate demo CSVs:

```bash
python scripts/generate_samples.py
```

- `data/sample_stable.csv` — mostly stable series with a few injected spikes.
- `data/sample_drift_asymmetry.csv` — drift, widening noise, and mild asymmetry over time.

## Design notes

- **Asymmetry / drift**: Implemented as documented heuristics in `apps/api/signalscope/services/metrics.py` (not formal scientific standards).
- **Insights**: Rule-based in `services/summaries.py`; structured so an LLM provider can be swapped in later without changing HTTP schemas.
- **Storage**: SQLite file (default `data/.signalscope.db`) plus uploaded CSVs under `data/uploads/`.

## Production pointers

- Put the API behind HTTPS and authentication if exposed beyond localhost.
- Tune anomaly thresholds per domain; defaults are conservative developer-tool settings.
- For Plotly bundle size, consider dynamic routes only on analysis pages (already using dynamic import for the chart).
