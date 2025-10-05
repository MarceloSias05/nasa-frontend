import { MAPTILER_KEY, MAP_BOUNDS, INITIAL_VIEW_STATE } from '../config';

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

  // Prepare biasing parameters from MAP_BOUNDS / INITIAL_VIEW_STATE
  let bboxParam = '';
  let proximityParam = '';
  try {
    if (MAP_BOUNDS && Array.isArray(MAP_BOUNDS) && MAP_BOUNDS.length === 2) {
      const [[w, s], [e, n]] = MAP_BOUNDS as any;
      // MapTiler expects bbox=minLon,minLat,maxLon,maxLat
      bboxParam = `&bbox=${encodeURIComponent([w, s, e, n].join(','))}`;
    }
    if (INITIAL_VIEW_STATE) {
      proximityParam = `&proximity=${encodeURIComponent(`${INITIAL_VIEW_STATE.longitude},${INITIAL_VIEW_STATE.latitude}`)}`;
    }
  } catch (err) {
    // ignore
  }

  // Try MapTiler first if key available
  if (MAPTILER_KEY) {
    try {
      const url = `https://api.maptiler.com/geocoding/${encodeURIComponent(query)}.json?key=${MAPTILER_KEY}&limit=${limit}${bboxParam}${proximityParam}&language=es`;
      const res = await fetch(url, { headers: { 'Accept-Language': 'es' } });
      if (res.ok) {
        const data = await res.json();
        if (data && data.features && data.features.length) {
          for (const f of data.features) {
            out.push({ name: f.properties.label || f.place_name || f.text, lon: f.geometry.coordinates[0], lat: f.geometry.coordinates[1], raw: f });
          }
          if (out.length) return out;
        }
      }
    } catch (err) {
      // Fall through to Nominatim
      // console.warn('MapTiler geocode error', err);
    }
  }

  // fallback to Nominatim with viewbox/bounded bias to MAP_BOUNDS
  try {
    let nomUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=${limit}`;
    if (bboxParam) {
      // bboxParam is minLon,minLat,maxLon,maxLat but Nominatim expects left,top,right,bottom (lon1,lat1,lon2,lat2) as viewbox
      // We'll reuse the same order but ensure it's lonLeft,latTop,lonRight,latBottom
      const bbox = bboxParam.replace('&bbox=', '');
      const [minLon, minLat, maxLon, maxLat] = bbox.split(',');
      // viewbox expects lon_left,lat_top,lon_right,lat_bottom
      nomUrl += `&viewbox=${encodeURIComponent([minLon, maxLat, maxLon, minLat].join(','))}&bounded=1`;
    }

    const res = await fetch(nomUrl, { headers: { 'Accept-Language': 'es', 'User-Agent': 'CityInsights/1.0 (dev)' } });
    if (res.ok) {
      const data = await res.json();
      if (data && data.length) {
        for (const item of data) {
          out.push({ name: item.display_name, lon: Number(item.lon), lat: Number(item.lat), raw: item });
        }
      }
    }
  } catch (err) {
    // ignore
  }

  return out;
}
