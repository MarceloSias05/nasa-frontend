// src/components/Sidebar.tsx
import React from "react";
import "./Sidebar.css";

const FaTh: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
    <rect x="0" y="0" width="6" height="6" />
    <rect x="10" y="0" width="6" height="6" />
    <rect x="0" y="10" width="6" height="6" />
    <rect x="10" y="10" width="6" height="6" />
  </svg>
);

const FaMap: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M9 3L5 5v13l4 2 4-2 4 2V5l-4-2-4 2z" />
  </svg>
);

const FaCubes: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M12 2l7 4v6l-7 4-7-4V6l7-4zM12 12l7-4M12 12v6M12 12L5 8" />
  </svg>
);

const FaClock: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" stroke="#fff" strokeWidth="1" fill="none" />
  </svg>
);

const FaChartBar: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <rect x="3" y="11" width="4" height="8" />
    <rect x="10" y="7" width="4" height="12" />
    <rect x="17" y="3" width="4" height="16" />
  </svg>
);

const menuItems = [
  { icon: <FaTh />, label: "Hexbin/Grid", key: "hexbin" },
  { icon: <FaMap />, label: "Cluster Markers", key: "cluster" },
  { icon: <FaCubes />, label: "Extrusión 3D", key: "extrusion3d" },
  { icon: <FaClock />, label: "Isochrones", key: "isochrones" },
  { icon: <FaChartBar />, label: "Diagramas de Voronoi", key: "voronoi" },
];

interface SidebarProps {
  active: string;
  onSelect: (key: string) => void;
  layer: string;
  onLayerChange: (value: string) => void;
  cellSize: number;
  onCellSizeChange: (value: number) => void;
  clusterRadius: number;
  onClusterRadiusChange: (value: number) => void;
  maxHeight: number;
  onMaxHeightChange: (value: number) => void;
  // New parameters
  budget: number;
  onBudgetChange: (value: number) => void;
  maxParques: number;
  onMaxParquesChange: (value: number) => void;
  maxEscuelas: number;
  onMaxEscuelasChange: (value: number) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ active, onSelect, budget, onBudgetChange, maxParques, onMaxParquesChange, maxEscuelas, onMaxEscuelasChange }) => {
  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(v);
  return (
    <div className="sidebar">
      <div className="sidebar-header">Nasa Space Apps</div>
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <div
            key={item.key}
            className={`sidebar-item ${active === item.key ? "active" : ""}`}
            onClick={() => onSelect(item.key)}
          >
            <div className="icon">{item.icon}</div>
            <div className="label">{item.label}</div>
          </div>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div style={{ padding: '12px 10px' }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Parámetros</div>

          {/* Presupuesto */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
              <span>Presupuesto</span>
              <span>{formatCurrency(budget)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={1000000}
              step={10000}
              value={budget}
              onChange={(e) => onBudgetChange(Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>

          {/* Nº máximo de parques */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
              <span>Nº máx. de parques</span>
              <span>{maxParques}</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={maxParques}
              onChange={(e) => onMaxParquesChange(Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>

          {/* Nº máximo de escuelas */}
          <div style={{ marginBottom: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
              <span>Nº máx. de escuelas</span>
              <span>{maxEscuelas}</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={maxEscuelas}
              onChange={(e) => onMaxEscuelasChange(Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
