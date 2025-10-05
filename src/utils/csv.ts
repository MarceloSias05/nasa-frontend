// src/utils/csv.ts
import type { FeatureCollection, Geometry } from 'geojson';

type Parsed = {
  coords: [number, number][]; // [lon, lat]
  errors: string[];
};

const CANDIDATE_DELIMS = [',', ';', '\t'] as const;

function splitCsvLine(line: string, delim: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (!inQuotes && ch === delim) {
      out.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

function detectDelimiter(lines: string[]): string {
  let best: { delim: string; score: number } = { delim: ',', score: -1 };
  for (const d of CANDIDATE_DELIMS) {
    let score = 0;
    const toCheck = lines.slice(0, Math.min(10, lines.length));
    for (const ln of toCheck) {
      const tokens = splitCsvLine(ln, d);
      score += Math.max(0, tokens.length - 1);
    }
    if (score > best.score) best = { delim: d, score };
  }
  return best.delim;
}

function toNumber(s: string): number | null {
  const v = Number(String(s).trim().replace(',', '.'));
  return Number.isFinite(v) ? v : null;
}

/**
 * Parsea archivos CSV/XLSX con columnas lat/lon (en cualquier orden)
 * y devuelve un arreglo de coordenadas limpias [lon, lat].
 */
export function parseLatLonCsv(text: string): Parsed {
  const errors: string[] = [];
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lines.length === 0) return { coords: [], errors: ['Archivo vacío'] };

  const delim = detectDelimiter(lines);
  const split = (l: string) => splitCsvLine(l, delim);

  const headerTokens = split(lines[0]).map((t) => t.trim().toLowerCase());
  let startIdx = 0;
  let latIdx = -1;
  let lonIdx = -1;

  // Detección automática de encabezados
  if (
    headerTokens.some((t) =>
      /(lat|lon|lng|x|y|latitud|longitud)/.test(t)
    )
  ) {
    latIdx = headerTokens.findIndex((t) =>
      /(lat|latitud|y)/.test(t)
    );
    lonIdx = headerTokens.findIndex((t) =>
      /(lon|lng|longitud|x)/.test(t)
    );
    startIdx = 1;
  }

  const coords: [number, number][] = [];

  for (let i = startIdx; i < lines.length; i++) {
    const parts = split(lines[i]).map((p) => p.replace(/^"|"$/g, ''));
    if (parts.length < 2) continue;

    const lat = toNumber(parts[latIdx >= 0 ? latIdx : 0]);
    const lon = toNumber(parts[lonIdx >= 0 ? lonIdx : 1]);
    if (lat === null || lon === null) continue;

    // 🔹 Filtra valores fuera del rango geográfico de México
    if (lat < 15 || lat > 35 || lon < -120 || lon > -85) continue;

    coords.push([lon, lat]);
  }

  if (coords.length < 3) errors.push('Se requieren al menos 3 puntos para crear un polígono');

  // Cierra el polígono si falta el último punto
  if (coords.length >= 3) {
    const first = coords[0];
    const last = coords[coords.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) coords.push([...first]);
  }

  return { coords, errors };
}

/**
 * Convierte coordenadas [lon, lat] a FeatureCollection (GeoJSON)
 */
export function coordsToPolygonFeatureCollection(coords: [number, number][]): FeatureCollection<Geometry> {
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: { type: 'Polygon', coordinates: [coords] },
        properties: {},
      },
    ],
  };
}
