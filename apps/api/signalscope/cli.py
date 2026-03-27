"""
Typer CLI mirroring core backend flows.

Examples:
  signalscope analyze data/sample_stable.csv
  signalscope analyze data/sample_drift.csv --window-size 100 --save
  signalscope summary <analysis_id>
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Literal, Optional, cast

import typer

from signalscope.config import settings
from signalscope.schemas.models import AnalysisConfig
from signalscope.services.parsing import ParseError, validate_and_load_csv
from signalscope.services.pipeline import run_analysis
from signalscope.services.storage import AnalysisStorage

app = typer.Typer(help="SignalScope — time-series CSV analysis from the terminal.")


@app.command("analyze")
def analyze_cmd(
    csv_path: Path = typer.Argument(..., exists=True, readable=True, help="Path to CSV file."),
    window_size: int = typer.Option(100, "--window-size", "-w", help="Segment window size (points)."),
    segmentation: bool = typer.Option(True, "--segmentation/--no-segmentation"),
    anomaly_method: str = typer.Option("zscore", "--anomaly-method", help="zscore or rolling."),
    z_threshold: float = typer.Option(3.0, "--z-threshold"),
    rolling_window: int = typer.Option(20, "--rolling-window"),
    save: bool = typer.Option(False, "--save", help="Persist result to local SQLite store."),
    json_out: Optional[Path] = typer.Option(None, "--json-out", help="Write full analysis JSON to file."),
) -> None:
    """Validate CSV, run metrics/anomalies/insights, print a readable summary."""
    if anomaly_method not in ("zscore", "rolling"):
        typer.echo("anomaly_method must be zscore or rolling", err=True)
        raise typer.Exit(code=1)

    try:
        df, _ = validate_and_load_csv(csv_path)
    except ParseError as e:
        typer.echo(f"Validation error: {e.message}", err=True)
        raise typer.Exit(code=1) from e

    method: Literal["zscore", "rolling"] = cast(Literal["zscore", "rolling"], anomaly_method)
    cfg = AnalysisConfig(
        window_size=window_size,
        segmentation_enabled=segmentation,
        anomaly_method=method,
        z_threshold=z_threshold,
        rolling_window=rolling_window,
    )
    detail = run_analysis(df, filename=csv_path.name, config=cfg)

    typer.echo(f"Analysis ID: {detail.analysis_id}")
    typer.echo(f"Points: {len(detail.points)}  Anomalies: {detail.anomaly_count}")
    gm = detail.global_metrics
    typer.echo(
        f"Global - mean: {gm.mean:.4f}  std: {gm.std:.4f}  slope: {gm.trend_slope:.6f}  "
        f"asymmetry: {gm.asymmetry_score:.4f}  drift: {gm.drift_score:.4f}",
    )
    if detail.segments:
        typer.echo(f"Segments: {len(detail.segments)} (window={window_size})")
        for s in detail.segments[:5]:
            typer.echo(
                f"  #{s.segment_index}: mean={s.mean:.4f} std={s.std:.4f} "
                f"asym={s.asymmetry_score:.3f} drift={s.drift_score:.3f}",
            )
        if len(detail.segments) > 5:
            typer.echo(f"  ... ({len(detail.segments) - 5} more)")

    typer.echo("Insights:")
    for ins in detail.insights:
        typer.echo(f"  - [{ins.severity}] {ins.text}")

    if json_out:
        json_out.write_text(detail.model_dump_json(indent=2), encoding="utf-8")
        typer.echo(f"Wrote JSON: {json_out}")

    if save:
        storage = AnalysisStorage(settings.resolved_db_path())
        storage.save_analysis(detail)
        typer.echo("Saved to local analysis store.")


@app.command("summary")
def summary_cmd(
    analysis_id: str = typer.Argument(..., help="Analysis UUID from a prior run."),
) -> None:
    """Print stored summary for a saved analysis."""
    storage = AnalysisStorage(settings.resolved_db_path())
    s = storage.get_summary(analysis_id)
    if s is None:
        typer.echo("Analysis not found.", err=True)
        raise typer.Exit(code=1)
    typer.echo(json.dumps(s.model_dump(mode="json"), indent=2, default=str))


def main() -> None:
    app()


if __name__ == "__main__":
    main()
