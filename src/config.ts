export const MAPTILER_KEY = process.env.REACT_APP_MAPTILER_KEY;
export const GOOGLE_MAPS_KEY = process.env.REACT_APP_GOOGLE_MAPS_KEY || '';
export const HUMAN_MODEL_URL = 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/CesiumMan/glTF-Binary/CesiumMan.glb';

export const INITIAL_VIEW_STATE = {
  longitude: -100.3161,
  latitude: 25.6866,
  zoom: 11,
  pitch: 45,
  bearing: 0,
  minZoom: 12,
  maxZoom: 20,
};

export const MAP_BOUNDS: [number, number][] = [
  [-100.43, 25.55], 
  [-100.05, 25.78], 
];

export const CELL_SIZE_KM = 1.5;
