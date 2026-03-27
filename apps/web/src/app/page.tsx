import Link from "next/link";

import { getHistory } from "@/lib/api";

async function loadHistory() {
  try {
    return await getHistory(8);
  } catch {
    return [];
  }
}

export default async function DashboardPage() {
  const history = await loadHistory();

  return (
    <div className="page-shell">
      <section className="panel p-8">
        <p className="kicker">SignalScope Dashboard</p>
        <h1 className="mt-2 max-w-3xl text-3xl font-semibold">
          Inspect time-series behavior with segmentation, anomaly detection, and signal-quality insights.
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-ink-muted">
          Upload CSV telemetry, metrics, or research traces. Configure fixed windows, review per-segment
          engineering metrics, and scan for outliers with transparent heuristics designed for developer
          workflows.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/upload" className="btn-primary">
            Upload CSV
          </Link>
          <Link href="/history" className="btn-secondary">
            View history
          </Link>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 className="text-sm font-semibold text-ink">Recent analyses</h2>
          <Link href="/history" className="text-xs text-ink-muted no-underline hover:text-ink">
            All runs
          </Link>
        </div>
        {history.length === 0 ? (
          <div className="rounded-lg border border-dashed border-surface-border bg-surface-muted/60 p-8 text-sm text-ink-muted">
            No saved runs yet. Start with an upload — the API persists analyses locally in SQLite.
          </div>
        ) : (
          <ul className="divide-y divide-surface-border rounded-xl border border-surface-border bg-surface-panel">
            {history.map((h) => (
              <li
                key={h.analysis_id}
                className="flex flex-col gap-1 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <Link href={`/analysis/${h.analysis_id}`} className="font-medium text-ink">
                    {h.filename}
                  </Link>
                  <p className="text-xs text-ink-faint">
                    {new Date(h.created_at).toLocaleString()} · {h.anomaly_count} anomalies
                  </p>
                </div>
                <div className="text-right text-xs text-ink-muted">
                  <span className="font-mono">μ={h.global_metrics.mean.toFixed(3)}</span>
                  <span className="mx-2 text-surface-border">|</span>
                  <span className="font-mono">σ={h.global_metrics.std.toFixed(3)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
