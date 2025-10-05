// src/App.tsx
import React, { useMemo, useState, useEffect } from "react";
import MapView from "./components/MapView";
import Sidebar from "./components/Sidebar/Sidebar";
import { GeoJsonLayer, ScatterplotLayer } from "@deck.gl/layers";
import { HexagonLayer } from '@deck.gl/aggregation-layers';
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
import usePopulation from './hooks/usePopulation';
import useEducation from './hooks/useEducation';
// removed unused urbanQuality import
// removed unused polygonToLatLon import
import { parseLatLonCsv, coordsToPolygonFeatureCollection } from "./utils/csv";
import { parseWktsToFeatureCollection } from "./utils/wkt";
import HistoryPage from './components/HistoryPage';

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

  // Hexagon visualization controls
  const [hexRadius, setHexRadius] = useState<number>(80);
  const [hexElevationScale, setHexElevationScale] = useState<number>(300);

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
  // removed unused wktSelectedLayer state
  const [originalCsvFc, setOriginalCsvFc] = useState<any | null>(null);
  const [uploadedCsvText, setUploadedCsvText] = useState<string | null>(null);
  const [freezeUploaded, setFreezeUploaded] = useState<boolean>(false);

  const { analyzeArea, loading, error } = useAreaAnalysis();
  const [apiPopulationEnabled, setApiPopulationEnabled] = useState<boolean>(false);
  const [apiEducationEnabled, setApiEducationEnabled] = useState<boolean>(false);

  // derive bbox from MAP_BOUNDS: [[w,s],[e,n]]
  const [[wBound, sBound], [eBound, nBound]] = MAP_BOUNDS as any;
  const { data: apiPopulation } = usePopulation(sBound, nBound, wBound, eBound);
  const { data: apiEducation } = useEducation(sBound, nBound, wBound, eBound);

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [showSaveModal, setShowSaveModal] = useState<boolean>(false);
  const [saveNote, setSaveNote] = useState<string>('');

  // loadPopulation replaced by API-driven loading via usePopulation + effect

  // When API population is enabled and data arrives, build a HexagonLayer
  useEffect(() => {
    try {
      if (!apiPopulation || !apiPopulationEnabled) return;
      const pts = (apiPopulation || []).filter((r: any) => Number.isFinite(r.lon) && Number.isFinite(r.lat))
        .map((r: any) => ({ position: [Number(r.lon), Number(r.lat)], pob: Number(r.POBTOT ?? r.pobtot ?? 0) }));

      if (!pts.length) return;

      // Green color ramp from light (low) to dark (high)
      const colorRange = [
        [232, 245, 233], // green50
        [200, 230, 201], // green100
        [165, 214, 167], // green200
        [129, 199, 132], // green300
        [102, 187, 106], // green400
        [76, 175, 80],   // green500
        [56, 142, 60],   // green600
        [46, 125, 50],   // green700
        [27, 94, 32]     // green900 (dark)
      ];

      const getWeight = (d: any) => Math.log10((d.pob || 0) + 1);

      const hexLayer = new HexagonLayer({
        id: 'population-hex-api',
        data: pts,
        getPosition: (d: any) => d.position,
        getWeight,
        radius: hexRadius,
  elevationRange: [0, 1000],
        elevationScale: is3D ? hexElevationScale : 0,
        extruded: !!is3D,
        colorRange,
        opacity: 0.95,
        pickable: true,
        lowerPercentile: 5,
        upperPercentile: 100,
        coverage: 1,
      });
      setCustomLayer(hexLayer);
    } catch (e) {
      console.warn('Error building hex layer from API data', e);
    }
  }, [apiPopulation, apiPopulationEnabled, hexRadius, hexElevationScale, is3D]);

  // Build education scatter layer (cluster markers) when enabled
  useEffect(() => {
    try {
      if (!apiEducation || !apiEducationEnabled) return;
      const pts = (apiEducation || []).filter((r: any) => Number.isFinite(r.lon) && Number.isFinite(r.lat))
        .map((r: any) => ({ position: [Number(r.lon), Number(r.lat)], grade: Number(r.GRAPROES ?? 0) }));
      if (!pts.length) return;
      const maxGrade = Math.max(...pts.map((p) => p.grade || 0), 1);
      const scatter = new ScatterplotLayer({
        id: 'education-cluster',
        data: pts,
        getPosition: (d: any) => d.position,
        getFillColor: (d: any) => {
          // map grade to green intensity
          const t = Math.max(0, Math.min(1, (d.grade || 0) / maxGrade));
          const g = Math.round(120 + t * 135); // 120..255
          return [30, g, 30, 200];
        },
        getRadius: (d: any) => 30 + (d.grade || 0) * 6,
        radiusScale: 1,
        pickable: true,
        opacity: 0.9,
      });
      setCustomLayer(scatter);
    } catch (e) {
      console.warn('Error building education scatter layer', e);
    }
  }, [apiEducation, apiEducationEnabled]);

  const saveHistory = (note?: string) => {
    try {
      const key = 'urban_history_v1';
      const raw = localStorage.getItem(key);
      const arr = raw ? JSON.parse(raw) : [];
      const entry = { ts: new Date().toISOString(), note: note || 'snapshot', view: viewState };
      arr.push(entry);
      localStorage.setItem(key, JSON.stringify(arr));
      // quick toast-like confirmation
      try {
        // create ephemeral element
        const el = document.createElement('div');
        el.textContent = 'Historial guardado';
        Object.assign(el.style, { position: 'fixed', bottom: '18px', right: '18px', background: '#0b74c9', color: '#fff', padding: '8px 12px', borderRadius: '6px', zIndex: 9999 });
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 1800);
      } catch {}
    } catch (e) {
      console.error('saveHistory error', e);
    }
  };

  const submitHistory = async () => {
    const entry = { ts: new Date().toISOString(), note: saveNote || 'snapshot', view: viewState };
    try {
      // try sending to backend
      await (await import('./api')).postHistory(entry);
      // success toast
      const el = document.createElement('div');
      el.textContent = 'Enviado al servidor';
      Object.assign(el.style, { position: 'fixed', bottom: '18px', right: '18px', background: '#2e7d32', color: '#fff', padding: '8px 12px', borderRadius: '6px', zIndex: 9999 });
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 1800);
    } catch (e) {
      // fallback to localStorage
      saveHistory(saveNote || 'snapshot');
    } finally {
      setShowSaveModal(false);
      setSaveNote('');
    }
  };

  // Normalize feature collections to the current view center (stable via useCallback)
  const normalizeFeatureCollectionToView = React.useCallback(
    (fc: any, centerLon: number | undefined) => {
      const normalizeLon = (lon: number, centerLonInner: number) => {
        if (!Number.isFinite(lon) || !Number.isFinite(centerLonInner)) return lon;
        let out = lon;
        while (out - centerLonInner > 180) out -= 360;
        while (out - centerLonInner < -180) out += 360;
        return out;
      };
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
    },
    []
  );

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

  // Re-normalize and rebuild CSV / WKT-bbox layer when view center changes
  useEffect(() => {
    try {
      // If freeze is enabled, do not re-normalize or rebuild layers
      if (freezeUploaded) return;

      // If there's an original CSV feature collection, rebuild polygon layer
      if (originalCsvFc) {
        const fcNorm = normalizeFeatureCollectionToView(originalCsvFc, viewState?.longitude);
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
        return;
  }

      // Otherwise if we have a WKT bbox collection, rebuild that layer normalized to view
      if (wktIndex && wktIndex.bboxFeatureCollection) {
        const bboxNorm = normalizeFeatureCollectionToView(wktIndex.bboxFeatureCollection, viewState?.longitude);
        const layer = new GeoJsonLayer({
          id: 'wkt-bboxes',
          data: bboxNorm,
          filled: true,
          getFillColor: [0, 200, 0, 30],
          stroked: true,
          getLineColor: [0, 120, 255, 180],
          lineWidthMinPixels: 1,
          wrapLongitude: false,
          pickable: true,
        });
        setCsvPolygonLayer(layer);
      }
    } catch (err) {
      // swallow errors in normalization effect
      // console.warn('Normalization effect error', err);
    }
  }, [viewState?.longitude, originalCsvFc, wktIndex, normalizeFeatureCollectionToView, freezeUploaded]);

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

  // Execute result layer (LLM returned lon/lats)
  const [executeLayer, setExecuteLayer] = useState<any | null>(null);

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
  if (executeLayer) layers.push(executeLayer);

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
    // store raw CSV text for Execute payload
    setUploadedCsvText(csvText);
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
  // clear any selected detailed polygon (no-op)
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
  // keep original fc so we can re-normalize on view changes
  setOriginalCsvFc(fc);
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
  if (!isAuthenticated) {
    const Login = require('./components/Login').default;
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }
  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw" }}>
      <Sidebar
        active={activeVis}
        onSelect={(key: string) => {
          if (key === 'load-population') {
            // zoom out to minimum before loading
            setViewState((vs: any) => clampViewState({ ...vs, zoom: (INITIAL_VIEW_STATE as any).minZoom }));
            // enable API population loader (will populate customLayer via effect)
            setApiPopulationEnabled(true);
            return;
          }
          if (key === 'save-history') {
            // open modal to ask for a note before saving
            setShowSaveModal(true);
            return;
          }
          if (key === 'cluster') {
            // Toggle education clustering visualization
            setApiEducationEnabled((v) => !v);
            return;
          }
          setActiveVis(key);
        }}
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
        freezeUploaded={freezeUploaded}
        onFreezeToggle={(v: boolean) => setFreezeUploaded(v)}
        hexRadius={hexRadius}
        onHexRadiusChange={setHexRadius}
        hexElevationScale={hexElevationScale}
        onHexElevationScaleChange={setHexElevationScale}
        onLoadHistoryEntry={(entry: any) => {
          try {
            if (entry && entry.view) {
              setViewState({ ...viewState, ...entry.view });
            }
          } catch (e) {}
        }}
      />

      <div style={{ position: "relative", flex: 1 }}>
        {showSaveModal && (
          <div style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 420, background: '#fff', padding: 16, borderRadius: 8, boxShadow: '0 8px 40px rgba(0,0,0,0.3)' }}>
              <h3 style={{ marginTop: 0 }}>Guardar historial</h3>
              <div style={{ marginBottom: 8 }}>
                <input value={saveNote} onChange={(e) => setSaveNote(e.target.value)} placeholder="Nota (opcional)" style={{ width: '100%', padding: '8px 10px' }} />
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => { setShowSaveModal(false); setSaveNote(''); }}>Cancelar</button>
                <button onClick={() => submitHistory()} style={{ background: '#0b74c9', color: '#fff' }}>Guardar</button>
              </div>
            </div>
          </div>
        )}
        {activeVis === 'history' ? (
          <HistoryPage onOpen={(entry: any) => { try { if (entry && entry.view) setViewState({ ...viewState, ...entry.view }); } catch {} }} />
        ) : (
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
        )}

        {/* Execute button bottom-left */}
        <div style={{ position: 'absolute', left: 12, bottom: 12, zIndex: 9999 }}>
          <button
            onClick={async () => {
              try {
                // prepare polygon corners (only the exterior ring of originalCsvFc)
                if (!originalCsvFc || !originalCsvFc.features || !originalCsvFc.features.length) {
                  alert('No polygon loaded. Cargue un CSV con las coordenadas del polígono.');
                  return;
                }
                const poly = originalCsvFc.features[0];
                const coords = (poly.geometry && poly.geometry.coordinates && poly.geometry.coordinates[0]) || [];
                const corners = coords.map((c: any) => ({ lon: Number(c[0]), lat: Number(c[1]) }));
                // POST to the LLM endpoint (backend should proxy to the LLM)
                const payload = {
                  csv: uploadedCsvText,
                  budget,
                  maxParques,
                  maxEscuelas,
                  corners: corners.slice(0, corners.length - 1), // drop closing coord repeat if present
                };
                const resp = await fetch((window as any).__LLM_ENDPOINT_URL || '/api/v1/llm', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(payload),
                });
                if (!resp.ok) throw new Error('LLM request failed: ' + resp.status);
                const out = await resp.json();
                // expect out to be array of { lon, lat }
                if (!Array.isArray(out)) throw new Error('Invalid LLM response');
                const pts = out.filter((p: any) => Number.isFinite(p.lon) && Number.isFinite(p.lat))
                  .map((p: any) => ({ position: [Number(p.lon), Number(p.lat)] }));
                if (!pts.length) {
                  alert('El LLM no devolvió coordenadas válidas.');
                  return;
                }
                const scatter = new ScatterplotLayer({
                  id: 'execute-result',
                  data: pts,
                  getPosition: (d: any) => d.position,
                  getFillColor: [255, 0, 0, 200],
                  getRadius: 60,
                  pickable: true,
                });
                setExecuteLayer(scatter);
              } catch (e: any) {
                console.error('Execute error', e);
                alert('Error ejecutando: ' + (e?.message || e));
              }
            }}
            style={{ background: '#0b74c9', color: '#fff', padding: '8px 12px', borderRadius: 6, border: 'none' }}
          >
            Execute
          </button>
        </div>

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
            <button
              onClick={() => {
                // logout
                setIsAuthenticated(false);
                // reset view
                setViewState(INITIAL_VIEW_STATE as any);
              }}
              style={{ background: '#ef5350', color: '#fff' }}
            >
              Logout
            </button>
            {/* Horizontal longitude slider: move map left/right */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 8 }}>
              <label style={{ fontSize: 12, color: '#333' }}>Lon</label>
              <input
                type="range"
                min={-100.3005}
                max={-100.1830}
                step={0.0001}
                value={typeof viewState.longitude === 'number' ? Math.max(-100.3005, Math.min(-100.1830, viewState.longitude)) : (INITIAL_VIEW_STATE as any).longitude}
                onChange={(e) => {
                  const lonRaw = Number(e.target.value);
                  const lon = Math.max(-100.3005, Math.min(-100.1830, lonRaw));
                  setViewState(clampViewState({ ...viewState, longitude: lon }));
                }}
                style={{ width: 180 }}
              />
              <div style={{ minWidth: 72, fontSize: 12, color: '#333' }}>{(Math.max(-100.3005, Math.min(-100.1830, viewState.longitude ?? (INITIAL_VIEW_STATE as any).longitude))).toFixed(4)}</div>
            </div>

            {/* Horizontal latitude slider: move map up/down (bounded by specific limits) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 8 }}>
              <label style={{ fontSize: 12, color: '#333' }}>Lat</label>
              <input
                type="range"
                min={25.6182}
                max={25.7156}
                step={0.0001}
                value={typeof viewState.latitude === 'number' ? Math.max(25.6182, Math.min(25.7156, viewState.latitude)) : (INITIAL_VIEW_STATE as any).latitude}
                onChange={(e) => {
                  const latRaw = Number(e.target.value);
                  const lat = Math.max(25.6182, Math.min(25.7156, latRaw));
                  setViewState(clampViewState({ ...viewState, latitude: lat }));
                }}
                style={{ width: 180 }}
              />
              <div style={{ minWidth: 72, fontSize: 12, color: '#333' }}>{(Math.max(25.6182, Math.min(25.7156, viewState.latitude ?? (INITIAL_VIEW_STATE as any).latitude))).toFixed(4)}</div>
            </div>
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