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
  onMapLoad?: (evt: any) => void;
}

const MapView: React.FC<MapViewProps> = ({ viewState, onViewStateChange, layers, mapMode, onMapLoad }) => {
  const mapStyle = (() => {
    if (MAPTILER_KEY) {
      if (mapMode === 'satellite') return `https://api.maptiler.com/maps/hybrid/style.json?key=${MAPTILER_KEY}`;
      return `https://api.maptiler.com/maps/streets/style.json?key=${MAPTILER_KEY}`;
    }
    return 'https://demotiles.maplibre.org/style.json';
  })();

  return (
    <DeckGL
      viewState={viewState}
      onViewStateChange={({ viewState: vs }: any) => onViewStateChange(vs)}
      controller={{ dragPan: true, dragRotate: false, scrollZoom: true }}
      layers={layers}
    >
      <StaticMap reuseMaps mapLib={maplibregl} mapStyle={mapStyle} style={{ pointerEvents: 'none' }} onLoad={onMapLoad} />
    </DeckGL>
  );
};

export default MapView;
