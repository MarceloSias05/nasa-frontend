import { useState } from "react";
import type { FeatureCollection, Polygon } from "geojson";
import { postSelectedArea, getResultById } from "../api/areas";
    
export function useAreaAnalysis() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  async function analyzeArea(geometry: FeatureCollection<Polygon>) {
    try {
      setLoading(true);
      setError(null);

      const { resultId } = await postSelectedArea(geometry);
      const data = await getResultById(resultId);

      setResult(data);
      return data;
    } catch (err: any) {
      setError(err.message || "Error al analizar el área");
    } finally {
      setLoading(false);
    }
  }

  return { analyzeArea, result, loading, error };
}
