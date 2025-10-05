import React, { useState } from "react";
import DeckGL from "@deck.gl/react";
import { GeoJsonLayer } from "@deck.gl/layers";
import StaticMap from "react-map-gl/maplibre";
import maplibregl from "maplibre-gl";
import { WebMercatorViewport } from '@deck.gl/core';

const MAPTILER_KEY = process.env.REACT_APP_MAPTILER_KEY;

const INITIAL_VIEW_STATE = {
  longitude: -100.316116 , // MTY
  latitude: 25.686613,
  zoom: 11,
  pitch: 45,
  bearing: 0,
  minZoom: 10,
  maxZoom: 16,
};

const MAP_BOUNDS = [
  [-100.5, 25.4], // suroeste
  [-100.1, 25.9], // noreste
];

function App() {
  // If the user hasn't set a MapTiler key, fall back to a public demo style.
  const mapStyle = MAPTILER_KEY
    ? `https://api.maptiler.com/maps/streets/style.json?key=${MAPTILER_KEY}`
    : "https://demotiles.maplibre.org/style.json";

  const [is3D, setIs3D] = useState(true);
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  const [showGrid, setShowGrid] = useState(false);
  const [fixedGrid, setFixedGrid] = useState(true);
  const [size, setSize] = useState({ width: typeof window !== 'undefined' ? window.innerWidth : 800, height: typeof window !== 'undefined' ? window.innerHeight : 600 });

  // update size on window resize so grid covers the visible area
  React.useEffect(() => {
    const handler = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  // Clamp a viewState's center to MAP_BOUNDS (format: [[west,south],[east,north]])
  const clampViewState = (vs: any) => {
    try {
      const lon = typeof vs.longitude === 'number' ? vs.longitude : INITIAL_VIEW_STATE.longitude;
      const lat = typeof vs.latitude === 'number' ? vs.latitude : INITIAL_VIEW_STATE.latitude;
      const [[west, south], [east, north]] = MAP_BOUNDS;

      const clampedLon = Math.max(Math.min(lon, east), west);
      const clampedLat = Math.max(Math.min(lat, north), south);

      return {
        ...vs,
        longitude: clampedLon,
        latitude: clampedLat,
      };
    } catch (err) {
      return vs;
    }
  };

  const baseLayer = new GeoJsonLayer({
    id: "base-layer",
    data: "https://raw.githubusercontent.com/visgl/deck.gl-data/master/examples/geojson/vancouver-blocks.json",
    filled: is3D,
    extruded: is3D,
    // When in 2D, return 0 elevation so features are flat
    getElevation: (f: any) => (is3D ? f.properties.valuePerSqm * 0.1 : 0),
    getFillColor: [255, 140, 0, 180],
    pickable: true,
  });

  const layers = [baseLayer];

  // Generate grid GeoJSON of square cells (cellSizeKm x cellSizeKm) within MAP_BOUNDS
  const cellSizeKm = 1.5;

  

  // Generate grid as LineString features (vertical and horizontal) to avoid gaps
  const generateGridLines = (bounds: number[][], cellKm: number, refLat: number, alignToGlobal = true, paddingCells = 1) => {
    let [[west, south], [east, north]] = bounds.map(b => b.slice()) as number[][];
    const metersPerDegLat = 111320;
    const latRad = (refLat * Math.PI) / 180;
    const metersPerDegLon = Math.abs(Math.cos(latRad) * metersPerDegLat);

  const latDelta = (cellKm * 1000) / metersPerDegLat;
  const lonDelta = (cellKm * 1000) / metersPerDegLon;

  // expand bounds by paddingCells to avoid visible gaps while panning
  west = west - lonDelta * paddingCells;
  east = east + lonDelta * paddingCells;
  south = south - latDelta * paddingCells;
  north = north + latDelta * paddingCells;

    const features: any[] = [];
    // choose starts so grid aligns globally when requested
    let startLon = west;
    let startLat = south;
    if (alignToGlobal) {
      // anchor to a stable global origin (0 lon/0 lat)
      const originLon = 0;
      const originLat = 0;
      startLon = Math.floor((west - originLon) / lonDelta) * lonDelta + originLon;
      startLat = Math.floor((south - originLat) / latDelta) * latDelta + originLat;
    }

    // vertical lines (constant lon, varying lat)
    for (let lon = startLon; lon <= east + lonDelta / 2; lon += lonDelta) {
      const x = lon;
      if (x < west - 1e-12) continue;
      const xc = Math.min(x, east);
      features.push({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: [
            [xc, south],
            [xc, north]
          ]
        }
      });
      if (x >= east) break;
    }

    // horizontal lines (constant lat, varying lon)
    for (let lat = startLat; lat <= north + latDelta / 2; lat += latDelta) {
      const y = lat;
      if (y < south - 1e-12) continue;
      const yc = Math.min(y, north);
      features.push({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: [
            [west, yc],
            [east, yc]
          ]
        }
      });
      if (y >= north) break;
    }

    return { type: 'FeatureCollection', features };
  };

  // Determine visible bounds from DeckGL viewport (falls back to MAP_BOUNDS)
  const getVisibleBounds = (): number[][] => {
    try {
      const vp = new WebMercatorViewport({
        ...viewState,
        width: size.width,
        height: size.height,
      });
      const b = vp.getBounds();
      // vp.getBounds() may return [west, south, east, north] or [[w,s],[e,n]] depending
      if (!b) return MAP_BOUNDS;
      if (Array.isArray(b[0])) {
        // [[w,s],[e,n]]
        return b as unknown as number[][];
      }
      // [w,s,e,n]
      const arr = b as number[];
      const w = arr[0];
      const s = arr[1];
      const e = arr[2];
      const n = arr[3];
      return [[w, s], [e, n]];
    } catch (err) {
      return MAP_BOUNDS;
    }
  };

  const visibleBounds = getVisibleBounds();

  // If fixedGrid is enabled, create a large, memoized global grid once and reuse it so
  // panning doesn't change the grid alignment vertically/horizontally. Otherwise use dynamic visible grid.
  const globalGridData: any = React.useMemo(() => {
    if (!showGrid || !fixedGrid) return null;
    // compute a larger bbox by expanding MAP_BOUNDS by N cells
    const refLat = INITIAL_VIEW_STATE.latitude;
    const metersPerDegLat = 111320;
    const latDelta = (cellSizeKm * 1000) / metersPerDegLat;
    const latPad = latDelta * 50; // expand by ~50 cells vertically

    // For longitude pad, use refLat
    const metersPerDegLon = Math.abs(Math.cos((refLat * Math.PI) / 180) * metersPerDegLat);
    const lonDelta = (cellSizeKm * 1000) / metersPerDegLon;
    const lonPad = lonDelta * 50; // expand by ~50 cells horizontally

    const [[w, s], [e, n]] = MAP_BOUNDS;
    const bigBounds: number[][] = [[w - lonPad, s - latPad], [e + lonPad, n + latPad]];
    return generateGridLines(bigBounds, cellSizeKm, refLat, true, 0);
  }, [showGrid, fixedGrid, cellSizeKm]);

  const dynamicGridData: any = React.useMemo(() => {
    if (!showGrid || fixedGrid) return null;
    return generateGridLines(visibleBounds, cellSizeKm, viewState.latitude || INITIAL_VIEW_STATE.latitude, false, 1);
  }, [showGrid, fixedGrid, visibleBounds, cellSizeKm, viewState.latitude]);

  const gridData: any = fixedGrid ? globalGridData : dynamicGridData;

  // Build final layers array; grid layer typed as any to avoid strict type mismatch
  const allLayers: any[] = [...layers];
  if (showGrid && gridData) {
    const gridLayer: any = new GeoJsonLayer({
      id: 'grid-layer',
      data: gridData,
      stroked: true,
      filled: false,
      getLineColor: [255, 0, 0, 80],
      lineWidthUnits: 'pixels',
      getLineWidth: 1,
      pickable: false,
    });
    allLayers.push(gridLayer);
  }

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh" }}>
      <DeckGL
        viewState={viewState}
        onViewStateChange={({ viewState: vs }: any) => {
          const bounded = clampViewState(vs);
          setViewState(bounded);
        }}
        controller={{
          // always allow panning with left mouse drag
          dragPan: true,
          // disable left-drag rotation so left-drag always pans even in 3D
          dragRotate: false,
          // enable scroll zoom
          scrollZoom: true,
        }}
  layers={allLayers}
        getTooltip={({ object }: any) => object && `${object.properties && object.properties.name}`}
      >
        <StaticMap
          reuseMaps
          mapLib={maplibregl}
          mapStyle={mapStyle}
          onLoad={(evt: any) => {
            try {
              // evt.target is the underlying maplibre map instance
              if (evt && evt.target && typeof evt.target.setMaxBounds === 'function') {
                evt.target.setMaxBounds(MAP_BOUNDS);
              }
            } catch (err) {
              // ignore runtime errors setting bounds
              // console.warn('Failed to set map bounds', err);
            }
          }}
          // prevent the StaticMap from capturing pointer events so DeckGL interactions work smoothly
          style={{ pointerEvents: "none" }}
        />
      </DeckGL>
      <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 10 }}>
        <div style={{ background: 'rgba(255,255,255,0.9)', padding: 8, borderRadius: 6, boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>
          <button
            onClick={() => {
              if (is3D) {
                // switch to 2D: set pitch to 0
                setViewState({ ...viewState, pitch: 0, bearing: 0 });
                setIs3D(false);
              } else {
                // switch to 3D: restore pitch
                setViewState({ ...viewState, pitch: 45 });
                setIs3D(true);
              }
            }}
            style={{ padding: '6px 10px', cursor: 'pointer' }}
          >
            {is3D ? 'Cambiar a 2D' : 'Cambiar a 3D'}
          </button>
          <div style={{ marginTop: 8 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} />
              <span style={{ fontSize: 12 }}>Mostrar cuadricula 1.5km</span>
            </label>
          </div>
          <div style={{ marginTop: 8 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={fixedGrid} onChange={(e) => setFixedGrid(e.target.checked)} />
              <span style={{ fontSize: 12 }}>Alinear cuadricula globalmente (fija)</span>
            </label>
          </div>
          {is3D && (
            <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
              <button
                onClick={() => setViewState({ ...viewState, bearing: (viewState.bearing || 0) - 15 })}
                style={{ padding: '6px 8px', cursor: 'pointer' }}
              >
                ⟲
              </button>
              <button
                onClick={() => setViewState({ ...viewState, bearing: (viewState.bearing || 0) + 15 })}
                style={{ padding: '6px 8px', cursor: 'pointer' }}
              >
                ⟳
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
