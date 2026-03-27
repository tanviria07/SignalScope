export default function AboutPage() {
  return (
    <div className="prose prose-sm max-w-2xl text-ink">
      <h1 className="text-2xl font-semibold tracking-tight">About SignalScope</h1>
      <p className="mt-4 text-sm leading-relaxed text-ink-muted">
        SignalScope is a focused developer tool for inspecting CSV time series: telemetry, cloud metrics,
        sensors, finance, or lab traces. It combines fixed-window segmentation, transparent engineering
        metrics, and lightweight anomaly highlighting so you can move from raw file to narrative insight
        without leaving your browser.
      </p>
      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-ink-faint">Metrics</h2>
      <p className="mt-2 text-sm leading-relaxed text-ink-muted">
        Mean, standard deviation, extrema, local peak count, and least-squares slope are standard.{" "}
        <strong className="text-ink">Asymmetry</strong> and <strong className="text-ink">drift</strong> scores
        are heuristic window summaries (documented in the API code) — useful for comparing segments, not
        certified metrology.
      </p>
      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-ink-faint">Privacy</h2>
      <p className="mt-2 text-sm leading-relaxed text-ink-muted">
        By default the stack keeps uploads and SQLite on your machine. Point production deployments at
        controlled storage if you extend this beyond local development.
      </p>
    </div>
  );
}
