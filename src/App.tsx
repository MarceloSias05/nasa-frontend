import React, { useMemo, useState } from "react";
import MapView from "./components/MapView";
import Sidebar from "./components/Sidebar/Sidebar";
import { GeoJsonLayer, ScatterplotLayer } from "@deck.gl/layers";
import { ScenegraphLayer } from "@deck.gl/mesh-layers";
import type { FeatureCollection, LineString, Point } from "geojson";
import {
  MAP_BOUNDS,
  HUMAN_MODEL_URL,
  INITIAL_VIEW_STATE,
  CELL_SIZE_KM,
} from "./config";
import { clampViewState, generateGridLines } from "./utils/mapUtils";
import { geocode } from "./services/geocoding";
import type { GeocodeResult } from "./services/geocoding";

export default function App(): React.ReactElement {
  const [mapMode, setMapMode] = useState<"streets" | "satellite">("streets");
  const [is3D, setIs3D] = useState(true);
  const [savedCamera, setSavedCamera] = useState<{pitch?: number; bearing?: number} | null>(null);
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE as any);
  const [showGrid, setShowGrid] = useState(false);
  const [activeVis, setActiveVis] = useState<string>("hexbin");
  const [layer, setLayer] = useState<string>("Población");
  const [cellSize, setCellSize] = useState<number>(50);
  const [clusterRadius, setClusterRadius] = useState<number>(75);
  const [maxHeight, setMaxHeight] = useState<number>(25);
  // New optimization parameters
  const [budget, setBudget] = useState<number>(300000);
  const [maxParques, setMaxParques] = useState<number>(10);
  const [maxEscuelas, setMaxEscuelas] = useState<number>(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<GeocodeResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<any | null>(null);
  const [streetViewOpen, setStreetViewOpen] = useState(false);
  const [streetViewCoords, setStreetViewCoords] = useState<[number, number] | null>(null);
  const [showHuman3D, setShowHuman3D] = useState(false);
  const [humanCoords, setHumanCoords] = useState<[number, number] | null>(null);
  const [featurePopup, setFeaturePopup] = useState<{lng: number; lat: number; title: string; details?: any; screenX?: number; screenY?: number} | null>(null);
  const [animTime, setAnimTime] = useState<number>(0);

  // lightweight animation loop only when there's a highlight target
  React.useEffect(() => {
    let raf = 0 as unknown as number;
    const tick = (t: number) => {
      setAnimTime(t);
      raf = requestAnimationFrame(tick);
    };
    if (selectedResult || featurePopup) {
      raf = requestAnimationFrame(tick);
    }
    return () => {
      if (raf) cancelAnimationFrame(raf);
    };
  }, [selectedResult, featurePopup]);

  // ---------- BASE LAYER ----------
  const baseLayer = useMemo(
    () =>
      new GeoJsonLayer({
        id: "base-layer",
        data: "https://raw.githubusercontent.com/visgl/deck.gl-data/master/examples/geojson/vancouver-blocks.json",
        filled: is3D,
        extruded: is3D,
        getElevation: (f: any) =>
          is3D ? f.properties.valuePerSqm * 0.1 : 0,
        getFillColor: [255, 140, 0, 180],
        pickable: true,
      }),
    [is3D]
  );

  const layers: any[] = [baseLayer];

  // ---------- GRID LAYER (fixed 1.5km cells anchored to MAP_BOUNDS) ----------
  // Generate the grid once from the fixed MAP_BOUNDS using CELL_SIZE_KM so the
  // grid stays in world coordinates and does not shift when zooming.
  const gridData = useMemo(() => {
    if (!showGrid) return null;
    const [[w, s], [e, n]] = MAP_BOUNDS as any;
    // Use the central latitude of the bounds as reference for degree<->meter conversion
    const refLat = (s + n) / 2;
    const bounds = [
      [w, s],
      [e, n],
    ];
  // Align grid to the city's original delimitations (use the bounds' min lon/lat
  // as the origin) so grid lines start exactly at the city's west/south edges.
  return generateGridLines(bounds, CELL_SIZE_KM, refLat, false, 0);
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
        pickable: false,
      })
    );
  }

  // ---------- SEARCH MARKER ----------
  if (selectedResult) {
    const marker: FeatureCollection<Point> = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [selectedResult.lon, selectedResult.lat],
          },
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
      })
    );
  }

  // ---------- HIGHLIGHT PULSE (visual impact, easy) ----------
  const highlightCoords: [number, number] | null = selectedResult
    ? [selectedResult.lon, selectedResult.lat]
    : featurePopup
      ? [featurePopup.lng, featurePopup.lat]
      : null;

  if (highlightCoords) {
    const phase = (animTime % 1000) / 1000; // 0..1 every ~1s
    const pulseData = [{ position: highlightCoords }];

    // Core dot
    layers.push(
      new ScatterplotLayer({
        id: 'highlight-core',
        data: pulseData,
        getPosition: (d: any) => d.position,
        radiusUnits: 'pixels',
        getRadius: 6,
        filled: true,
        getFillColor: [0, 120, 255, 240],
        stroked: true,
        getLineColor: [255, 255, 255, 230],
        lineWidthUnits: 'pixels',
        getLineWidth: 2,
        pickable: false,
      })
    );

    // Expanding ring
    layers.push(
      new ScatterplotLayer({
        id: 'highlight-pulse',
        data: pulseData,
        getPosition: (d: any) => d.position,
        radiusUnits: 'pixels',
        filled: false,
        stroked: true,
        getRadius: 12 + phase * 22, // 12px -> 34px
        getLineColor: [0, 120, 255, Math.max(20, Math.floor((1 - phase) * 180))],
        lineWidthUnits: 'pixels',
        getLineWidth: 2,
        updateTriggers: {
          getRadius: [phase],
          getLineColor: [phase],
        },
        pickable: false,
      })
    );
  }

  // ---------- HUMAN 3D MODEL ----------
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
      // show dropdown of results; if there's only one, auto-select it
      setSearchResults(results);
      if (results.length === 1) {
        const r = results[0];
        setSelectedResult(r);
        setSearchQuery(r.name || `${r.lat},${r.lon}`);
        setSearchResults([]);
        setViewState({ ...viewState, longitude: r.lon, latitude: r.lat, zoom: Math.max(viewState.zoom || 11, 14) });
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
    setViewState({ ...viewState, longitude: r.lon, latitude: r.lat, zoom: Math.max(viewState.zoom || 11, 14) });
  };

  // ---------- MAP BOUNDS ----------
  const onMapLoad = (evt: any) => {
    try {
      if (evt?.target?.setMaxBounds) evt.target.setMaxBounds(MAP_BOUNDS);
    } catch {}
  };

  // ---------- STREET VIEW ----------
  const checkAndOpenStreetView = () => {
    const lon = viewState.longitude;
    const lat = viewState.latitude;
    if (typeof lon !== "number" || typeof lat !== "number") return;
    setStreetViewCoords([lon, lat]);
    setStreetViewOpen(true);
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
              const name = (f.properties && (f.properties.name || f.properties.label || f.properties.title)) || f.text || f.place_name || (f.properties && JSON.stringify(f.properties)) || 'Feature';
              const coords = (f.geometry && f.geometry.coordinates) || (clickInfo && (clickInfo.coordinate || clickInfo.lngLat)) || null;
              const lon = coords ? coords[0] : viewState.longitude;
              const lat = coords ? coords[1] : viewState.latitude;

              // determine screen position: use clickInfo.x/y if present, else use map.project
              let px: number | null = null;
              let py: number | null = null;
              if (clickInfo && typeof clickInfo.x === 'number' && typeof clickInfo.y === 'number') {
                px = clickInfo.x;
                py = clickInfo.y;
              } else if (map && typeof map.project === 'function') {
                try {
                  const p = map.project([lon, lat]);
                  px = p.x;
                  py = p.y;
                } catch (e) {
                  px = null;
                }
              }

              setFeaturePopup({ lng: lon, lat: lat, title: name, details: f, screenX: px ?? 12, screenY: py ?? 72 } as any);
            } catch (err) {
              setFeaturePopup(null);
            }
          }}
        />

        {/* ---------- Search & Controls ---------- */}
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
            <button
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
            >
              {isSearching ? "Buscando..." : "Ir"}
            </button>
          </div>

          {/* Dropdown results */}
          {searchResults && searchResults.length > 0 && (
            <div style={{ position: 'relative', marginBottom: 8 }}>
              <div style={{ position: 'absolute', right: 0, width: 300, background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', borderRadius: 6, maxHeight: 220, overflow: 'auto', zIndex: 50 }}>
                {searchResults.map((r, idx) => (
                  <div key={idx} onClick={() => selectSearchResult(r)} style={{ padding: '8px', borderBottom: '1px solid #eee', cursor: 'pointer' }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{r.name}</div>
                    <div style={{ fontSize: 12, color: '#666' }}>{r.lat.toFixed(5)}, {r.lon.toFixed(5)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {searchError && (
            <div style={{ color: "crimson", fontSize: 12, marginBottom: 6 }}>
              {searchError}
            </div>
          )}

          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <button onClick={() => setMapMode(mapMode === "streets" ? "satellite" : "streets")}>
              {mapMode === "streets" ? "Satélite" : "Mapa"}
            </button>
            <button onClick={() => {
              // toggle 3D/2D: when switching to 2D save current pitch/bearing then flatten
              if (is3D) {
                setSavedCamera({ pitch: viewState.pitch, bearing: viewState.bearing });
                setViewState({ ...viewState, pitch: 0, bearing: 0 });
                setIs3D(false);
              } else {
                // restore saved camera if available
                setViewState({ ...viewState, pitch: savedCamera?.pitch ?? 45, bearing: savedCamera?.bearing ?? 0 });
                setIs3D(true);
              }
            }}>
              {is3D ? "3D" : "2D"}
            </button>
            <button
              onClick={() =>
                setViewState({
                  ...viewState,
                  zoom: Math.min(
                    (viewState.zoom || 11) + 1,
                    INITIAL_VIEW_STATE.maxZoom
                  ),
                })
              }
            >
              +
            </button>
            <button
              onClick={() =>
                setViewState({
                  ...viewState,
                  zoom: Math.max(
                    (viewState.zoom || 11) - 1,
                    INITIAL_VIEW_STATE.minZoom
                  ),
                })
              }
            >
              -
            </button>
            <button onClick={checkAndOpenStreetView}>Street View</button>
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

        {/* ---------- Street View Window ---------- */}
        {streetViewOpen && streetViewCoords && (
          <div
            style={{
              position: "absolute",
              bottom: 12,
              left: 12,
              width: 480,
              height: 360,
              zIndex: 20,
              background: "#fff",
              boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
              borderRadius: 6,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "6px 8px",
                background: "#f5f5f5",
              }}
            >
              <div style={{ fontSize: 13 }}>Street View</div>
              <button onClick={() => setStreetViewOpen(false)}>Cerrar</button>
            </div>
            <iframe
              title="street-view"
              style={{ width: "100%", height: "100%", border: 0 }}
              src={`https://www.google.com/maps?q=&layer=c&cbll=${streetViewCoords[1]},${streetViewCoords[0]}&cbp=11,0,0,0,0`}
            />
          </div>
        )}

        {/* ---------- Human 3D Button ---------- */}
        <div style={{ position: "absolute", left: 12, bottom: 12, zIndex: 15 }}>
          <div
            style={{
              background: "rgba(255,255,255,0.95)",
              padding: 6,
              borderRadius: 6,
            }}
          >
            {!showHuman3D ? (
              <button
                title="Mostrar humano"
                onClick={() => {
                  const [[west, south]] = MAP_BOUNDS as any;
                  setHumanCoords([west + 0.02, south + 0.02]);
                  setShowHuman3D(true);
                }}
              >
                🧍
              </button>
            ) : (
              <button
                title="Quitar humano"
                onClick={() => {
                  setShowHuman3D(false);
                  setHumanCoords(null);
                }}
              >
                ✖
              </button>
            )}
          </div>
        </div>
        {featurePopup && (() => {
            const sx = Math.max(8, Math.min((featurePopup.screenX ?? 12), window.innerWidth - 380));
            const sy = Math.max(8, Math.min((featurePopup.screenY ?? 72), window.innerHeight - 260));
            return (
              <div style={{ position: 'absolute', left: sx, top: sy, zIndex: 60, width: 360 }}>
                <div style={{ background: 'white', padding: 12, borderRadius: 8, boxShadow: '0 4px 14px rgba(0,0,0,0.18)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{featurePopup.title}</div>
                      <div style={{ fontSize: 12, color: '#555' }}>{featurePopup.lat.toFixed(5)}, {featurePopup.lng.toFixed(5)}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => {
                        try {
                          const text = JSON.stringify(featurePopup.details || {}, null, 2);
                          if (navigator.clipboard) navigator.clipboard.writeText(text);
                        } catch {}
                      }}>Copiar JSON</button>
                      <button onClick={() => setFeaturePopup(null)}>Cerrar</button>
                    </div>
                  </div>

                  <div style={{ marginTop: 10, maxHeight: 220, overflow: 'auto' }}>
                    {featurePopup.details && featurePopup.details.properties ? (
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <tbody>
                          {Object.entries(featurePopup.details.properties).map(([k, v]) => (
                            <tr key={k} style={{ borderBottom: '1px solid #f0f0f0' }}>
                              <td style={{ padding: '6px 8px', fontSize: 13, color: '#333', width: '40%', verticalAlign: 'top' }}><strong>{k}</strong></td>
                              <td style={{ padding: '6px 8px', fontSize: 13, color: '#444' }}>{String(v)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <pre style={{ fontSize: 12, color: '#333', whiteSpace: 'pre-wrap' }}>{JSON.stringify(featurePopup.details || {}, null, 2)}</pre>
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
