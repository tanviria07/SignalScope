import Link from "next/link";

import { getHistory } from "@/lib/api";

async function load() {
  try {
    return await getHistory(100);
  } catch {
    return [];
  }
}

export default async function HistoryPage() {
  const items = await load();

  return (
    <div className="page-shell">
      <div>
        <h1 className="page-title">History</h1>
        <p className="page-subtitle">
          Analyses are stored locally by the API (SQLite). Reopen any run to inspect charts and tables.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-surface-border bg-surface-muted/60 p-8 text-sm text-ink-muted">
          No analyses yet.{" "}
          <Link href="/upload" className="text-accent-dim">
            Upload a CSV
          </Link>{" "}
          to create one.
        </div>
      ) : (
        <ul className="divide-y divide-surface-border rounded-xl border border-surface-border bg-surface-panel">
          {items.map((h) => (
            <li
              key={h.analysis_id}
              className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <Link href={`/analysis/${h.analysis_id}`} className="font-medium text-ink">
                  {h.filename}
                </Link>
                <p className="text-xs text-ink-faint">{new Date(h.created_at).toLocaleString()}</p>
                <p className="mt-1 font-mono text-xs text-ink-muted">{h.analysis_id}</p>
              </div>
              <div className="text-right text-sm text-ink-muted">
                <div>{h.anomaly_count} anomalies</div>
                <div className="font-mono text-xs">
                  w={h.config.window_size} · {h.config.anomaly_method}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
