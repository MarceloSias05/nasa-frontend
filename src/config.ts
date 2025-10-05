export const MAPTILER_KEY = process.env.REACT_APP_MAPTILER_KEY;
export const GOOGLE_MAPS_KEY = process.env.REACT_APP_GOOGLE_MAPS_KEY || '';
export const HUMAN_MODEL_URL = 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/CesiumMan/glTF-Binary/CesiumMan.glb';

export const INITIAL_VIEW_STATE = {
  longitude: -100.316116,
  latitude: 25.686613,
  zoom: 11,
  pitch: 45,
  bearing: 0,
  minZoom: 4,
  maxZoom: 22,
};

export const MAP_BOUNDS: [number, number][] = [
  [-100.5, 25.4],
  [-100.1, 25.9],
];

export const CELL_SIZE_KM = 1.5;
