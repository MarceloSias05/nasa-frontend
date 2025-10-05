declare module 'react-map-gl' {
  import * as React from 'react';

  export interface StaticMapProps extends React.HTMLAttributes<HTMLDivElement> {
    reuseMaps?: boolean;
    mapLib?: any;
    mapStyle?: string | object;
  }

  export class StaticMap extends React.Component<StaticMapProps> {}

  const _default: any;
  export default _default;
}

declare module 'react-map-gl/maplibre' {
  import * as React from 'react';

  export interface StaticMapProps extends React.HTMLAttributes<HTMLDivElement> {
    reuseMaps?: boolean;
    mapLib?: any;
    mapStyle?: string | object;
  }

  const StaticMap: React.ComponentType<StaticMapProps>;
  export default StaticMap;
}
