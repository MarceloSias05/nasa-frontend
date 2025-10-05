import { useState, useEffect } from 'react';
import { fetchPopulation } from '../api/populationClient';
import { MAP_BOUNDS } from '../config';

export default function usePopulation(latMin?: number, latMax?: number, lonMin?: number, lonMax?: number) {
  // If caller doesn't provide bbox, default to config MAP_BOUNDS
  if (latMin === undefined || latMax === undefined || lonMin === undefined || lonMax === undefined) {
    const [[w, s], [e, n]] = MAP_BOUNDS as any;
    lonMin = w;
    lonMax = e;
    latMin = s;
    latMax = n;
  }

  const [data, setData] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const resp = await fetchPopulation(latMin!, latMax!, lonMin!, lonMax!);
        if (mounted) setData(resp);
      } catch (e: any) {
        if (mounted) setError(e);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [latMin, latMax, lonMin, lonMax]);

  return { data, loading, error };
}
