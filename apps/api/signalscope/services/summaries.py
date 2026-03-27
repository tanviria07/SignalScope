"""
Rule-based plain-English insights.

Structured so a future `AISummaryProvider` could replace or augment `generate_insights`
without changing API contracts.
"""

from __future__ import annotations

from typing import Protocol

from signalscope.schemas.models import AnalysisConfig, InsightItem, SegmentMetrics


class InsightProvider(Protocol):
    """Future hook: swap rule-based insights for an LLM-backed implementation."""

    def insights(
        self,
        segments: list[SegmentMetrics],
        anomaly_timestamps: list[str],
        config: AnalysisConfig,
    ) -> list[InsightItem]: ...


def generate_insights(
    segments: list[SegmentMetrics],
    anomaly_timestamps: list[str],
    config: AnalysisConfig,
) -> list[InsightItem]:
    """
    Produce deterministic observations from segment metrics and anomaly times.

    Extend `InsightProvider` protocol (future) for LLM-backed summaries.
    """
    insights: list[InsightItem] = []

    if not segments:
        return [InsightItem(text="No segments computed (empty series or segmentation off).", severity="notice")]

    # Variance trend across segments
    stds = [s.std for s in segments]
    if len(stds) >= 3:
        early = sum(stds[: len(stds) // 2]) / max(1, len(stds) // 2)
        late = sum(stds[len(stds) // 2 :]) / max(1, len(stds) - len(stds) // 2)
        if late > early * 1.25:
            insights.append(
                InsightItem(
                    text="Signal variance increases in later segments compared to earlier ones.",
                    severity="info",
                )
            )
        elif early > late * 1.25:
            insights.append(
                InsightItem(
                    text="Signal variance is higher in earlier segments than in later ones.",
                    severity="info",
                )
            )

    # Asymmetry outliers vs baseline (median asymmetry)
    asyms = [abs(s.asymmetry_score) for s in segments]
    if len(asyms) >= 2:
        baseline = sorted(asyms)[len(asyms) // 2]
        for seg in segments:
            if abs(seg.asymmetry_score) > baseline * 1.5 and abs(seg.asymmetry_score) > 0.2:
                insights.append(
                    InsightItem(
                        text=(
                            f"Segment {seg.segment_index} shows elevated asymmetry "
                            f"({seg.asymmetry_score:.3f}) compared to the baseline window."
                        ),
                        severity="warning",
                    )
                )
                break

    # Drift
    drifts = [s.drift_score for s in segments]
    if drifts:
        j = max(range(len(drifts)), key=lambda i: drifts[i])
        if drifts[j] > 1.0:
            insights.append(
                InsightItem(
                    text=(
                        f"Segment {segments[j].segment_index} shows strong within-window drift "
                        f"(score {drifts[j]:.2f}), suggesting a level shift or trend inside that window."
                    ),
                    severity="info",
                )
            )

    # Anomaly clusters
    if len(anomaly_timestamps) >= 3:
        insights.append(
            InsightItem(
                text=(
                    f"A cluster of {len(anomaly_timestamps)} anomalies was detected; "
                    f"first at {anomaly_timestamps[0]}."
                ),
                severity="warning",
            )
        )
    elif len(anomaly_timestamps) == 1:
        insights.append(
            InsightItem(
                text=f"One anomaly at {anomaly_timestamps[0]}.",
                severity="notice",
            )
        )

    if not insights:
        insights.append(
            InsightItem(
                text=(
                    "No strong rule-based patterns detected; series looks relatively consistent "
                    "under the current settings."
                ),
                severity="info",
            )
        )

    insights.append(
        InsightItem(
            text=f"Analysis used window size {config.window_size} points and {config.anomaly_method} detection.",
            severity="info",
        )
    )

    return insights
