import { useState, useEffect } from 'react';
import { fetchEducation } from '../api/educationClient';

export default function useEducation(latMin?: number, latMax?: number, lonMin?: number, lonMax?: number) {
  const [data, setData] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const resp = await fetchEducation(latMin, latMax, lonMin, lonMax);
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
