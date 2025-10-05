import { MAP_BOUNDS, CELL_SIZE_KM, INITIAL_VIEW_STATE } from '../config';

export const clampViewState = (vs: any) => {
  try {
    const lon = typeof vs.longitude === 'number' ? vs.longitude : INITIAL_VIEW_STATE.longitude;
    const lat = typeof vs.latitude === 'number' ? vs.latitude : INITIAL_VIEW_STATE.latitude;
    const zoom = typeof vs.zoom === 'number' ? vs.zoom : INITIAL_VIEW_STATE.zoom;
    const [[west, south], [east, north]] = MAP_BOUNDS as any;

    const clampedLon = Math.max(Math.min(lon, east), west);
    const clampedLat = Math.max(Math.min(lat, north), south);
    const clampedZoom = Math.max(Math.min(zoom, INITIAL_VIEW_STATE.maxZoom), INITIAL_VIEW_STATE.minZoom);

    return { ...vs, longitude: clampedLon, latitude: clampedLat, zoom: clampedZoom };
  } catch (err) {
    return vs;
  }
};

export const generateGridLines = (bounds: number[][], cellKm = CELL_SIZE_KM, refLat = 0, alignToGlobal = true, paddingCells = 1) => {
  let [[west, south], [east, north]] = bounds.map(b => b.slice()) as number[][];
  const metersPerDegLat = 111320;
  const latRad = (refLat * Math.PI) / 180;
  const metersPerDegLon = Math.abs(Math.cos(latRad) * metersPerDegLat);

  const latDelta = (cellKm * 1000) / metersPerDegLat;
  const lonDelta = (cellKm * 1000) / metersPerDegLon;

  west = west - lonDelta * paddingCells;
  east = east + lonDelta * paddingCells;
  south = south - latDelta * paddingCells;
  north = north + latDelta * paddingCells;

  const features: any[] = [];
  let startLon = west;
  let startLat = south;
  if (alignToGlobal) {
    const originLon = 0;
    const originLat = 0;
    startLon = Math.floor((west - originLon) / lonDelta) * lonDelta + originLon;
    startLat = Math.floor((south - originLat) / latDelta) * latDelta + originLat;
  }

  for (let lon = startLon; lon <= east + lonDelta / 2; lon += lonDelta) {
    const x = lon;
    if (x < west - 1e-12) continue;
    const xc = Math.min(x, east);
    features.push({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [[xc, south], [xc, north]] } });
    if (x >= east) break;
  }

  for (let lat = startLat; lat <= north + latDelta / 2; lat += latDelta) {
    const y = lat;
    if (y < south - 1e-12) continue;
    const yc = Math.min(y, north);
    features.push({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [[west, yc], [east, yc]] } });
    if (y >= north) break;
  }

  return { type: 'FeatureCollection', features };
};
