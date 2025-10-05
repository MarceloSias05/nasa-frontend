import React, { useEffect, useRef } from "react";
import DeckGL from "@deck.gl/react";
import StaticMap from "react-map-gl/maplibre";
import maplibregl from "maplibre-gl";
import MapboxDraw from "maplibre-gl-draw";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import { MAPTILER_KEY } from "../config";

interface MapViewProps {
  viewState: any;
  onViewStateChange: (vs: any) => void;
  layers: any[];
  mapMode: "streets" | "satellite";
  is3D?: boolean;
  onMapLoad?: (evt: any) => void;
  onFeatureClick?: (features: any[], map?: any, clickInfo?: any) => void;
  onAreaDrawn?: (geojson: GeoJSON.FeatureCollection) => void; // Callback al dibujar un área
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
}) => {
  const mapContainerRef = useRef<any>(null);
  const drawRef = useRef<MapboxDraw | null>(null);

  // Define el estilo base
  const mapStyle = (() => {
    if (MAPTILER_KEY) {
      if (mapMode === "satellite")
        return `https://api.maptiler.com/maps/hybrid/style.json?key=${MAPTILER_KEY}`;
      return `https://api.maptiler.com/maps/streets/style.json?key=${MAPTILER_KEY}`;
    }
    return "https://demotiles.maplibre.org/style.json";
  })();

  // Mantén referencia al mapa base
  const handleMapLoad = (evt: any) => {
    const map = evt?.target;
    if (!map) return;
    mapContainerRef.current = map;

    // Inicializa Draw control si aún no existe
    if (!drawRef.current) {
      const draw = new MapboxDraw({
        displayControlsDefault: false,
        controls: {
          polygon: true,
          trash: true,
        },
        defaultMode: "simple_select",
      });
      drawRef.current = draw;
      map.addControl(draw);

      // Escucha eventos de dibujo
      map.on("draw.create", (e: any) => {
        const data = draw.getAll();
        if (onAreaDrawn && data?.features?.length) {
          onAreaDrawn(data as unknown as GeoJSON.FeatureCollection);
        }
      });
      map.on("draw.update", (e: any) => {
        const data = draw.getAll();
        if (onAreaDrawn && data?.features?.length) {
          onAreaDrawn(data as unknown as GeoJSON.FeatureCollection);
        }
      });
       map.on("draw.delete", () => {
        if (onAreaDrawn) {
          onAreaDrawn({ type: "FeatureCollection", features: [] } as GeoJSON.FeatureCollection);
        }
      });
    }

    if (onMapLoad) onMapLoad(evt);
  };

  // Maneja clics del mapa (DeckGL y MapLibre)
  const handleClick = (info: any, event: any) => {
    const map = mapContainerRef.current;
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

  return (
    <DeckGL
      viewState={viewState}
      onViewStateChange={({ viewState: vs }: any) => onViewStateChange(vs)}
      controller={{
        dragPan: true,
        dragRotate: Boolean(is3D),
        scrollZoom: true,
        doubleClickZoom: true,
        touchRotate: Boolean(is3D),
      }}
      layers={layers}
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
  );
};

export default MapView;