import { api } from "./client";

export async function listModels() {
  const { data } = await api.get("/models");
  return data; // Ej: [{ id, name, description }]
}
