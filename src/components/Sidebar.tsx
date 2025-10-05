import React from 'react';

type Props = {
  active?: string;
  onSelect?: (id: string) => void;
  layer?: string;
  onLayerChange?: (layer: string) => void;
  cellSize?: number;
  onCellSizeChange?: (v: number) => void;
  clusterRadius?: number;
  onClusterRadiusChange?: (v: number) => void;
  maxHeight?: number;
  onMaxHeightChange?: (v: number) => void;
};

const VIS = [
  { id: 'hexbin', title: 'Hexbin/Grid', subtitle: 'Concentración de población', icon: 'M200,40H56A16,16,0,0,0,40,56V200a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V56A16,16,0,0,0,200,40Zm0,80H136V56h64ZM120,56v64H56V56ZM56,136h64v64H56Zm144,64H136V136h64v64Z' },
  { id: 'cluster', title: 'Cluster Markers', subtitle: 'Datos puntuales (centroides)', icon: 'M128,64a40,40,0,1,0,40,40A40,40,0,0,0,128,64Zm0,64a24,24,0,1,1,24-24A24,24,0,0,1,128,128Zm0-112a88.1,88.1,0,0,0-88,88c0,31.4,14.51,64.68,42,96.25a254.19,254.19,0,0,0,41.45,38.3,8,8,0,0,0,9.18,0A254.19,254.19,0,0,0,174,200.25c27.45-31.57,42-64.85,42-96.25A88.1,88.1,0,0,0,128,16Z' },
  { id: 'extrusion', title: 'Extrusión 3D', subtitle: 'Altura proporcional a población', icon: 'M223.68,66.15,135.68,18h0a15.88,15.88,0,0,0-15.36,0l-88,48.17a16,16,0,0,0-8.32,14v95.64a16,16,0,0,0,8.32,14l88,48.17a15.88,15.88,0,0,0,15.36,0l88-48.17a16,16,0,0,0,8.32-14V80.18A16,16,0,0,0,223.68,66.15Z' },
  { id: 'isochrones', title: 'Isochrones', subtitle: 'Accesibilidad a hospitales', icon: 'M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Z' },
  { id: 'voronoi', title: 'Diagramas de Voronoi', subtitle: 'Zonas de influencia', icon: 'M174.63,81.37a80,80,0,1,0-93.26,93.26,80,80,0,1,0,93.26-93.26Z' },
];

const Sidebar: React.FC<Props> = ({ active = 'hexbin', onSelect, layer = 'Población', onLayerChange, cellSize = 50, onCellSizeChange, clusterRadius = 75, onClusterRadiusChange, maxHeight = 25, onMaxHeightChange }) => {
  return (
    <aside className="w-80 flex-shrink-0 border-r border-primary/20 dark:border-primary/30 overflow-y-auto bg-[#071826] text-slate-200">
      <div className="p-4">
        <div className="flex items-center gap-3 px-2 pb-3">
          <div className="h-8 w-8 rounded bg-primary flex items-center justify-center text-white">CI</div>
          <h1 className="text-lg font-semibold">City Insights</h1>
        </div>

        <h2 className="px-2 pb-3 text-xl font-bold text-slate-100">Visualizaciones</h2>
        <div className="space-y-2">
          {VIS.map((v) => (
            <button
              key={v.id}
              onClick={() => onSelect && onSelect(v.id)}
              className={`group w-full text-left flex items-center gap-3 rounded-lg p-3 transition-colors ${
                active === v.id
                  ? 'bg-[#0b4a5b] text-white border-l-4 border-primary pl-4'
                  : 'hover:bg-primary/10 text-slate-200'
              }`}>
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${active === v.id ? 'bg-white text-primary' : 'bg-[#0e3b45] text-primary'}`}>
                <svg fill="currentColor" height="20" viewBox="0 0 256 256" width="20" xmlns="http://www.w3.org/2000/svg"><path d={v.icon} /></svg>
              </div>
              <div>
                <p className="font-semibold">{v.title}</p>
                <p className="text-sm text-slate-400">{v.subtitle}</p>
              </div>
            </button>
          ))}
        </div>

        <h2 className="px-2 py-4 text-xl font-bold text-slate-100">Controles de Capa</h2>
        <div className="space-y-4 px-2 pb-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300" htmlFor="layer-select">Capa</label>
            <select
              id="layer-select"
              value={layer}
              onChange={(e) => onLayerChange && onLayerChange(e.target.value)}
              className="form-select w-full rounded-lg border-primary/30 bg-[#0b3340] text-slate-100 focus:border-primary focus:ring-primary p-2">
              <option>Población</option>
              <option>Viviendas</option>
              <option>Servicios</option>
            </select>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-sm font-medium text-slate-300" htmlFor="cell-size">Tamaño de celda</label>
              <span className="text-sm text-slate-400">{cellSize}</span>
            </div>
            <input id="cell-size" className="w-full h-2 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary" max={100} min={10} type="range" value={cellSize} onChange={(e) => onCellSizeChange && onCellSizeChange(Number(e.target.value))} />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-sm font-medium text-slate-300" htmlFor="cluster-radius">Radio de cluster</label>
              <span className="text-sm text-slate-400">{clusterRadius}</span>
            </div>
            <input id="cluster-radius" className="w-full h-2 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary" max={150} min={10} type="range" value={clusterRadius} onChange={(e) => onClusterRadiusChange && onClusterRadiusChange(Number(e.target.value))} />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-sm font-medium text-slate-300" htmlFor="max-height">Altura máxima</label>
              <span className="text-sm text-slate-400">{maxHeight}</span>
            </div>
            <input id="max-height" className="w-full h-2 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary" max={50} min={5} type="range" value={maxHeight} onChange={(e) => onMaxHeightChange && onMaxHeightChange(Number(e.target.value))} />
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
