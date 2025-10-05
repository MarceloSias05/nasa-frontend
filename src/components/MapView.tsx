import React, { useEffect, useMemo, useRef, useState } from "react";
import DeckGL from "@deck.gl/react";
import StaticMap from "react-map-gl/maplibre";
import maplibregl from "maplibre-gl";
import MapboxDraw from "maplibre-gl-draw";
import "maplibre-gl-draw/dist/mapbox-gl-draw.css";
import { GeoJsonLayer } from "@deck.gl/layers";
import type { FeatureCollection, Geometry } from "geojson";
import { MAPTILER_KEY } from "../config";

interface MapViewProps {
  viewState: any;
  onViewStateChange: (vs: any) => void;
  layers: any[];
  mapMode: "streets" | "satellite";
  is3D?: boolean;
  onMapLoad?: (evt: any) => void;
  onFeatureClick?: (features: any[], map?: any, clickInfo?: any) => void;
  onAreaDrawn?: (geojson: GeoJSON.FeatureCollection) => void;
  onError?: (message: string) => void;
}

const MapView: React.FC<MapViewProps> = ({
  viewState,
  onViewStateChange,
  layers,
  mapMode,
  is3D = true,
  onMapLoad,
  onFeatureClick,
  onAreaDrawn,
  onError,
}) => {
  const mapRef = useRef<any>(null);
  const drawRef = useRef<MapboxDraw | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const deckWrapperRef = useRef<HTMLDivElement>(null);
  const [drawPreview, setDrawPreview] = useState<FeatureCollection<Geometry> | null>(null);

  // Map style URL
  const mapStyle = (() => {
    if (MAPTILER_KEY) {
      return mapMode === "satellite"
        ? `https://api.maptiler.com/maps/hybrid/style.json?key=${MAPTILER_KEY}`
        : `https://api.maptiler.com/maps/streets/style.json?key=${MAPTILER_KEY}`;
    }
    return "https://demotiles.maplibre.org/style.json";
  })();

  // On map load: init draw once and wire events
  const handleMapLoad = (evt: any) => {
    const map = evt?.target;
    if (!map) return;
    mapRef.current = map;

    if (!drawRef.current) {
      const draw = new MapboxDraw({
        displayControlsDefault: false,
        // Enable default buttons so user can use the built-in UI
        controls: { polygon: true, trash: true },
        defaultMode: "simple_select",
      });
      drawRef.current = draw;
      map.addControl(draw, "top-left");

      // Draw events -> bubble up selection as FeatureCollection
      map.on("draw.create", () => {
        const data = draw.getAll();
        setDrawPreview(data as unknown as FeatureCollection<Geometry>);
        try {
          if (onAreaDrawn && data?.features?.length) {
            onAreaDrawn(data as unknown as GeoJSON.FeatureCollection);
          }
        } catch (err: any) {
          onError?.(err?.message || 'Network Error');
        }
        // stop drawing after first polygon
        setIsDrawing(false);
      });
      map.on("draw.update", () => {
        const data = draw.getAll();
        setDrawPreview(data as unknown as FeatureCollection<Geometry>);
        // no-op: evita llamadas repetidas al backend en edición continua
      });
      map.on("draw.render", () => {
        try {
          const data = draw.getAll();
          setDrawPreview(data as unknown as FeatureCollection<Geometry>);
        } catch {}
      });
      map.on("draw.delete", () => {
        setDrawPreview({ type: 'FeatureCollection', features: [] } as FeatureCollection<Geometry>);
        // no-op: no llamar backend en delete
        setIsDrawing(false);
      });

      // Track mode changes from the built-in controls (pentagon/trash)
      map.on('draw.modechange', (e: any) => {
        const mode = e?.mode || '';
        setIsDrawing(Boolean(mode && mode.startsWith('draw_')));
        // refresh preview on mode change as well
        try {
          const data = drawRef.current?.getAll();
          if (data) setDrawPreview(data as unknown as FeatureCollection<Geometry>);
        } catch {}
      });
    }

    if (onMapLoad) onMapLoad(evt);
  };

  // While drawing, let pointer events go through DeckGL canvas to MapLibre (so Draw can capture drag)
  useEffect(() => {
    // Only disable pointer events on the DeckGL canvas, not the whole container
    const root = deckWrapperRef.current;
    if (root) {
      const deckCanvas = root.querySelector('canvas.deckgl-canvas') as HTMLCanvasElement | null;
      if (deckCanvas) deckCanvas.style.pointerEvents = isDrawing ? 'none' : 'auto';
    }

    const map = mapRef.current;
    if (map && map.dragPan && map.scrollZoom && map.doubleClickZoom) {
      if (isDrawing) {
        try { map.dragPan.disable(); } catch {}
        try { map.scrollZoom.disable(); } catch {}
        try { map.doubleClickZoom.disable(); } catch {}
      } else {
        try { map.dragPan.enable(); } catch {}
        try { map.scrollZoom.enable(); } catch {}
        try { map.doubleClickZoom.enable(); } catch {}
      }
    }
  }, [isDrawing]);

  // Click picking: prefer DeckGL picked object, fallback to MapLibre features
  const handleClick = (info: any, event: any) => {
    const map = mapRef.current;
    try {
      if (info && info.object) {
        onFeatureClick?.([info.object], map, info);
        return;
      }
      if (map && typeof map.queryRenderedFeatures === "function") {
        const px = Math.round(info.x);
        const py = Math.round(info.y);
        const features = map.queryRenderedFeatures([px, py]);
        if (features && features.length) {
          onFeatureClick?.(features, map, info);
          return;
        }
      }
      onFeatureClick?.([], map, info);
    } catch (err) {
      onFeatureClick?.([], map, info);
    }
  };

  // Compose layers with a bright preview on top when drawing or when features exist
  const allLayers = useMemo(() => {
    const list = [...layers];
    if (drawPreview && drawPreview.features && drawPreview.features.length) {
      list.push(
        // Glow outline for attention
        new GeoJsonLayer({
          id: 'draw-preview-glow',
          data: drawPreview as any,
          filled: false,
          stroked: true,
          getLineColor: [0, 150, 255, 120],
          lineWidthUnits: 'pixels',
          getLineWidth: 6,
          pickable: false,
          updateTriggers: { data: [drawPreview] },
        }),
        new GeoJsonLayer({
          id: 'draw-preview-layer',
          data: drawPreview as any,
          filled: true,
          getFillColor: [0, 150, 255, 50],
          stroked: true,
          getLineColor: [0, 150, 255, 220],
          lineWidthUnits: 'pixels',
          getLineWidth: 2,
          pickable: false,
          // ensure it stays on top and updates when geometry changes
          updateTriggers: {
            data: [drawPreview],
          },
        })
      );
    }
    return list;
  }, [layers, drawPreview]);

  return (
    <div ref={deckWrapperRef} style={{ position: 'relative', width: '100%', height: '100%' }}>
    <DeckGL
      viewState={viewState}
      onViewStateChange={({ viewState: vs }: any) => onViewStateChange(vs)}
      controller={{
        dragPan: !isDrawing,
        dragRotate: !isDrawing && Boolean(is3D),
        scrollZoom: !isDrawing,
        doubleClickZoom: !isDrawing,
        touchRotate: !isDrawing && Boolean(is3D),
      }}
      layers={allLayers}
      onClick={handleClick}
    >
      <StaticMap
        reuseMaps
        mapLib={maplibregl}
        mapStyle={mapStyle}
        style={{ pointerEvents: "auto" }}
        onLoad={handleMapLoad}
      />
    </DeckGL>
    {/* Drawing controls overlay (outside DeckGL to remain clickable) */}
    <div
      style={{
        position: "absolute",
        top: 12,
        left: 12,
        zIndex: 1000,
        background: "rgba(255,255,255,0.9)",
        borderRadius: 6,
        boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
        padding: 4,
        display: "flex",
        gap: 6,
        pointerEvents: "auto",
      }}
    >
      <button
        title="Dibujar área"
        style={{ padding: "6px 8px" }}
        onClick={() => {
          if (drawRef.current) {
            drawRef.current.changeMode("draw_polygon");
            setIsDrawing(true);
          }
        }}
      >
        ⬠
      </button>
      <button
        title="Borrar áreas"
        style={{ padding: "6px 8px" }}
        onClick={() => {
          drawRef.current?.deleteAll();
          setIsDrawing(false);
        }}
      >
        🗑️
      </button>
    </div>
    {isDrawing && (
      <div
        style={{
          position: 'absolute',
          top: 60,
          left: 12,
          zIndex: 1000,
          background: 'rgba(0,0,0,0.7)',
          color: '#fff',
          padding: '8px 10px',
          borderRadius: 6,
          maxWidth: 300,
          pointerEvents: 'auto',
        }}
      >
        <div style={{ fontSize: 12, marginBottom: 6 }}>
          Modo dibujo activo: haz clic para agregar vértices. Doble clic para cerrar el polígono.
        </div>
        <button
          style={{ padding: '4px 8px', background: '#ef4444', color: '#fff', borderRadius: 4 }}
          onClick={() => {
            if (drawRef.current) {
              try { (drawRef.current as any).changeMode('simple_select'); } catch {}
            }
            setIsDrawing(false);
          }}
        >
          Cancelar
        </button>
      </div>
    )}
    </div>
  );
};

export default MapView;
