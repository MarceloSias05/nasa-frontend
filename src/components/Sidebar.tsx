import React from 'react';

const Sidebar: React.FC = () => {
  return (
    <aside className="w-80 flex-shrink-0 border-r border-primary/20 dark:border-primary/30 overflow-y-auto">
      <div className="p-4">
        <h2 className="px-2 pb-3 text-xl font-bold text-slate-900 dark:text-white">Visualizaciones</h2>
        <div className="space-y-1">
          <button className="group w-full text-left flex items-center gap-3 rounded-lg bg-primary/10 dark:bg-primary/20 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white">
              <svg fill="currentColor" height="24" viewBox="0 0 256 256" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M200,40H56A16,16,0,0,0,40,56V200a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V56A16,16,0,0,0,200,40Zm0,80H136V56h64ZM120,56v64H56V56ZM56,136h64v64H56Zm144,64H136V136h64v64Z"></path></svg>
            </div>
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">Hexbin/Grid</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Concentración de población</p>
            </div>
          </button>
          <button className="group w-full text-left flex items-center gap-3 rounded-lg p-3 hover:bg-primary/10 dark:hover:bg-primary/20">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20 dark:bg-primary/30 text-primary group-hover:bg-primary group-hover:text-white">
              <svg fill="currentColor" height="24" viewBox="0 0 256 256" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M128,64a40,40,0,1,0,40,40A40,40,0,0,0,128,64Zm0,64a24,24,0,1,1,24-24A24,24,0,0,1,128,128Zm0-112a88.1,88.1,0,0,0-88,88c0,31.4,14.51,64.68,42,96.25a254.19,254.19,0,0,0,41.45,38.3,8,8,0,0,0,9.18,0A254.19,254.19,0,0,0,174,200.25c27.45-31.57,42-64.85,42-96.25A88.1,88.1,0,0,0,128,16Zm0,206c-16.53-13-72-60.75-72-118a72,72,0,0,1,144,0C200,161.23,144.53,209,128,222Z"></path></svg>
            </div>
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">Cluster Markers</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Datos puntuales (centroides)</p>
            </div>
          </button>
          <button className="group w-full text-left flex items-center gap-3 rounded-lg p-3 hover:bg-primary/10 dark:hover:bg-primary/20">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20 dark:bg-primary/30 text-primary group-hover:bg-primary group-hover:text-white">
              <svg fill="currentColor" height="24" viewBox="0 0 256 256" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M223.68,66.15,135.68,18h0a15.88,15.88,0,0,0-15.36,0l-88,48.17a16,16,0,0,0-8.32,14v95.64a16,16,0,0,0,8.32,14l88,48.17a15.88,15.88,0,0,0,15.36,0l88-48.17a16,16,0,0,0,8.32-14V80.18A16,16,0,0,0,223.68,66.15ZM128,32h0l80.34,44L128,120,47.66,76ZM40,90l80,43.78v85.79L40,175.82Zm96,129.57V133.82L216,90v85.78Z"></path></svg>
            </div>
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">Extrusión 3D</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Altura proporcional a población</p>
            </div>
          </button>
          <button className="group w-full text-left flex items-center gap-3 rounded-lg p-3 hover:bg-primary/10 dark:hover:bg-primary/20">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20 dark:bg-primary/30 text-primary group-hover:bg-primary group-hover:text-white">
              <svg fill="currentColor" height="24" viewBox="0 0 256 256" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm64-88a8,8,0,0,1-8,8H128a8,8,0,0,1-8-8V72a8,8,0,0,1,16,0v48h48A8,8,0,0,1,192,128Z"></path></svg>
            </div>
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">Isochrones</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Accesibilidad a hospitales</p>
            </div>
          </button>
          <button className="group w-full text-left flex items-center gap-3 rounded-lg p-3 hover:bg-primary/10 dark:hover:bg-primary/20">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20 dark:bg-primary/30 text-primary group-hover:bg-primary group-hover:text-white">
              <svg fill="currentColor" height="24" viewBox="0 0 256 256" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M174.63,81.37a80,80,0,1,0-93.26,93.26,80,80,0,1,0,93.26-93.26ZM100.69,136,120,155.31A63.48,63.48,0,0,1,96,160,63.48,63.48,0,0,1,100.69,136Zm33.75,11.13-25.57-25.57a64.65,64.65,0,0,1,12.69-12.69l25.57,25.57A64.65,64.65,0,0,1,134.44,147.13ZM155.31,120,136,100.69A63.48,63.48,0,0,1,160,96,63.48,63.48,0,0,1,155.31,120ZM32,96a64,64,0,0,1,126-16A80.08,80.08,0,0,0,80.05,158,64.11,64.11,0,0,1,32,96ZM160,224A64.11,64.11,0,0,1,98,176,80.08,80.08,0,0,0,176,98,64,64,0,0,1,160,224Z"></path></svg>
            </div>
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">Diagramas de Voronoi</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Zonas de influencia</p>
            </div>
          </button>
        </div>
        <h2 className="px-2 py-4 text-xl font-bold text-slate-900 dark:text-white">Controles de Capa</h2>
        <div className="space-y-4 px-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="layer-select">Capa</label>
            <select className="form-select w-full rounded-lg border-primary/30 bg-background-light dark:bg-background-dark text-slate-900 dark:text-white focus:border-primary focus:ring-primary" id="layer-select">
              <option>Población</option>
              <option>Viviendas</option>
              <option>Servicios</option>
            </select>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="cell-size">Tamaño de celda</label>
              <span className="text-sm text-slate-600 dark:text-slate-400">50</span>
            </div>
            <input className="w-full h-2 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary" id="cell-size" max="100" min="10" type="range" defaultValue={50} />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="cluster-radius">Radio de cluster</label>
              <span className="text-sm text-slate-600 dark:text-slate-400">75</span>
            </div>
            <input className="w-full h-2 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary" id="cluster-radius" max="150" min="10" type="range" defaultValue={75} />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="max-height">Altura máxima</label>
              <span className="text-sm text-slate-600 dark:text-slate-400">25</span>
            </div>
            <input className="w-full h-2 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary" id="max-height" max="50" min="5" type="range" defaultValue={25} />
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
