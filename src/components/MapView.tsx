import React, { useState, useRef, useEffect } from "react";
import DeckGL from "@deck.gl/react";
import StaticMap from "react-map-gl/maplibre";
import maplibregl from "maplibre-gl";
import { EditableGeoJsonLayer } from "@nebula.gl/layers";
import { DrawPolygonMode } from "@nebula.gl/edit-modes";
import type { FeatureCollection, Geometry } from "geojson";
import { MAPTILER_KEY } from "../config";

interface MapViewProps {
  viewState: any;
  onViewStateChange: (vs: any) => void;
  layers: any[];
  mapMode: "streets" | "satellite";
  is3D?: boolean;
  onMapLoad?: (evt: any) => void;
  onAreaDrawn?: (geojson: FeatureCollection<Geometry>) => void;
  onFeatureClick?: (features: any[], map: any, clickInfo: any) => void;
}

const MapView: React.FC<MapViewProps> = ({
  viewState,
  onViewStateChange,
  layers,
  mapMode,
  is3D = true,
  onMapLoad,
  onAreaDrawn,
  onFeatureClick,
}) => {
  // Keep a ref to the underlying maplibre-gl map instance
  const mapRef = useRef<any>(null);

  const [drawMode, setDrawMode] = useState<any>(null);
  const [drawData, setDrawData] = useState<FeatureCollection<Geometry>>({
    type: "FeatureCollection",
    features: [],
  });

  const mapStyle = MAPTILER_KEY
    ? mapMode === "satellite"
      ? `https://api.maptiler.com/maps/hybrid/style.json?key=${MAPTILER_KEY}`
      : `https://api.maptiler.com/maps/streets/style.json?key=${MAPTILER_KEY}`
    : "https://demotiles.maplibre.org/style.json";

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "d") {
        // Store class reference without invoking it as updater
        setDrawMode(() => DrawPolygonMode);
      }
      if (e.key === "Escape") {
        setDrawMode(null);
      }
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, []);

  // Only enable edit interactions when a draw mode is active
  const editableLayer = new (EditableGeoJsonLayer as any)({
    id: "editable-layer",
    data: drawData,
    mode: drawMode,
    selectedFeatureIndexes: [],
    onEdit: ({ updatedData, editType }: any) => {
      setDrawData(updatedData as FeatureCollection<Geometry>);
      if (editType === "addFeature" && onAreaDrawn) {
        onAreaDrawn(updatedData as FeatureCollection<Geometry>);
      }
    },
    getFillColor: [0, 128, 255, 60],
    getLineColor: [0, 128, 255, 255],
    lineWidthMinPixels: 2,
    pickable: !!drawMode,
  });

  return (
    <DeckGL
      width="100%"
      height="100%"
      style={{ position: "absolute", inset: 0 }}
      viewState={viewState}
      onViewStateChange={({ viewState: vs }: any) => onViewStateChange(vs)}
      controller={{ dragPan: true, dragRotate: is3D, scrollZoom: true }}
  layers={[...layers, ...(drawMode ? [editableLayer] : [])]}
      onClick={(info: any, event: any) => {
        try {
          if (!onFeatureClick) return;
          const features: any[] = [];
          if (info && info.object) features.push(info.object);
          if (info && Array.isArray((info as any).pickingInfos)) {
            for (const pi of (info as any).pickingInfos) {
              if (pi && pi.object) features.push(pi.object);
            }
          }
          const clickInfo = {
            x: info?.x,
            y: info?.y,
            viewport: info?.viewport,
            coordinate: info?.coordinate,
            pixel: info?.pixel
          };
          onFeatureClick(features, mapRef.current, clickInfo);
        } catch {
          // no-op
        }
      }}
    >
      <StaticMap
        mapLib={maplibregl}
        mapStyle={mapStyle}
        reuseMaps
        style={{ width: "100%", height: "100%", pointerEvents: "auto" }}
        onLoad={(evt: any) => {
          try {
            // react-map-gl@8 maplibre variant passes the underlying map in event.target
            mapRef.current = evt?.target || evt?.map || null;
          } catch {
            mapRef.current = null;
          }
          if (onMapLoad) onMapLoad(evt);
        }}
      />
    </DeckGL>
  );
};

export default MapView;
