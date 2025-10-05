declare module '@deck.gl/layers' {
  export class GeoJsonLayer<TProps = any> {
    constructor(props: TProps);
  }
  export class ScatterplotLayer<TProps = any> {
    constructor(props: TProps);
  }
}

declare module '@deck.gl/mesh-layers' {
  export class ScenegraphLayer<TProps = any> {
    constructor(props: TProps);
  }
}

declare module '@deck.gl/react' {
  import React from 'react';
  const DeckGL: React.ComponentType<any>;
  export default DeckGL;
}

declare module '@deck.gl/core' {
  export const _deepEqual: (a: any, b: any, depth?: number) => boolean;
}