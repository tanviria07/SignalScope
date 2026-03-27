const baseUrl = () => process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type AnalysisConfig = {
  window_size: number;
  segmentation_enabled: boolean;
  anomaly_method: "zscore" | "rolling";
  z_threshold: number;
  rolling_window: number;
};

export type PointRow = {
  timestamp: string;
  value: number;
  series_id?: string | null;
  label?: string | null;
};

export type AnomalyPoint = {
  timestamp: string;
  value: number;
  score: number;
  reason: string;
};

export type SegmentMetrics = {
  segment_index: number;
  start_timestamp: string;
  end_timestamp: string;
  point_count: number;
  mean: number;
  std: number;
  min: number;
  max: number;
  trend_slope: number;
  local_peak_count: number;
  asymmetry_score: number;
  drift_score: number;
};

export type GlobalMetrics = {
  mean: number;
  std: number;
  min: number;
  max: number;
  trend_slope: number;
  local_peak_count: number;
  asymmetry_score: number;
  drift_score: number;
};

export type InsightItem = {
  text: string;
  severity: "info" | "warning" | "notice";
};

export type AnalysisDetail = {
  analysis_id: string;
  filename: string;
  created_at: string;
  config: AnalysisConfig;
  points: PointRow[];
  segments: SegmentMetrics[];
  global_metrics: GlobalMetrics;
  anomalies: AnomalyPoint[];
  anomaly_count: number;
  insights: InsightItem[];
  segment_boundaries: string[];
};

export type HistoryItem = {
  analysis_id: string;
  filename: string;
  created_at: string;
  config: AnalysisConfig;
  global_metrics: GlobalMetrics;
  anomaly_count: number;
};

export type UploadResponse = {
  upload_id: string;
  filename: string;
  row_count: number;
  columns_detected: string[];
  preview: PointRow[];
  sample_format_markdown: string;
};

async function parseJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail: string;
    try {
      const body = await res.json();
      detail = typeof body?.detail === "string" ? body.detail : JSON.stringify(body);
    } catch {
      detail = await res.text();
    }
    throw new Error(detail || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function uploadCsv(file: File): Promise<UploadResponse> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`${baseUrl()}/api/upload`, {
    method: "POST",
    body: fd,
  });
  return parseJson<UploadResponse>(res);
}

export async function analyze(
  uploadId: string,
  config: Partial<AnalysisConfig> = {},
): Promise<AnalysisDetail> {
  const body = {
    upload_id: uploadId,
    config: {
      window_size: 100,
      segmentation_enabled: true,
      anomaly_method: "zscore" as const,
      z_threshold: 3,
      rolling_window: 20,
      ...config,
    },
  };
  const res = await fetch(`${baseUrl()}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return parseJson<AnalysisDetail>(res);
}

export async function getAnalysis(id: string): Promise<AnalysisDetail> {
  const res = await fetch(`${baseUrl()}/api/analysis/${id}`, { cache: "no-store" });
  return parseJson<AnalysisDetail>(res);
}

export async function getHistory(limit = 50): Promise<HistoryItem[]> {
  const res = await fetch(`${baseUrl()}/api/history?limit=${limit}`, { cache: "no-store" });
  return parseJson<HistoryItem[]>(res);
}
