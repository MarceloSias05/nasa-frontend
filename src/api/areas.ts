import { api } from "./client";
import type { FeatureCollection, Geometry } from "geojson";

// 🔹 POST: enviar el área seleccionada al backend
export async function postSelectedArea(area: FeatureCollection<Geometry>) {
  const { data } = await api.post("/areas", area);
  return data;
}

// 🔹 GET: historial de áreas analizadas
export async function getAreasHistory() {
  const { data } = await api.get("/areas");
  return data;
}

// 🔹 GET: obtener resultado por ID (usado por useAreaAnalysis)
export async function getResultById(id: string) {
  const { data } = await api.get(`/results/${id}`);
  return data; // debe devolver GeoJSON o datos del análisis
}
