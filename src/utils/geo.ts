import type { FeatureCollection, Geometry, Polygon, MultiPolygon } from "geojson";

export function polygonToLatLon(fc: FeatureCollection<Geometry>): { lat: number; lon: number }[] {
  const f = fc.features.find(
    (ft) => ft.geometry.type === "Polygon" || ft.geometry.type === "MultiPolygon"
  );
  if (!f) return [];

  if (f.geometry.type === "Polygon") {
    const ring = (f.geometry as Polygon).coordinates[0] || [];
    return ring.map(([lon, lat]) => ({ lat, lon }));
  }

  if (f.geometry.type === "MultiPolygon") {
    const ring = (f.geometry as MultiPolygon).coordinates[0]?.[0] || [];
    return ring.map(([lon, lat]) => ({ lat, lon }));
  }

  return [];
}
