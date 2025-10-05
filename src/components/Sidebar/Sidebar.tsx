// src/components/Sidebar.tsx
import React, { useState } from "react";
import * as XLSX from "xlsx";
import "./Sidebar.css";

// ---- Íconos (minimalistas y reutilizables) ----
const Icon = ({ path, size = 16 }: { path: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d={path} />
  </svg>
);

const menuItems = [
  { icon: <Icon path="M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z" />, label: "Cargar Población", key: "load-population" },
  { icon: <Icon path="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39.39.39 1.02 0 1.41l-2.34 2.34-3.75-3.75 2.34-2.34c.39-.39 1.02-.39 1.41 0l2.34 2.34z" />, label: "Escuelas", key: "cluster" },
  { icon: <Icon path="M12 2l7 4v6l-7 4-7-4V6l7-4zM12 12l7-4M12 12v6M12 12L5 8" />, label: "Extrusión 3D", key: "extrusion3d" },
  { icon: <Icon path="M3 3h18v2H3zM3 7h18v2H3zM3 11h18v2H3zM3 15h18v2H3z" />, label: "Guardar historial", key: "save-history" },
  { icon: <Icon path="M4 6h16v2H4zM4 10h16v2H4zM4 14h16v2H4z" />, label: "Historial", key: "history" },
  { icon: <Icon path="M3 11h4v8H3zm7-4h4v12h-4zm7-4h4v16h-4z" />, label: "Voronoi", key: "voronoi" },
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
  hexRadius: number;
  onHexRadiusChange: (value: number) => void;
  hexElevationScale: number;
  onHexElevationScaleChange: (value: number) => void;
  budget: number;
  onBudgetChange: (value: number) => void;
  maxParques: number;
  onMaxParquesChange: (value: number) => void;
  maxEscuelas: number;
  onMaxEscuelasChange: (value: number) => void;
  onCsvPolygonLoaded?: (csvText: string, options?: { invert?: boolean }) => void;
  freezeUploaded?: boolean;
  onFreezeToggle?: (v: boolean) => void;
  onLoadHistoryEntry?: (entry: any) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  active,
  onSelect,
  budget,
  onBudgetChange,
  maxParques,
  onMaxParquesChange,
  maxEscuelas,
  onMaxEscuelasChange,
  onCsvPolygonLoaded,
  freezeUploaded,
  onFreezeToggle,
  hexRadius,
  onHexRadiusChange,
  hexElevationScale,
  onHexElevationScaleChange,
  onLoadHistoryEntry,
}) => {
  const [invertLatLon, setInvertLatLon] = useState(false);
  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      maximumFractionDigits: 0,
    }).format(v);

  // ---------- HANDLER: Cargar CSV / XLSX ----------
  const handleFileLoad = (file: File) => {
    const ext = (file.name.split(".").pop() || "").toLowerCase();
    const isExcel =
      ext === "xlsx" || ext === "xls" || (file.type && file.type.includes("spreadsheet"));

    const reader = new FileReader();
    reader.onload = () => {
      try {
        let csvText = "";
        if (isExcel) {
          const data = new Uint8Array(reader.result as ArrayBuffer);
          const wb = XLSX.read(data, { type: "array" });
          const ws = wb.Sheets[wb.SheetNames[0]];
          csvText = XLSX.utils.sheet_to_csv(ws, { FS: "," });
        } else {
          csvText = String(reader.result || "");
        }
        onCsvPolygonLoaded?.(csvText, { invert: invertLatLon });
      } catch (err) {
        console.error("Error leyendo el archivo:", err);
        alert("No se pudo leer el archivo. Ver consola para más detalles.");
      }
    };
    if (isExcel) reader.readAsArrayBuffer(file);
    else reader.readAsText(file);
  };

  return (
    <aside className="sidebar">
      <h2 className="sidebar-header">NASA Space Apps</h2>

      {/* Menú principal */}
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <div
            key={item.key}
            className={`sidebar-item ${active === item.key ? "active" : ""}`}
            onClick={() => onSelect(item.key)}
          >
            <span className="icon">{item.icon}</span>
            <span className="label">{item.label}</span>
          </div>
        ))}
      </nav>

  {/* Historial: ver en el área principal */}

      {/* Panel de parámetros */}
      <section className="sidebar-footer">
        <div style={{ padding: "12px 10px" }}>
          <h3 style={{ fontWeight: 700, marginBottom: 8 }}>Parámetros</h3>

          {/* ---- Cargar CSV ---- */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontWeight: 600, fontSize: 13, marginBottom: 6, display: "block" }}>
              Cargar CSV o Excel (lat, lon)
            </label>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => e.target.files?.[0] && handleFileLoad(e.target.files[0])}
              style={{ width: "100%" }}
            />
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                id="freeze-uploaded"
                checked={!!freezeUploaded}
                onChange={(e) => onFreezeToggle && onFreezeToggle(e.target.checked)}
              />
              <label htmlFor="freeze-uploaded" style={{ fontSize: 13 }}>Freeze uploaded features</label>
            </div>
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                id="invert-latlon"
                checked={!!invertLatLon}
                onChange={(e) => setInvertLatLon(e.target.checked)}
              />
              <label htmlFor="invert-latlon" style={{ fontSize: 13 }}>Invertir Lat/Lon</label>
            </div>
          </div>

          {/* ---- Sliders ---- */}
          <Slider
            label="Presupuesto"
            valueLabel={formatCurrency(budget)}
            value={budget}
            min={0}
            max={1000000}
            step={10000}
            onChange={onBudgetChange}
          />

          <Slider
            label="Nº máx. de parques"
            value={maxParques}
            min={0}
            max={100}
            step={1}
            onChange={onMaxParquesChange}
          />

          <Slider
            label="Nº máx. de escuelas"
            value={maxEscuelas}
            min={0}
            max={100}
            step={1}
            onChange={onMaxEscuelasChange}
          />

          <h4 style={{ marginTop: 6, marginBottom: 6 }}>Hexagon controls</h4>
          <Slider
            label="Hex radius (m)"
            value={hexRadius}
            min={20}
            max={1000}
            step={10}
            onChange={onHexRadiusChange}
          />
          <Slider
            label="Elevation scale"
            value={hexElevationScale}
            min={0}
            max={3000}
            step={50}
            onChange={onHexElevationScaleChange}
          />
        </div>
      </section>
    </aside>
  );
};

// ---- Slider Reutilizable ----
interface SliderProps {
  label: string;
  value: number | string;
  valueLabel?: string;
  min: number;
  max: number;
  step: number;
  onChange: (val: number) => void;
}
const Slider: React.FC<SliderProps> = ({
  label,
  value,
  valueLabel,
  min,
  max,
  step,
  onChange,
}) => (
  <div style={{ marginBottom: 14 }}>
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        fontSize: 12,
        marginBottom: 4,
      }}
    >
      <span>{label}</span>
      <span>{valueLabel ?? value}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={Number(value)}
      onChange={(e) => onChange(Number(e.target.value))}
      style={{ width: "100%" }}
    />
  </div>
);

export default Sidebar;
