const API_BASE = "/api";

export interface Paper {
  id: number;
  title: string;
  first_author: string;
  domain: string;
  reading_stage: string;
  citation_count: number;
  impact_score: string;
  date_added: string;
  file_url?: string;
  created_at: string;
}

export interface PaperInput {
  title: string;
  first_author: string;
  domain: string;
  reading_stage: string;
  citation_count: number;
  impact_score: string;
  date_added: string;
  file_url?: string;
}

export interface FilterParams {
  reading_stage?: string[];
  domain?: string[];
  impact_score?: string[];
  date_range?: string;
}

export interface AnalyticsData {
  funnelData: { stage: string; count: number }[];
  scatterData: {
    id: number;
    title: string;
    firstAuthor: string;
    citationCount: number;
    impactScore: string;
  }[];
  stackedBarData: Record<string, any>[];
  summary: {
    totalPapers: number;
    papersByStage: Record<string, number>;
    avgCitationsByDomain: Record<string, number>;
    completionRate: number;
  };
}

async function parseResponse(res: Response) {
  const text = await res.text();
  if (!text) {
    throw new Error(`Server returned empty response (status ${res.status})`);
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Server error: ${text.substring(0, 200)}`);
  }
}

export async function createPaper(data: PaperInput | FormData): Promise<Paper> {
  const isFormData = data instanceof FormData;
  const res = await fetch(`${API_BASE}/papers`, {
    method: "POST",
    headers: isFormData ? {} : { "Content-Type": "application/json" },
    body: isFormData ? (data as FormData) : JSON.stringify(data),
  });
  const result = await parseResponse(res);
  if (!res.ok) {
    throw new Error(result.error || "Failed to create paper");
  }
  return result;
}

export async function fetchPapers(filters?: FilterParams): Promise<Paper[]> {
  const params = new URLSearchParams();
  if (filters?.reading_stage?.length) {
    params.set("reading_stage", filters.reading_stage.join(","));
  }
  if (filters?.domain?.length) {
    params.set("domain", filters.domain.join(","));
  }
  if (filters?.impact_score?.length) {
    params.set("impact_score", filters.impact_score.join(","));
  }
  if (filters?.date_range && filters.date_range !== "all_time") {
    params.set("date_range", filters.date_range);
  }

  const url = params.toString()
    ? `${API_BASE}/papers?${params.toString()}`
    : `${API_BASE}/papers`;

  const res = await fetch(url);
  const data = await parseResponse(res);
  if (!res.ok) throw new Error(data.error || "Failed to fetch papers");
  return data;
}

export async function deletePaper(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/papers/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const data = await parseResponse(res);
    throw new Error(data.error || "Failed to delete paper");
  }
}

export async function updatePaper(id: number, data: PaperInput | FormData): Promise<Paper> {
  const isFormData = data instanceof FormData;
  const res = await fetch(`${API_BASE}/papers/${id}`, {
    method: "PUT",
    headers: isFormData ? {} : { "Content-Type": "application/json" },
    body: isFormData ? (data as FormData) : JSON.stringify(data),
  });
  const result = await parseResponse(res);
  if (!res.ok) throw new Error(result.error || "Failed to update paper");
  return result;
}

export async function fetchPaper(id: number): Promise<Paper> {
  const res = await fetch(`${API_BASE}/papers/${id}`);
  const data = await parseResponse(res);
  if (!res.ok) throw new Error(data.error || "Failed to fetch paper");
  return data;
}

export async function fetchAnalytics(): Promise<AnalyticsData> {
  const res = await fetch(`${API_BASE}/analytics`);
  const data = await parseResponse(res);
  if (!res.ok) throw new Error(data.error || "Failed to fetch analytics");
  return data;
}

