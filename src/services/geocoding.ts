import { MAPTILER_KEY } from '../config';

export interface GeocodeResult {
  name: string;
  lon: number;
  lat: number;
  raw: any;
}

export async function geocode(q: string, limit = 5): Promise<GeocodeResult[]> {
  const query = q.trim();
  if (!query) return [];
  const out: GeocodeResult[] = [];

  if (MAPTILER_KEY) {
    const url = `https://api.maptiler.com/geocoding/${encodeURIComponent(query)}.json?key=${MAPTILER_KEY}&limit=${limit}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Geocoding error');
    const data = await res.json();
    if (data && data.features && data.features.length) {
      for (const f of data.features) {
        out.push({ name: f.properties.label || f.place_name || f.text, lon: f.geometry.coordinates[0], lat: f.geometry.coordinates[1], raw: f });
      }
    }
    return out;
  }

  // fallback to Nominatim
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=${limit}`;
  const res = await fetch(url, { headers: { 'Accept-Language': 'en-US' } });
  if (!res.ok) throw new Error('Geocoding error');
  const data = await res.json();
  if (data && data.length) {
    for (const item of data) {
      out.push({ name: item.display_name, lon: Number(item.lon), lat: Number(item.lat), raw: item });
    }
  }
  return out;
}
