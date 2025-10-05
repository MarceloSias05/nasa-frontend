import React from 'react';
import DeckGL from '@deck.gl/react';
import StaticMap from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import { MAPTILER_KEY } from '../config';

interface MapViewProps {
  viewState: any;
  onViewStateChange: (vs: any) => void;
  layers: any[];
  mapMode: 'streets' | 'satellite';
  is3D?: boolean;
  onMapLoad?: (evt: any) => void;
  // called with (featuresArray, mapInstance, clickInfo)
  onFeatureClick?: (features: any[], map?: any, clickInfo?: any) => void;
}

const MapView: React.FC<MapViewProps> = ({ viewState, onViewStateChange, layers, mapMode, is3D = true, onMapLoad, onFeatureClick }) => {
  const mapStyle = (() => {
    if (MAPTILER_KEY) {
      if (mapMode === 'satellite') return `https://api.maptiler.com/maps/hybrid/style.json?key=${MAPTILER_KEY}`;
      return `https://api.maptiler.com/maps/streets/style.json?key=${MAPTILER_KEY}`;
    }
    return 'https://demotiles.maplibre.org/style.json';
  })();

  // keep a ref to the underlying MapLibre map for feature queries
  let mapRef: any = null;

  const handleMapLoad = (evt: any) => {
    mapRef = evt?.target || null;
    if (onMapLoad) onMapLoad(evt);
  };

  const handleClick = (info: any, event: any) => {
    try {
      // if DeckGL picked an object (from a layer), prefer that
      if (info && info.object) {
        if (onFeatureClick) onFeatureClick([info.object], mapRef, info);
        return;
      }

      // otherwise, try queryRenderedFeatures on MapLibre
      if (mapRef && typeof mapRef.queryRenderedFeatures === 'function') {
        const px = Math.round(info.x);
        const py = Math.round(info.y);
        const features = mapRef.queryRenderedFeatures([px, py]);
        if (features && features.length) {
          if (onFeatureClick) onFeatureClick(features, mapRef, info);
          return;
        }
      }
      // nothing found
      if (onFeatureClick) onFeatureClick([], mapRef, info);
    } catch (err) {
      if (onFeatureClick) onFeatureClick([], mapRef, info);
    }
  };

  return (
    <DeckGL
      viewState={viewState}
      onViewStateChange={({ viewState: vs }: any) => onViewStateChange(vs)}
      controller={{ dragPan: true, dragRotate: Boolean(is3D), scrollZoom: true, doubleClickZoom: true, touchRotate: Boolean(is3D) }}
      layers={layers}
      onClick={handleClick}
    >
      <StaticMap reuseMaps mapLib={maplibregl} mapStyle={mapStyle} style={{ pointerEvents: 'auto' }} onLoad={handleMapLoad} />
    </DeckGL>
  );
};

export default MapView;
