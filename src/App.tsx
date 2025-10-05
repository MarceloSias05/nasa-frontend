// src/App.tsx
import React, { useMemo, useState, useEffect } from "react";
import MapView from "./components/MapView";
import Sidebar from "./components/Sidebar/Sidebar";
import { GeoJsonLayer, ScatterplotLayer } from "@deck.gl/layers";
import { ScenegraphLayer } from "@deck.gl/mesh-layers";
import type {
  FeatureCollection,
  LineString,
  Point,
  Geometry,
} from "geojson";
import {
  MAP_BOUNDS,
  HUMAN_MODEL_URL,
  INITIAL_VIEW_STATE,
  CELL_SIZE_KM,
} from "./config";
import { clampViewState, generateGridLines } from "./utils/mapUtils";
import { geocode } from "./services/geocoding";
import type { GeocodeResult } from "./services/geocoding";
import { useAreaAnalysis } from "./hooks/useAreaAnalysis";
// removed unused polygonToLatLon import
import { parseLatLonCsv, coordsToPolygonFeatureCollection } from "./utils/csv";
import { parseWktsToFeatureCollection } from "./utils/wkt";

export default function App(): React.ReactElement {
  // ---------- STATE ----------
  const [mapMode, setMapMode] = useState<"streets" | "satellite">("streets");
  const [is3D, setIs3D] = useState(true);
  const [savedCamera, setSavedCamera] = useState<{ pitch?: number; bearing?: number } | null>(null);
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE as any);
  const [showGrid, setShowGrid] = useState(false);
  const [activeVis, setActiveVis] = useState<string>("hexbin");

  const [layer, setLayer] = useState<string>("Población");
  const [cellSize, setCellSize] = useState<number>(50);
  const [clusterRadius, setClusterRadius] = useState<number>(75);
  const [maxHeight, setMaxHeight] = useState<number>(25);

  const [budget, setBudget] = useState<number>(300000);
  const [maxParques, setMaxParques] = useState<number>(10);
  const [maxEscuelas, setMaxEscuelas] = useState<number>(10);

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<GeocodeResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<any | null>(null);

  // removed unused Street View state

  const [showHuman3D] = useState(false);
  const [humanCoords] = useState<[number, number] | null>(null);

  const [featurePopup, setFeaturePopup] = useState<{
    lng: number; lat: number; title: string; details?: any; screenX?: number; screenY?: number
  } | null>(null);
  const [animTime, setAnimTime] = useState<number>(0);

  const [customLayer, setCustomLayer] = useState<any | null>(null);
  const [csvPolygonLayer, setCsvPolygonLayer] = useState<any | null>(null);
  const [wktIndex, setWktIndex] = useState<{
    bboxFeatureCollection: FeatureCollection<Geometry> | null;
    records: Record<string, any>;
  } | null>(null);
  const [wktSelectedLayer, setWktSelectedLayer] = useState<any | null>(null);

  const { analyzeArea, loading, error } = useAreaAnalysis();

  // Normalize longitudes so features stay tied to the current world copy
  const normalizeLon = (lon: number, centerLon: number) => {
    if (!Number.isFinite(lon) || !Number.isFinite(centerLon)) return lon;
    // shift lon by multiples of 360 to be closest to centerLon
    let out = lon;
    while (out - centerLon > 180) out -= 360;
    while (out - centerLon < -180) out += 360;
    return out;
  };

  const normalizeFeatureCollectionToView = (
    fc: any,
    centerLon: number | undefined
  ) => {
    if (!fc || !fc.features || typeof centerLon !== 'number') return fc;
    try {
      const copy = { ...fc, features: fc.features.map((f: any) => ({ ...f })) };
      copy.features = copy.features.map((f: any) => {
        if (!f || !f.geometry) return f;
        const geom = f.geometry;
        const normCoords = (coords: any): any => {
          if (typeof coords[0] === 'number' && typeof coords[1] === 'number') {
            const lon = Number(coords[0]);
            const lat = Number(coords[1]);
            return [normalizeLon(lon, centerLon), lat];
          }
          return coords.map((c: any) => normCoords(c));
        };
        try {
          const ng = { ...geom, coordinates: normCoords(geom.coordinates) };
          return { ...f, geometry: ng };
        } catch {
          return f;
        }
      });
      return copy;
    } catch {
      return fc;
    }
  };

  // ---------- ANIMATION ----------
  useEffect(() => {
    let raf = 0 as unknown as number;
    const tick = (t: number) => {
      setAnimTime(t);
      raf = requestAnimationFrame(tick);
    };
    if (selectedResult || featurePopup) raf = requestAnimationFrame(tick);
    return () => { if (raf) cancelAnimationFrame(raf); };
  }, [selectedResult, featurePopup]);

  // ---------- BASE LAYER ----------
  const baseLayer = useMemo(
    () =>
      new GeoJsonLayer({
        id: "base-layer",
        data: "https://raw.githubusercontent.com/visgl/deck.gl-data/master/examples/geojson/vancouver-blocks.json",
        filled: is3D,
        extruded: is3D,
        getElevation: (f: any) => (is3D ? f.properties.valuePerSqm * 0.1 : 0),
        getFillColor: [255, 140, 0, 180],
        pickable: true,
        wrapLongitude: false,
      }),
    [is3D]
  );

  const layers: any[] = [baseLayer];

  // ---------- GRID LAYER ----------
  const gridData = useMemo(() => {
    if (!showGrid) return null;
    const [[w, s], [e, n]] = MAP_BOUNDS as any;
    const refLat = (s + n) / 2;
    return generateGridLines([[w, s], [e, n]], CELL_SIZE_KM, refLat, false, 0);
  }, [showGrid]);

  if (showGrid && gridData) {
    layers.push(
      new GeoJsonLayer({
        id: "grid-layer",
        data: gridData as FeatureCollection<LineString>,
        stroked: true,
        filled: false,
        getLineColor: [255, 0, 0, 80],
        lineWidthUnits: "pixels",
        getLineWidth: 1,
        wrapLongitude: false,
        pickable: false,
      })
    );
  }

  // ---------- CUSTOM LAYER (backend output) ----------
  if (customLayer) layers.push(customLayer);
  if (csvPolygonLayer) layers.push(csvPolygonLayer);

  // ---------- SEARCH MARKER ----------
  if (selectedResult) {
    const marker: FeatureCollection<Point> = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: { type: "Point", coordinates: [selectedResult.lon, selectedResult.lat] },
          properties: {},
        },
      ],
    };
    layers.push(
      new GeoJsonLayer({
        id: "search-marker",
        data: marker,
        pointRadiusMinPixels: 6,
        getFillColor: [0, 120, 255, 200],
        stroked: true,
        wrapLongitude: false,
      })
    );
  }

  // ---------- HIGHLIGHT EFFECT ----------
  const highlightCoords: [number, number] | null = selectedResult
    ? [selectedResult.lon, selectedResult.lat]
    : featurePopup
    ? [featurePopup.lng, featurePopup.lat]
    : null;

  if (highlightCoords) {
    const phase = (animTime % 1000) / 1000;
    const pulseData = [{ position: highlightCoords }];
    layers.push(
      new ScatterplotLayer({
        id: "highlight-core",
        data: pulseData,
        getPosition: (d: any) => d.position,
        radiusUnits: "pixels",
        getRadius: 6,
        filled: true,
        getFillColor: [0, 120, 255, 240],
        stroked: true,
        getLineColor: [255, 255, 255, 230],
        getLineWidth: 2,
        pickable: false,
          wrapLongitude: false,
      }),
      new ScatterplotLayer({
        id: "highlight-pulse",
        data: pulseData,
        getPosition: (d: any) => d.position,
        radiusUnits: "pixels",
        filled: false,
        stroked: true,
        getRadius: 12 + phase * 22,
        getLineColor: [0, 120, 255, Math.max(20, Math.floor((1 - phase) * 180))],
        getLineWidth: 2,
        updateTriggers: { getRadius: [phase], getLineColor: [phase] },
        pickable: false,
          wrapLongitude: false,
      })
    );
  }

  // ---------- HUMAN 3D ----------
  if (showHuman3D && humanCoords) {
    layers.push(
      new ScenegraphLayer({
        id: "human-3d",
        scenegraph: HUMAN_MODEL_URL,
        getPosition: () => [humanCoords[0], humanCoords[1], 0],
        sizeScale: 10,
        getOrientation: () => [0, 0, 0],
        pickable: true,
      })
    );
  }

  // ---------- SEARCH ----------
  const handleSearch = async () => {
    const q = searchQuery.trim();
    if (!q) return;
    setIsSearching(true);
    setSearchError(null);
    try {
      const results = await geocode(q);
      if (!results.length) {
        setSearchError("No se encontró la dirección");
        setSearchResults([]);
        return;
      }
      setSearchResults(results);
      if (results.length === 1) {
        const r = results[0];
        setSelectedResult(r);
        setSearchQuery(r.name || `${r.lat},${r.lon}`);
        setSearchResults([]);
        setViewState({
          ...viewState,
          longitude: r.lon,
          latitude: r.lat,
          zoom: Math.max(viewState.zoom || 11, 14),
        });
      }
    } catch (err: any) {
      setSearchError(err.message || "Error de geocodificación");
    } finally {
      setIsSearching(false);
    }
  };

  const selectSearchResult = (r: GeocodeResult) => {
    setSelectedResult(r);
    setSearchQuery(r.name || `${r.lat},${r.lon}`);
    setSearchResults([]);
    setViewState({
      ...viewState,
      longitude: r.lon,
      latitude: r.lat,
      zoom: Math.max(viewState.zoom || 11, 14),
    });
  };

  const onMapLoad = (evt: any) => {
    try {
      if (evt?.target?.setMaxBounds) evt.target.setMaxBounds(MAP_BOUNDS);
    } catch {}
  };

  // ---------- CSV POLYGON UPLOAD ----------
  const handleCsvPolygonLoaded = (csvText: string, options?: { invert?: boolean }) => {
    try {
      // Detect WKT content: many lines starting with POLYGON/MULTIPOLYGON or the text contains POLYGON
      const isWkt = /\b(POLYGON|MULTIPOLYGON)\b/i.test(csvText);
      if (isWkt) {
        // Parse all WKT features from text
        const fc = parseWktsToFeatureCollection(csvText);
        if (!fc.features || fc.features.length === 0) {
          alert('No se encontraron POLYGON/MULTIPOLYGON en el archivo.');
          return;
        }

        // Build bbox features index (lightweight) to render quickly
        const bboxFeatures: any[] = [];
        const records: Record<string, any> = {};
        for (let i = 0; i < fc.features.length; i++) {
          const f = fc.features[i];
          const id = `wkt-${i}`;
          // compute bbox
          let coordsArr: number[][] = [];
          if (f.geometry.type === 'Polygon') {
            coordsArr = (f.geometry.coordinates && f.geometry.coordinates[0]) || [];
          } else if (f.geometry.type === 'MultiPolygon') {
            coordsArr = (f.geometry.coordinates && f.geometry.coordinates[0] && f.geometry.coordinates[0][0]) || [];
          }
          if (!coordsArr || coordsArr.length === 0) continue;
          let minX = Number.POSITIVE_INFINITY, minY = Number.POSITIVE_INFINITY, maxX = Number.NEGATIVE_INFINITY, maxY = Number.NEGATIVE_INFINITY;
          for (const c of coordsArr) {
            const x = Number(c[0]); const y = Number(c[1]);
            if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
            if (x < minX) minX = x; if (y < minY) minY = y; if (x > maxX) maxX = x; if (y > maxY) maxY = y;
          }
          if (!Number.isFinite(minX)) continue;
          const bboxPoly = {
            type: 'Feature',
            properties: { __wkt_id: id },
            geometry: {
              type: 'Polygon',
              coordinates: [[[minX, minY],[maxX, minY],[maxX, maxY],[minX, maxY],[minX, minY]]]
            }
          };
          bboxFeatures.push(bboxPoly);
          records[id] = f; // store full feature
        }

  const bboxFc: FeatureCollection = { type: 'FeatureCollection', features: bboxFeatures };
        // Build a lightweight GeoJsonLayer for bboxes
        const bboxFcNorm = normalizeFeatureCollectionToView(bboxFc, viewState?.longitude);
        const bboxLayer = new GeoJsonLayer({
          id: 'wkt-bboxes',
          data: bboxFcNorm,
          filled: true,
          getFillColor: [0, 200, 0, 30],
          stroked: true,
          getLineColor: [0, 120, 255, 180],
          lineWidthMinPixels: 1,
          wrapLongitude: false,
          pickable: true,
        });
        setWktIndex({ bboxFeatureCollection: bboxFc, records });
        setCsvPolygonLayer(bboxLayer);
        // clear any selected detailed polygon
        setWktSelectedLayer(null);
        return;
      }

      const { coords, errors } = parseLatLonCsv(csvText);
      if (errors.length) {
        console.warn('CSV parsing warnings:', errors.join(' | '));
      }
      if (coords.length < 3) {
        alert('El archivo CSV debe contener al menos 3 coordenadas (lat, lon)');
        return;
      }
      const fixed = options?.invert ? coords.map(([lon, lat]) => [lat, lon] as [number, number]) : coords;
      const fc = coordsToPolygonFeatureCollection(fixed);
      const fcNorm = normalizeFeatureCollectionToView(fc, viewState?.longitude);
      const layer = new GeoJsonLayer({
        id: 'csv-polygon',
        data: fcNorm,
        filled: true,
        getFillColor: [0, 200, 0, 120],
        stroked: true,
        getLineColor: [0, 120, 255, 255],
        lineWidthMinPixels: 2,
        pickable: true,
        wrapLongitude: false,
        parameters: { depthTest: false },
      });
      setCsvPolygonLayer(layer);

      // Fit view to polygon extent
  const lons = fixed.map(c => c[0]);
  const lats = fixed.map(c => c[1]);
      const west = Math.min(...lons);
      const east = Math.max(...lons);
      const south = Math.min(...lats);
      const north = Math.max(...lats);
      setViewState({
        ...viewState,
        longitude: (west + east) / 2,
        latitude: (south + north) / 2,
        zoom: Math.max(viewState.zoom || 11, 13),
      });
    } catch (e) {
      console.error('Error al procesar CSV:', e);
      alert('No se pudo procesar el CSV. Ver consola para más detalles.');
    }
  };

  // (removed unused helper: checkAndOpenStreetView)

  // ---------- AREA SELECTED (from MapView onAreaDrawn) ----------
  const handleAreaSelected = async (geojson: FeatureCollection<Geometry>) => {
    // extra: obtener perímetro como [{lat, lon}, ...] (removed unused variable)

    const data = await analyzeArea(geojson);
    if (data) {
      const optimizedLayer = new GeoJsonLayer({
        id: "optimized-areas",
        data,
        filled: true,
        getFillColor: [0, 200, 0, 100],
        stroked: true,
        getLineColor: [0, 150, 0, 180],
        pickable: true,
        wrapLongitude: false,
        parameters: { depthTest: false },
      });
      setCustomLayer(optimizedLayer);
    }
  };

  // ---------- RENDER ----------
  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw" }}>
      <Sidebar
        active={activeVis}
        onSelect={setActiveVis}
        layer={layer}
        onLayerChange={setLayer}
        cellSize={cellSize}
        onCellSizeChange={setCellSize}
        clusterRadius={clusterRadius}
        onClusterRadiusChange={setClusterRadius}
        maxHeight={maxHeight}
        onMaxHeightChange={setMaxHeight}
        budget={budget}
        onBudgetChange={setBudget}
        maxParques={maxParques}
        onMaxParquesChange={setMaxParques}
        maxEscuelas={maxEscuelas}
        onMaxEscuelasChange={setMaxEscuelas}
        onCsvPolygonLoaded={handleCsvPolygonLoaded}
      />

      <div style={{ position: "relative", flex: 1 }}>
        <MapView
          viewState={viewState}
          onViewStateChange={(vs: any) => setViewState(clampViewState(vs))}
          layers={layers}
          mapMode={mapMode}
          is3D={is3D}
          onMapLoad={onMapLoad}
          onFeatureClick={(features, map, clickInfo) => {
            try {
              if (!features || !features.length) {
                setFeaturePopup(null);
                return;
              }
              const f = features[0];
              // If this feature is one of our bbox placeholders, load full polygon
              const wktId = f?.properties && f.properties.__wkt_id;
              if (wktId && wktIndex && wktIndex.records && wktIndex.records[wktId]) {
                const full = wktIndex.records[wktId];
                const fullNorm = normalizeFeatureCollectionToView(full, viewState?.longitude);
                const layer = new GeoJsonLayer({
                  id: `wkt-selected-${wktId}`,
                  data: fullNorm,
                  filled: true,
                  getFillColor: [0, 200, 0, 120],
                  stroked: true,
                  getLineColor: [0, 120, 255, 255],
                  lineWidthMinPixels: 2,
                  pickable: true,
                  wrapLongitude: false,
                  parameters: { depthTest: false },
                });
                setWktSelectedLayer(layer);
                // replace bbox layer with selected detailed layer
                setCsvPolygonLayer(layer);
                // remove bbox fc to avoid confusion in UI
                setWktIndex({ ...(wktIndex || {}), bboxFeatureCollection: null });
                return;
              }
              const name =
                (f.properties && (f.properties.name || f.properties.label || f.properties.title)) ||
                f.text ||
                f.place_name ||
                (f.properties && JSON.stringify(f.properties)) ||
                "Feature";
              // Derive a safe [lon, lat]
              let lon: number = viewState.longitude;
              let lat: number = viewState.latitude;
              const clickCoord = (clickInfo && (clickInfo.coordinate || clickInfo.lngLat)) || null;
              if (
                Array.isArray(clickCoord) &&
                typeof clickCoord[0] === "number" &&
                typeof clickCoord[1] === "number"
              ) {
                lon = clickCoord[0];
                lat = clickCoord[1];
              } else {
                const geom = f && f.geometry;
                const coords = geom && (geom as any).coordinates;
                if (
                  geom && (geom as any).type === "Point" &&
                  Array.isArray(coords) &&
                  typeof coords[0] === "number" &&
                  typeof coords[1] === "number"
                ) {
                  lon = coords[0];
                  lat = coords[1];
                }
              }

              let px: number | null = null;
              let py: number | null = null;
              if (clickInfo && typeof clickInfo.x === "number" && typeof clickInfo.y === "number") {
                px = clickInfo.x;
                py = clickInfo.y;
              } else if (map && typeof map.project === "function") {
                try {
                  const p = map.project([lon, lat]);
                  px = p.x;
                  py = p.y;
                } catch {
                  px = null;
                }
              }

              setFeaturePopup({
                lng: Number(lon),
                lat: Number(lat),
                title: name,
                details: f,
                screenX: px ?? 12,
                screenY: py ?? 72,
              } as any);
            } catch {
              setFeaturePopup(null);
            }
          }}
          onAreaDrawn={handleAreaSelected}
        />

        {/* Loading / Error overlays */}
        {loading && (
          <div
            style={{
              position: "absolute",
              top: 20,
              left: "50%",
              transform: "translateX(-50%)",
              background: "rgba(255,255,255,0.9)",
              padding: "8px 12px",
              borderRadius: 6,
              zIndex: 99,
            }}
          >
            Analizando área seleccionada...
          </div>
        )}
        {error && (
          <div
            style={{
              position: "absolute",
              top: 20,
              left: "50%",
              transform: "translateX(-50%)",
              background: "#ffdddd",
              padding: "8px 12px",
              borderRadius: 6,
              zIndex: 99,
            }}
          >
            {error}
          </div>
        )}

        {/* Search + Controls */}
        <div
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            zIndex: 10,
            background: "rgba(255,255,255,0.95)",
            padding: 8,
            borderRadius: 6,
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Buscar dirección..."
              style={{ padding: "6px 8px", width: 220 }}
            />
            <button onClick={handleSearch} disabled={isSearching || !searchQuery.trim()}>
              {isSearching ? "Buscando..." : "Ir"}
            </button>
          </div>

          {searchResults && searchResults.length > 0 && (
            <div style={{ position: "relative", marginBottom: 8 }}>
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  width: 300,
                  background: "#fff",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                  borderRadius: 6,
                  maxHeight: 220,
                  overflow: "auto",
                  zIndex: 50,
                }}
              >
                {searchResults.map((r, idx) => (
                  <div
                    key={idx}
                    onClick={() => selectSearchResult(r)}
                    style={{ padding: "8px", borderBottom: "1px solid #eee", cursor: "pointer" }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{r.name}</div>
                    <div style={{ fontSize: 12, color: "#666" }}>
                      {r.lat.toFixed(5)}, {r.lon.toFixed(5)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {searchError && (
            <div style={{ color: "crimson", fontSize: 12, marginBottom: 6 }}>{searchError}</div>
          )}

          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <button onClick={() => setMapMode(mapMode === "streets" ? "satellite" : "streets")}>
              {mapMode === "streets" ? "Satélite" : "Mapa"}
            </button>
            <button
              onClick={() => {
                if (is3D) {
                  setSavedCamera({ pitch: viewState.pitch, bearing: viewState.bearing });
                  setViewState({ ...viewState, pitch: 0, bearing: 0 });
                  setIs3D(false);
                } else {
                  setViewState({
                    ...viewState,
                    pitch: savedCamera?.pitch ?? 45,
                    bearing: savedCamera?.bearing ?? 0,
                  });
                  setIs3D(true);
                }
              }}
            >
              {is3D ? "3D" : "2D"}
            </button>
            <button
              onClick={() =>
                setViewState({
                  ...viewState,
                  zoom: Math.min((viewState.zoom || 11) + 1, INITIAL_VIEW_STATE.maxZoom),
                })
              }
            >
              +
            </button>
            <button
              onClick={() =>
                setViewState({
                  ...viewState,
                  zoom: Math.max((viewState.zoom || 11) - 1, INITIAL_VIEW_STATE.minZoom),
                })
              }
            >
              -
            </button>
            <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input
                type="checkbox"
                checked={showGrid}
                onChange={(e) => setShowGrid(e.target.checked)}
              />
              Grid
            </label>
          </div>
        </div>

        {/* Street View removed */}

        {/* Popup de feature */}
        {featurePopup && (() => {
          const sx = Math.max(8, Math.min((featurePopup.screenX ?? 12), window.innerWidth - 380));
          const sy = Math.max(8, Math.min((featurePopup.screenY ?? 72), window.innerHeight - 260));
          return (
            <div style={{ position: "absolute", left: sx, top: sy, zIndex: 60, width: 360 }}>
              <div
                style={{
                  background: "white",
                  padding: 12,
                  borderRadius: 8,
                  boxShadow: "0 4px 14px rgba(0,0,0,0.18)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{featurePopup.title}</div>
                    <div style={{ fontSize: 12, color: "#555" }}>
                      {featurePopup.lat.toFixed(5)}, {featurePopup.lng.toFixed(5)}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => {
                        try {
                          const text = JSON.stringify(featurePopup.details || {}, null, 2);
                          if (navigator.clipboard) navigator.clipboard.writeText(text);
                        } catch {}
                      }}
                    >
                      Copiar JSON
                    </button>
                    <button onClick={() => setFeaturePopup(null)}>Cerrar</button>
                  </div>
                </div>

                <div style={{ marginTop: 10, maxHeight: 220, overflow: "auto" }}>
                  {featurePopup.details && featurePopup.details.properties ? (
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <tbody>
                        {Object.entries(featurePopup.details.properties).map(([k, v]) => (
                          <tr key={k} style={{ borderBottom: "1px solid #f0f0f0" }}>
                            <td
                              style={{
                                padding: "6px 8px",
                                fontSize: 13,
                                color: "#333",
                                width: "40%",
                                verticalAlign: "top",
                              }}
                            >
                              <strong>{k}</strong>
                            </td>
                            <td style={{ padding: "6px 8px", fontSize: 13, color: "#444" }}>
                              {String(v)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <pre style={{ fontSize: 12, color: "#333", whiteSpace: "pre-wrap" }}>
                      {JSON.stringify(featurePopup.details || {}, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}