import Link from "next/link";
import { notFound } from "next/navigation";

import { SignalChart } from "@/components/SignalChart";
import { getAnalysis } from "@/lib/api";

type Props = { params: { id: string } };

export default async function AnalysisDetailPage({ params }: Props) {
  let data;
  try {
    data = await getAnalysis(params.id);
  } catch {
    notFound();
  }

  return (
    <div className="page-shell">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="kicker font-mono normal-case tracking-normal">{data.analysis_id}</p>
          <h1 className="page-title">{data.filename}</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {new Date(data.created_at).toLocaleString()} · {data.points.length} points ·{" "}
            {data.anomaly_count} anomalies
          </p>
        </div>
        <Link
          href="/history"
          className="text-sm text-ink-muted no-underline hover:text-ink"
        >
          Back to history
        </Link>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold">Signal</h2>
        <p className="mb-3 text-xs text-ink-muted">
          Drag to pan; scroll or toolbar to zoom. Teal dotted lines mark segment starts when segmentation is
          on. Red markers highlight detected anomalies.
        </p>
        <SignalChart analysis={data} />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="panel">
          <h3 className="text-sm font-semibold text-ink">Global metrics</h3>
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <Metric label="Mean" value={data.global_metrics.mean.toFixed(4)} />
            <Metric label="Std" value={data.global_metrics.std.toFixed(4)} />
            <Metric label="Min" value={data.global_metrics.min.toFixed(4)} />
            <Metric label="Max" value={data.global_metrics.max.toFixed(4)} />
            <Metric label="Trend slope" value={data.global_metrics.trend_slope.toExponential(4)} />
            <Metric label="Local peaks" value={String(data.global_metrics.local_peak_count)} />
            <Metric label="Asymmetry" value={data.global_metrics.asymmetry_score.toFixed(4)} />
            <Metric label="Drift" value={data.global_metrics.drift_score.toFixed(4)} />
          </dl>
        </div>
        <div className="panel">
          <h3 className="text-sm font-semibold text-ink">Configuration</h3>
          <ul className="mt-3 space-y-1 text-sm text-ink-muted">
            <li>Window size: {data.config.window_size}</li>
            <li>Segmentation: {data.config.segmentation_enabled ? "on" : "off"}</li>
            <li>Anomaly: {data.config.anomaly_method}</li>
            <li>Threshold: {data.config.z_threshold}</li>
            <li>Rolling window: {data.config.rolling_window}</li>
          </ul>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold">Insights</h2>
        <ul className="space-y-2">
          {data.insights.map((i, idx) => (
            <li
              key={idx}
              className="rounded-lg border border-surface-border bg-surface-muted/55 px-3.5 py-2.5 text-sm text-ink-muted"
            >
              <span className="mr-2 font-mono text-xs uppercase text-ink-faint">{i.severity}</span>
              {i.text}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold">Anomalies</h2>
        {data.anomalies.length === 0 ? (
          <p className="text-sm text-ink-muted">None detected under current settings.</p>
        ) : (
          <div className="table-shell">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-surface-border bg-surface-muted/60 text-xs uppercase text-ink-faint">
                <tr>
                  <th className="px-3 py-2">Timestamp</th>
                  <th className="px-3 py-2">Value</th>
                  <th className="px-3 py-2">Score</th>
                  <th className="px-3 py-2">Reason</th>
                </tr>
              </thead>
              <tbody>
                {data.anomalies.map((a) => (
                  <tr key={a.timestamp + String(a.value)} className="border-b border-surface-border">
                    <td className="px-3 py-2 font-mono text-xs">{a.timestamp}</td>
                    <td className="px-3 py-2 font-mono">{a.value.toFixed(4)}</td>
                    <td className="px-3 py-2 font-mono">{a.score.toFixed(3)}</td>
                    <td className="px-3 py-2 text-ink-muted">{a.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold">Segment comparison</h2>
        {data.segments.length === 0 ? (
          <p className="text-sm text-ink-muted">No segments (disabled or insufficient points).</p>
        ) : (
          <div className="table-shell">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-surface-border bg-surface-muted/60 text-xs uppercase text-ink-faint">
                <tr>
                  <th className="px-3 py-2">#</th>
                  <th className="px-3 py-2">Points</th>
                  <th className="px-3 py-2">Mean</th>
                  <th className="px-3 py-2">Std</th>
                  <th className="px-3 py-2">Slope</th>
                  <th className="px-3 py-2">Peaks</th>
                  <th className="px-3 py-2">Asymmetry</th>
                  <th className="px-3 py-2">Drift</th>
                </tr>
              </thead>
              <tbody>
                {data.segments.map((s) => (
                  <tr key={s.segment_index} className="border-b border-surface-border">
                    <td className="px-3 py-2 font-mono">{s.segment_index}</td>
                    <td className="px-3 py-2">{s.point_count}</td>
                    <td className="px-3 py-2 font-mono">{s.mean.toFixed(4)}</td>
                    <td className="px-3 py-2 font-mono">{s.std.toFixed(4)}</td>
                    <td className="px-3 py-2 font-mono">{s.trend_slope.toExponential(3)}</td>
                    <td className="px-3 py-2">{s.local_peak_count}</td>
                    <td className="px-3 py-2 font-mono">{s.asymmetry_score.toFixed(3)}</td>
                    <td className="px-3 py-2 font-mono">{s.drift_score.toFixed(3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-ink-faint">{label}</dt>
      <dd className="font-mono text-ink">{value}</dd>
    </>
  );
}
