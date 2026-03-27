export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="page-title">About SignalScope</h1>
        <p className="page-subtitle">
          SignalScope is a focused developer tool for inspecting CSV time series across telemetry, cloud
          metrics, sensors, finance, and research traces.
        </p>
      </div>

      <section className="panel">
        <p className="kicker">Tooling intent</p>
        <p className="mt-2 text-sm leading-6 text-ink-muted">
          The product emphasizes transparent analysis over opaque scoring. Fixed-window segmentation and
          deterministic rules help engineers debug behavior shifts quickly and communicate findings
          consistently.
        </p>
      </section>

      <section className="panel">
        <p className="kicker">Metrics model</p>
        <p className="mt-2 text-sm leading-6 text-ink-muted">
          Mean, standard deviation, extrema, peak count, and trend slope are standard summaries.
          <span className="font-medium text-ink"> Asymmetry </span>
          and
          <span className="font-medium text-ink"> drift </span>
          are intentionally heuristic metrics for window-to-window comparison and operational diagnostics.
        </p>
      </section>

      <section className="panel">
        <p className="kicker">Privacy</p>
        <p className="mt-2 text-sm leading-6 text-ink-muted">
          By default, uploads and analysis history remain local in SQLite and filesystem storage. For
          multi-user deployment, place the API behind authenticated infrastructure and controlled storage.
        </p>
      </section>
    </div>
  );
}
