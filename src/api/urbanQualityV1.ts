import { api } from './client';
import { MAP_BOUNDS } from '../config';

// Types returned by the backend endpoints
export interface PopulationItemV1 {
  lat: number;
  lon: number;
  POBTOT: number;
}

export interface EducationItemV1 {
  lat: number;
  lon: number;
  GRAPROES?: number;
  GRAPROES_F?: number;
  GRAPROES_M?: number;
}

export interface TreesItemV1 {
  lat: number;
  lon: number;
  ARBOLES_C?: number;
}

/**
 * GET /api/v1/population
 * Required query params: lat_min, lat_max, lon_min, lon_max
 */
export async function getPopulationByBBox(lat_min?: number, lat_max?: number, lon_min?: number, lon_max?: number): Promise<PopulationItemV1[]> {
  // If any of the bbox params are missing, default to the city MAP_BOUNDS defined in config
  if (lat_min === undefined || lat_max === undefined || lon_min === undefined || lon_max === undefined) {
    const [[w, s], [e, n]] = MAP_BOUNDS as any;
    lon_min = w;
    lon_max = e;
    lat_min = s;
    lat_max = n;
  }
  const params = { lat_min, lat_max, lon_min, lon_max };
  const { data } = await api.get<PopulationItemV1[]>('/api/v1/population', { params });
  return data;
}

export async function getEducationByBBox(lat_min?: number, lat_max?: number, lon_min?: number, lon_max?: number): Promise<EducationItemV1[]> {
  if (lat_min === undefined || lat_max === undefined || lon_min === undefined || lon_max === undefined) {
    const [[w, s], [e, n]] = MAP_BOUNDS as any;
    lon_min = w;
    lon_max = e;
    lat_min = s;
    lat_max = n;
  }
  const params = { lat_min, lat_max, lon_min, lon_max };
  const { data } = await api.get<EducationItemV1[]>('/api/v1/education', { params });
  return data;
}

export async function getTreesByBBox(lat_min?: number, lat_max?: number, lon_min?: number, lon_max?: number): Promise<TreesItemV1[]> {
  if (lat_min === undefined || lat_max === undefined || lon_min === undefined || lon_max === undefined) {
    const [[w, s], [e, n]] = MAP_BOUNDS as any;
    lon_min = w;
    lon_max = e;
    lat_min = s;
    lat_max = n;
  }
  const params = { lat_min, lat_max, lon_min, lon_max };
  const { data } = await api.get<TreesItemV1[]>('/api/v1/trees', { params });
  return data;
}
