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
  // We'll build the grid in WebMercator (meters) so cells are true 1.5km x 1.5km
  // in projected coordinates, then convert back to lon/lat for the GeoJSON. This
  // avoids the visual distortion you saw when building the grid using fixed
  // degree deltas.
  const R = 6378137; // earth radius for WebMercator
  const deg2rad = (d: number) => (d * Math.PI) / 180;
  const rad2deg = (r: number) => (r * 180) / Math.PI;

  const lonLatToMerc = (lon: number, lat: number) => {
    const x = R * deg2rad(lon);
    const y = R * Math.log(Math.tan(Math.PI / 4 + deg2rad(lat) / 2));
    return [x, y];
  };

  const mercToLonLat = (x: number, y: number) => {
    const lon = rad2deg(x / R);
    const lat = rad2deg(2 * Math.atan(Math.exp(y / R)) - Math.PI / 2);
    return [lon, lat];
  };

  let [[west, south], [east, north]] = bounds.map((b) => b.slice()) as number[][];

  // Convert geographic bounds to mercator meters
  const [westM, southM] = lonLatToMerc(west, south);
  const [eastM, northM] = lonLatToMerc(east, north);

  // cell size in meters
  const cellMeters = Math.round(cellKm * 1000);

  // apply padding in cells (in meters)
  const pad = paddingCells * cellMeters;
  const minX = Math.min(westM, eastM) - pad;
  const maxX = Math.max(westM, eastM) + pad;
  const minY = Math.min(southM, northM) - pad;
  const maxY = Math.max(southM, northM) + pad;

  // Align to global origin (0,0) in mercator meters if requested
  const startX = alignToGlobal ? Math.floor(minX / cellMeters) * cellMeters : minX;
  const startY = alignToGlobal ? Math.floor(minY / cellMeters) * cellMeters : minY;

  const features: any[] = [];

  // vertical lines (constant X)
  for (let x = startX; x <= maxX + cellMeters / 2; x += cellMeters) {
    // clamp x to bounds
    const xClamped = Math.min(Math.max(x, minX), maxX);
    const p1 = mercToLonLat(xClamped, minY);
    const p2 = mercToLonLat(xClamped, maxY);
    features.push({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [p1, p2] } });
  }

  // horizontal lines (constant Y)
  for (let y = startY; y <= maxY + cellMeters / 2; y += cellMeters) {
    const yClamped = Math.min(Math.max(y, minY), maxY);
    const p1 = mercToLonLat(minX, yClamped);
    const p2 = mercToLonLat(maxX, yClamped);
    features.push({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [p1, p2] } });
  }

  return { type: 'FeatureCollection', features };
};
