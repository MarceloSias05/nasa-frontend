import React, { useMemo, useState } from "react";
import MapView from "./components/MapView";
import Sidebar from "./components/Sidebar/Sidebar";
import { GeoJsonLayer, ScatterplotLayer } from "@deck.gl/layers";
import { ScenegraphLayer } from "@deck.gl/mesh-layers";
import type { FeatureCollection, LineString, Point, Polygon } from "geojson";
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
  const [streetViewOpen, setStreetViewOpen] = useState(false);
  const [streetViewCoords, setStreetViewCoords] = useState<[number, number] | null>(null);
  const [showHuman3D, setShowHuman3D] = useState(false);
  const [humanCoords, setHumanCoords] = useState<[number, number] | null>(null);
  const [featurePopup, setFeaturePopup] = useState<{ lng: number; lat: number; title: string; details?: any; screenX?: number; screenY?: number } | null>(null);
  const [animTime, setAnimTime] = useState<number>(0);
  const [customLayer, setCustomLayer] = useState<any | null>(null);

  const { analyzeArea, result, loading, error } = useAreaAnalysis();

  // ---------- AREA SELECTION ----------
  const handleAreaSelected = async (polygon: FeatureCollection<Polygon>) => {
    const data = await analyzeArea(polygon);
    if (data) {
      const optimizedLayer = new GeoJsonLayer({
        id: "optimized-areas",
        data,
        filled: true,
        getFillColor: [0, 200, 0, 100],
        stroked: true,
        getLineColor: [0, 150, 0, 180],
        pickable: true,
      });
      setCustomLayer(optimizedLayer);
    }
  };

  // ---------- ANIMATION ----------
  React.useEffect(() => {
    let raf = 0 as unknown as number;
    const tick = (t: number) => {
      setAnimTime(t);
      raf = requestAnimationFrame(tick);
    };
    if (selectedResult || featurePopup) raf = requestAnimationFrame(tick);
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
        getElevation: (f: any) => (is3D ? f.properties.valuePerSqm * 0.1 : 0),
        getFillColor: [255, 140, 0, 180],
        pickable: true,
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
        pickable: false,
      })
    );
  }

  // ---------- CUSTOM LAYER (backend output) ----------
  if (customLayer) layers.push(customLayer);

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
          onFeatureClick={(features) => {
            // Aquí podrías invocar handleAreaSelected cuando tengas geometría
            // de área dibujada. Por ahora, mantenemos clicks para popups.
            if (features && features[0] && features[0].geometry?.type === "Polygon") {
              handleAreaSelected({
                type: "FeatureCollection",
                features,
              } as FeatureCollection<Polygon>);
            }
          }}
        />

        {/* 🔹 Overlay de carga o error */}
        {loading && (
          <div style={{
            position: "absolute", top: 20, left: "50%", transform: "translateX(-50%)",
            background: "rgba(255,255,255,0.9)", padding: "8px 12px", borderRadius: 6, zIndex: 99
          }}>
            Analizando área seleccionada...
          </div>
        )}
        {/* 🔹 Search y controles del mapa */}
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

          {searchError && (
            <div style={{ color: "crimson", fontSize: 12, marginBottom: 6 }}>
              {searchError}
            </div>
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
                  setViewState({ ...viewState, pitch: savedCamera?.pitch ?? 45, bearing: savedCamera?.bearing ?? 0 });
                  setIs3D(true);
                }
              }}
            >
              {is3D ? "3D" : "2D"}
            </button>
            <button onClick={() => setViewState({ ...viewState, zoom: (viewState.zoom || 11) + 1 })}>+</button>
            <button onClick={() => setViewState({ ...viewState, zoom: (viewState.zoom || 11) - 1 })}>-</button>
            <button onClick={checkAndOpenStreetView}>Street View</button>
            <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} />
              Grid
            </label>
          </div>
        </div>

        {/* 🔹 Ventana Street View */}
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
        {error && (
          <div style={{
            position: "absolute", top: 20, left: "50%", transform: "translateX(-50%)",
            background: "#ffdddd", padding: "8px 12px", borderRadius: 6, zIndex: 99
          }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
