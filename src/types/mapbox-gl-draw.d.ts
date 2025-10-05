declare module "@mapbox/mapbox-gl-draw" {
  import type { IControl, Map } from "maplibre-gl";

  export interface DrawFeature {
    id: string;
    type: "Feature";
    geometry: {
      type: string;
      coordinates: any[];
    };
    properties: Record<string, any>;
  }

  export interface DrawFeatureCollection {
    type: "FeatureCollection";
    features: DrawFeature[];
  }

  export default class MapboxDraw implements IControl {
    constructor(options?: any);
    onAdd(map: Map): HTMLElement;
    onRemove(map: Map): void;
    getAll(): DrawFeatureCollection;
    deleteAll(): void;
  }
}
