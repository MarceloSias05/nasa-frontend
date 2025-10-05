import { useState } from "react";
import type { FeatureCollection, Geometry } from "geojson";
import { postSelectedArea } from "../api/areas";

const MOCK_ENABLED = String(process.env.REACT_APP_MOCK_API || '').toLowerCase() === 'true';

function mockAnalyze(area: FeatureCollection<Geometry>): Promise<FeatureCollection<Geometry>> {
  // Shallow-clone and add some basic properties to visualize
  const enriched: FeatureCollection<Geometry> = {
    type: 'FeatureCollection',
    features: (area.features || []).map((f, i) => ({
      ...f,
      properties: {
        ...(f as any).properties,
        optimized: true,
        score: Math.round(60 + Math.random() * 40), // 60-100
        id: (f as any).id ?? i,
      },
    })),
  } as any;
  return new Promise((resolve) => setTimeout(() => resolve(enriched), 400));
}
    
export function useAreaAnalysis() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  async function analyzeArea(area: FeatureCollection<Geometry>) {
    try {
      setLoading(true);
      setError(null);
      // If mock mode is enabled, short-circuit to mocked result
      if (MOCK_ENABLED) {
        const mock = await mockAnalyze(area);
        setResult(mock);
        return mock;
      }

      // Try real backend
      const res = await postSelectedArea(area);
      setResult(res);
      return res;
    } catch (err: any) {
      // If backend fails but we want to keep UX flowing, return a mock
      if (MOCK_ENABLED) {
        const mock = await mockAnalyze(area);
        setResult(mock);
        return mock;
      }
      setError(err?.message || "Error analizando el área");
      return null;
    } finally {
      setLoading(false);
    }
  }

  return { analyzeArea, result, loading, error };
}
