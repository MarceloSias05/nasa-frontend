import { api } from "./client";

export type PopulationAgg = "sum" | "avg";

export interface PopulationResponseItem {
  id?: string;
  cve_ent?: string;
  cve_mun?: string;
  longitude?: number;
  latitude?: number;
  pobtot?: number;
}

// GET /urban-quality?cve_ent=&cve_mun=&limit=&offset=
export async function getUrbanQualityList(params?: Record<string, any>) {
  const { data } = await api.get("/urban-quality", { params });
  return data;
}

// GET /urban-quality/population?agg=sum&cve_ent=&cve_mun=&bbox=lon1,lat1,lon2,lat2
export async function getPopulationByLocation(options?: {
  agg?: PopulationAgg;
  cve_ent?: string;
  cve_mun?: string;
  bbox?: [number, number, number, number];
  limit?: number;
  offset?: number;
  forceMock?: boolean;
}) {
  const params: any = {};
  if (options?.agg) params.agg = options.agg;
  if (options?.cve_ent) params.cve_ent = options.cve_ent;
  if (options?.cve_mun) params.cve_mun = options.cve_mun;
  if (options?.bbox) params.bbox = options.bbox.join(",");
  if (options?.limit) params.limit = options.limit;
  if (options?.offset) params.offset = options.offset;

  // If forceMock specified, skip backend and return mock
  if (options?.forceMock) {
    return generateMockPopulation(params.bbox, options?.limit);
  }

  try {
    const { data } = await api.get("/population", { params });
    return data as PopulationResponseItem[];
  } catch (err) {
    // Fallback to mock data when backend not available
    console.warn('urbanQuality.getPopulationByLocation: backend request failed, returning mock', err);
    return generateMockPopulation(params.bbox, options?.limit);
  }
}

function generateMockPopulation(bboxStr?: string, limit?: number) {
  // bboxStr expected as 'lon1,lat1,lon2,lat2'
  let w = -100.3161, s = 25.61, e = -100.1830, n = 25.7156;
  if (bboxStr) {
    const parts = String(bboxStr).split(',').map(Number);
    if (parts.length === 4 && parts.every(Number.isFinite)) {
      w = parts[0]; s = parts[1]; e = parts[2]; n = parts[3];
    }
  }

  const out: PopulationResponseItem[] = [];
  const cols = 30;
  const rows = 30;
  const total = Math.min(limit || cols * rows, cols * rows);
  let id = 0;
  for (let r = 0; r < rows && out.length < total; r++) {
    for (let c = 0; c < cols && out.length < total; c++) {
      const lon = w + (c + 0.5) * ((e - w) / cols) + (Math.random() - 0.5) * 0.0005;
      const lat = s + (r + 0.5) * ((n - s) / rows) + (Math.random() - 0.5) * 0.0005;
      const pobtot = Math.max(0, Math.round(100 + Math.random() * 2000 * (Math.sin(r/5) + 1)));
      out.push({ id: String(id++), longitude: lon, latitude: lat, pobtot });
    }
  }
  return out;
}

 
