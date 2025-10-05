import React, { useMemo, useState } from 'react';
import MapView from './components/MapView';
import { GeoJsonLayer } from '@deck.gl/layers';
import { ScenegraphLayer } from '@deck.gl/mesh-layers';
import { MAP_BOUNDS, HUMAN_MODEL_URL, INITIAL_VIEW_STATE, CELL_SIZE_KM } from './config';
import { clampViewState, generateGridLines } from './utils/mapUtils';
import { geocode } from './services/geocoding';

export default function App(): React.ReactElement {
  const [mapMode, setMapMode] = useState<'streets' | 'satellite'>('streets');
  const [is3D, setIs3D] = useState(true);
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE as any);
  const [showGrid, setShowGrid] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  // searchResults state removed (no UI yet). Keep selectedResult for marker.
  const [selectedResult, setSelectedResult] = useState<any | null>(null);
  const [streetViewOpen, setStreetViewOpen] = useState(false);
  const [streetViewCoords, setStreetViewCoords] = useState<[number, number] | null>(null);
  const [showHuman3D, setShowHuman3D] = useState(false);
  const [humanCoords, setHumanCoords] = useState<[number, number] | null>(null);

  const baseLayer = useMemo(
    () =>
      new GeoJsonLayer({ id: 'base-layer', data: 'https://raw.githubusercontent.com/visgl/deck.gl-data/master/examples/geojson/vancouver-blocks.json', filled: is3D, extruded: is3D, getElevation: (f: any) => (is3D ? f.properties.valuePerSqm * 0.1 : 0), getFillColor: [255, 140, 0, 180], pickable: true }),
    [is3D]
  );

  const layers: any[] = [baseLayer];

  const gridData = useMemo(() => {
    if (!showGrid) return null;
    const [[w, s], [e, n]] = MAP_BOUNDS as any;
    const padCells = Math.max(20, Math.round(100 / Math.max(1, viewState.zoom || INITIAL_VIEW_STATE.zoom)));
    const latPad = ((CELL_SIZE_KM * 1000) / 111320) * padCells;
    const metersPerDegLon = Math.abs(Math.cos((viewState.latitude * Math.PI) / 180) * 111320);
    const lonPad = ((CELL_SIZE_KM * 1000) / metersPerDegLon) * padCells;
    const bigBounds = [[w - lonPad, s - latPad], [e + lonPad, n + latPad]];
    return generateGridLines(bigBounds, CELL_SIZE_KM, viewState.latitude || INITIAL_VIEW_STATE.latitude, true, 0);
  }, [showGrid, viewState.zoom, viewState.latitude]);

  if (showGrid && gridData) layers.push(new GeoJsonLayer({ id: 'grid-layer', data: gridData, stroked: true, filled: false, getLineColor: [255, 0, 0, 80], lineWidthUnits: 'pixels', getLineWidth: 1, pickable: false } as any));

  if (selectedResult) {
    const marker = { type: 'FeatureCollection', features: [{ type: 'Feature', geometry: { type: 'Point', coordinates: [selectedResult.lon, selectedResult.lat] }, properties: {} }] };
    layers.push(new GeoJsonLayer({ id: 'search-marker', data: marker, pointRadiusMinPixels: 6, getFillColor: [0, 120, 255, 200], stroked: true } as any));
  }

  if (showHuman3D && humanCoords) layers.push(new ScenegraphLayer({ id: 'human-3d', scenegraph: HUMAN_MODEL_URL, getPosition: () => [humanCoords[0], humanCoords[1], 0], sizeScale: 10, getOrientation: () => [0, 0, 0], pickable: true } as any));

  const handleSearch = async () => {
    const q = (searchQuery || '').trim();
    if (!q) return;
    setIsSearching(true);
    setSearchError(null);
    try {
      const results = await geocode(q);
      if (!results.length) {
        setSearchError('No se encontró la dirección');
        return;
      }
      setSelectedResult(results[0]);
      setViewState({ ...viewState, longitude: results[0].lon, latitude: results[0].lat, zoom: Math.max(viewState.zoom || 11, 14) });
    } catch (err: any) {
      setSearchError(err.message || 'Error de geocodificación');
    } finally {
      setIsSearching(false);
    }
  };

  const onMapLoad = (evt: any) => { try { if (evt && evt.target && typeof evt.target.setMaxBounds === 'function') evt.target.setMaxBounds(MAP_BOUNDS); } catch (err) {} };

  const checkAndOpenStreetView = () => {
    const lon = viewState.longitude;
    const lat = viewState.latitude;
    if (typeof lon !== 'number' || typeof lat !== 'number') return;
    setStreetViewCoords([lon, lat]);
    setStreetViewOpen(true);
  };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <MapView viewState={viewState} onViewStateChange={(vs: any) => setViewState(clampViewState(vs))} layers={layers} mapMode={mapMode} onMapLoad={onMapLoad} />

      {/* Controls */}
      <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 10, background: 'rgba(255,255,255,0.95)', padding: 8, borderRadius: 6 }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
          <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }} placeholder="Buscar dirección..." style={{ padding: '6px 8px', width: 220 }} />
          <button onClick={() => handleSearch()} disabled={isSearching || !searchQuery.trim()}>{isSearching ? 'Buscando...' : 'Ir'}</button>
        </div>
        {searchError && <div style={{ color: 'crimson', fontSize: 12, marginBottom: 6 }}>{searchError}</div>}
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setMapMode(mapMode === 'streets' ? 'satellite' : 'streets')}>{mapMode === 'streets' ? 'Satélite' : 'Mapa'}</button>
          <button onClick={() => setIs3D((v) => !v)}>{is3D ? '3D' : '2D'}</button>
          <button onClick={() => setViewState({ ...viewState, zoom: Math.min((viewState.zoom || 11) + 1, INITIAL_VIEW_STATE.maxZoom) })}>+</button>
          <button onClick={() => setViewState({ ...viewState, zoom: Math.max((viewState.zoom || 11) - 1, INITIAL_VIEW_STATE.minZoom) })}>-</button>
          <button onClick={() => checkAndOpenStreetView()}>Street View</button>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}><input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} />Grid</label>
        </div>
      </div>

      {streetViewOpen && streetViewCoords && (
        <div style={{ position: 'absolute', bottom: 12, left: 12, width: 480, height: 360, zIndex: 20, background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.3)', borderRadius: 6, overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', background: '#f5f5f5' }}>
            <div style={{ fontSize: 13 }}>Street View</div>
            <div><button onClick={() => setStreetViewOpen(false)}>Cerrar</button></div>
          </div>
          <iframe title="street-view" style={{ width: '100%', height: '100%', border: 0 }} src={`https://www.google.com/maps?q=&layer=c&cbll=${streetViewCoords[1]},${streetViewCoords[0]}&cbp=11,0,0,0,0`} />
        </div>
      )}

      <div style={{ position: 'absolute', left: 12, bottom: 12, zIndex: 15 }}>
        <div style={{ background: 'rgba(255,255,255,0.95)', padding: 6, borderRadius: 6 }}>
          {!showHuman3D ? (
            <button title="Mostrar humano" onClick={() => { const [[west, south]] = MAP_BOUNDS as any; setHumanCoords([west + 0.02, south + 0.02]); setShowHuman3D(true); }}>🧍</button>
          ) : (
            <button title="Quitar humano" onClick={() => { setShowHuman3D(false); setHumanCoords(null); }}>✖</button>
          )}
        </div>
      </div>
    </div>
  );
}
