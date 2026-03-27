"use client";

import dynamic from "next/dynamic";
import type { Data, Layout } from "plotly.js";
import { useMemo } from "react";

import type { AnalysisDetail } from "@/lib/api";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

type Props = {
  analysis: AnalysisDetail;
  height?: number;
};

export function SignalChart({ analysis, height = 420 }: Props) {
  const { data, layout } = useMemo(() => {
    const xs = analysis.points.map((p) => p.timestamp);
    const ys = analysis.points.map((p) => p.value);

    const anomalySet = new Set(analysis.anomalies.map((a) => a.timestamp));
    const ax: string[] = [];
    const ay: number[] = [];
    analysis.points.forEach((p) => {
      if (anomalySet.has(p.timestamp)) {
        ax.push(p.timestamp);
        ay.push(p.value);
      }
    });

    const shapes =
      analysis.config.segmentation_enabled && analysis.segment_boundaries.length > 0
        ? analysis.segment_boundaries.map((t) => ({
            type: "line" as const,
            x0: t,
            x1: t,
            y0: 0,
            y1: 1,
            yref: "paper" as const,
            line: { color: "rgba(13,148,136,0.35)", width: 1, dash: "dot" as const },
          }))
        : [];

    const traces: Data[] = [
      {
        type: "scatter",
        mode: "lines",
        x: xs,
        y: ys,
        name: "Signal",
        line: { color: "#1c1917", width: 1.2 },
      },
    ];

    if (ax.length > 0) {
      traces.push({
        type: "scatter",
        mode: "markers",
        x: ax,
        y: ay,
        name: "Anomalies",
        marker: { color: "#b91c1c", size: 8, line: { width: 0 } },
      });
    }

    const lay: Partial<Layout> = {
      margin: { l: 56, r: 20, t: 36, b: 52 },
      paper_bgcolor: "#ffffff",
      plot_bgcolor: "#ffffff",
      font: { family: "var(--font-geist-sans), ui-sans-serif, system-ui", color: "#374151", size: 12 },
      xaxis: {
        title: "Time",
        showgrid: true,
        gridcolor: "#eef1f5",
        linecolor: "#d8dee8",
        mirror: true,
        zeroline: false,
      },
      yaxis: {
        title: "Value",
        showgrid: true,
        gridcolor: "#eef1f5",
        linecolor: "#d8dee8",
        mirror: true,
        zeroline: false,
      },
      hovermode: "x unified",
      showlegend: true,
      legend: {
        orientation: "h",
        y: 1.14,
        x: 0,
        bgcolor: "rgba(255,255,255,0.85)",
        bordercolor: "#e3e7ee",
        borderwidth: 1,
      },
      shapes,
      height,
    };

    return { data: traces, layout: lay };
  }, [analysis, height]);

  return (
    <div className="w-full overflow-hidden rounded-xl border border-surface-border bg-surface-panel shadow-panel">
      <Plot
        data={data}
        layout={layout}
        config={{
          responsive: true,
          scrollZoom: true,
          displaylogo: false,
          modeBarButtonsToRemove: ["lasso2d", "select2d"],
        }}
        style={{ width: "100%", height }}
        useResizeHandler
      />
    </div>
  );
}
