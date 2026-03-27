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
    <div className="mx-auto max-w-2xl space-y-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Upload</h1>
        <p className="mt-2 text-sm text-ink-muted">
          CSV with <span className="font-mono">timestamp</span> and <span className="font-mono">value</span>{" "}
          columns (optional: <span className="font-mono">series_id</span>,{" "}
          <span className="font-mono">label</span>). Headers are matched case-insensitively.
        </p>
      </div>

      <form onSubmit={onUpload} className="space-y-4 rounded-lg border border-surface-border bg-white p-6">
        <label className="block text-sm font-medium text-ink">File</label>
        <input
          type="file"
          accept=".csv,text/csv"
          className="block w-full text-sm text-ink-muted file:mr-4 file:rounded-md file:border file:border-surface-border file:bg-surface-muted file:px-3 file:py-2 file:text-sm file:font-medium file:text-ink"
          onChange={(ev) => setFile(ev.target.files?.[0] ?? null)}
        />
        <button
          type="submit"
          disabled={!file || busy}
          className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
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
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-faint">Accepted format</p>
          <pre className="whitespace-pre-wrap">{sampleText.replace(/```csv|```/g, "").trim()}</pre>
        </div>
      )}

      {uploadId && (
        <form onSubmit={onAnalyze} className="space-y-4 rounded-lg border border-surface-border bg-white p-6">
          <h2 className="text-sm font-semibold text-ink">Analysis options</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm text-ink-muted">
              Window size (points)
              <input
                type="number"
                min={2}
                className="mt-1 w-full rounded-md border border-surface-border px-3 py-2 font-mono text-sm"
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
                className="mt-1 w-full rounded-md border border-surface-border px-3 py-2 text-sm"
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
                className="mt-1 w-full rounded-md border border-surface-border px-3 py-2 font-mono text-sm"
                value={zThreshold}
                onChange={(e) => setZThreshold(Number(e.target.value))}
              />
            </label>
            <label className="block text-sm text-ink-muted sm:col-span-2">
              Rolling window (rolling method)
              <input
                type="number"
                min={3}
                className="mt-1 w-full rounded-md border border-surface-border px-3 py-2 font-mono text-sm"
                value={rollingWindow}
                onChange={(e) => setRollingWindow(Number(e.target.value))}
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={busy}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
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
