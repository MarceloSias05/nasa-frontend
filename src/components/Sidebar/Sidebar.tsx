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
}

const Sidebar: React.FC<SidebarProps> = ({ active, onSelect }) => {
  return (
    <div className="sidebar">
      <div className="sidebar-header">City Insights</div>
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
        {/* Aquí botones adicionales, toggles, etc */}
      </div>
    </div>
  );
};

export default Sidebar;
