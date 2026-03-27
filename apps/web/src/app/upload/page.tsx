"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { analyze, uploadCsv } from "@/lib/api";

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [sampleText, setSampleText] = useState<string | null>(null);
  const [previewRows, setPreviewRows] = useState<number | null>(null);

  const [windowSize, setWindowSize] = useState(100);
  const [segmentation, setSegmentation] = useState(true);
  const [method, setMethod] = useState<"zscore" | "rolling">("zscore");
  const [zThreshold, setZThreshold] = useState(3);
  const [rollingWindow, setRollingWindow] = useState(20);

  async function onUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const res = await uploadCsv(file);
      setUploadId(res.upload_id);
      setSampleText(res.sample_format_markdown);
      setPreviewRows(res.row_count);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  async function onAnalyze(e: React.FormEvent) {
    e.preventDefault();
    if (!uploadId) return;
    setBusy(true);
    setError(null);
    try {
      const detail = await analyze(uploadId, {
        window_size: windowSize,
        segmentation_enabled: segmentation,
        anomaly_method: method,
        z_threshold: zThreshold,
        rolling_window: rollingWindow,
      });
      router.push(`/analysis/${detail.analysis_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="page-title">Upload</h1>
        <p className="page-subtitle">
          CSV with <span className="font-mono">timestamp</span> and <span className="font-mono">value</span>{" "}
          columns (optional: <span className="font-mono">series_id</span>,{" "}
          <span className="font-mono">label</span>). Headers are matched case-insensitively.
        </p>
      </div>

      <form onSubmit={onUpload} className="panel space-y-4">
        <label className="block text-sm font-medium text-ink">File</label>
        <input
          type="file"
          accept=".csv,text/csv"
          className="block w-full text-sm text-ink-muted file:mr-4 file:rounded-lg file:border file:border-surface-border file:bg-surface-muted file:px-3 file:py-2 file:text-sm file:font-medium file:text-ink"
          onChange={(ev) => setFile(ev.target.files?.[0] ?? null)}
        />
        <button
          type="submit"
          disabled={!file || busy}
          className="btn-primary"
        >
          {busy && !uploadId ? "Validating…" : "Validate & stage upload"}
        </button>
      </form>

      {previewRows !== null && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-900">
          Staged upload <span className="font-mono">{uploadId}</span> — {previewRows} rows accepted.
        </div>
      )}

      {sampleText && (
        <div className="prose-sample">
          <p className="kicker mb-2">Accepted format</p>
          <pre className="whitespace-pre-wrap">{sampleText.replace(/```csv|```/g, "").trim()}</pre>
        </div>
      )}

      {uploadId && (
        <form onSubmit={onAnalyze} className="panel space-y-4">
          <h2 className="text-sm font-semibold text-ink">Analysis options</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm text-ink-muted">
              Window size (points)
              <input
                type="number"
                min={2}
                className="input font-mono"
                value={windowSize}
                onChange={(e) => setWindowSize(Number(e.target.value))}
              />
            </label>
            <label className="flex items-end gap-2 pb-2 text-sm text-ink-muted">
              <input
                type="checkbox"
                checked={segmentation}
                onChange={(e) => setSegmentation(e.target.checked)}
              />
              Enable segmentation
            </label>
            <label className="block text-sm text-ink-muted">
              Anomaly method
              <select
                className="input"
                value={method}
                onChange={(e) => setMethod(e.target.value as "zscore" | "rolling")}
              >
                <option value="zscore">Z-score (global)</option>
                <option value="rolling">Rolling deviation</option>
              </select>
            </label>
            <label className="block text-sm text-ink-muted">
              Threshold
              <input
                type="number"
                step="0.1"
                className="input font-mono"
                value={zThreshold}
                onChange={(e) => setZThreshold(Number(e.target.value))}
              />
            </label>
            <label className="block text-sm text-ink-muted sm:col-span-2">
              Rolling window (rolling method)
              <input
                type="number"
                min={3}
                className="input font-mono"
                value={rollingWindow}
                onChange={(e) => setRollingWindow(Number(e.target.value))}
              />
            </label>
          </div>
          <button type="submit" disabled={busy} className="btn-primary">
            {busy ? "Running…" : "Run analysis"}
          </button>
        </form>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">{error}</div>
      )}
    </div>
  );
}
