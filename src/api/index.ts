import { api } from "./client";
import type { FeatureCollection, Polygon } from "geojson";
import * as urbanQuality from "./urbanQuality";
import * as urbanQualityV1 from "./urbanQualityV1";

export async function postSelectedArea(area: FeatureCollection<Polygon>) {
  const { data } = await api.post("/areas", area);
  return data;
}

export async function getResultById(id: string) {
  const { data } = await api.get(`/results/${id}`);
  return data;
}

export async function getAreasHistory() {
  const { data } = await api.get("/areas");
  return data;
}

export async function postHistory(entry: any) {
  const { data } = await api.post('/history', entry);
  return data;
}

export { urbanQuality };
export { urbanQualityV1 };
