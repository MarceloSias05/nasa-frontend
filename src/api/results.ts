import { api } from "./client";

export async function getResultById(id: string) {
  const { data } = await api.get(`/results/${id}`);
  return data; // GeoJSON o dataset analizado
}
