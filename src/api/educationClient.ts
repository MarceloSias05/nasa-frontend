import { urbanQualityV1 } from './index';
import { MAP_BOUNDS } from '../config';

export type EducationItem = {
  lat: number;
  lon: number;
  GRAPROES?: number; // promedio de escolaridad
};

export async function fetchEducation(latMin?: number, latMax?: number, lonMin?: number, lonMax?: number): Promise<EducationItem[]> {
  if (latMin === undefined || latMax === undefined || lonMin === undefined || lonMax === undefined) {
    const [[w, s], [e, n]] = MAP_BOUNDS as any;
    lonMin = w;
    lonMax = e;
    latMin = s;
    latMax = n;
  }
  const resp = await urbanQualityV1.getEducationByBBox(latMin!, latMax!, lonMin!, lonMax!);
  return resp.map((r: any) => ({ lat: r.lat, lon: r.lon, GRAPROES: r.GRAPROES ?? r.graproes ?? null }));
}
