import { urbanQualityV1 } from './index';
import { MAP_BOUNDS } from '../config';

export type PopulationItem = {
  lat: number;
  lon: number;
  POBTOT: number;
};

export async function fetchPopulation(latMin?: number, latMax?: number, lonMin?: number, lonMax?: number): Promise<PopulationItem[]> {
  // Default to MAP_BOUNDS when any param is missing
  if (latMin === undefined || latMax === undefined || lonMin === undefined || lonMax === undefined) {
    const [[w, s], [e, n]] = MAP_BOUNDS as any;
    lonMin = w;
    lonMax = e;
    latMin = s;
    latMax = n;
  }
  const resp = await urbanQualityV1.getPopulationByBBox(latMin, latMax, lonMin, lonMax);
  return resp.map((r: any) => ({ lat: r.lat, lon: r.lon, POBTOT: r.POBTOT }));
}
