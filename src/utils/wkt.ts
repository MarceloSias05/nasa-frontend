import type { Feature, FeatureCollection, Geometry } from 'geojson';

function findMatchingParen(text: string, startIdx: number): number {
  let depth = 0;
  for (let i = startIdx; i < text.length; i++) {
    const ch = text[i];
    if (ch === '(') depth++;
    else if (ch === ')') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function parsePointPair(token: string): [number, number] | null {
  const nums = token.trim().split(/\s+/).map(s => Number(s.replace(',', '.'))).filter(n => !Number.isNaN(n));
  if (nums.length < 2) return null;
  return [nums[0], nums[1]];
}

function parsePolygonText(inner: string): number[][][] {
  // inner: content inside the outermost POLYGON(( ... )) without the outer parentheses
  // may contain multiple rings separated by '),('
  const ringsText = inner.split(/\)\s*,\s*\(/);
  const rings: number[][][] = [];
  for (const ringText of ringsText) {
  const pts = ringText.replace(/^[()\s]+|[)\s]+$/g, '').split(/\s*,\s*/).map(p => p.trim()).filter(p => p.length);
    const coords: number[][] = [];
    for (const pt of pts) {
      const pair = parsePointPair(pt);
      if (pair) coords.push(pair);
    }
    if (coords.length) rings.push(coords as number[][]);
  }
  return rings;
}

function parseWktSingle(wkt: string): Feature<Geometry> | null {
  const s = wkt.trim();
  if (/^POLYGON\s*\(/i.test(s)) {
    const start = s.indexOf('((');
    const end = s.lastIndexOf('))');
    if (start >= 0 && end > start) {
      const inner = s.substring(start + 2, end);
      const rings = parsePolygonText(inner);
      return {
        type: 'Feature',
        properties: {},
        geometry: { type: 'Polygon', coordinates: rings },
      };
    }
  }

  if (/^MULTIPOLYGON\s*\(/i.test(s)) {
    // naive parse: find inner content between MULTIPOLYGON(( ... ))
    const start = s.indexOf('((');
    const end = s.lastIndexOf('))');
    if (start >= 0 && end > start) {
      const inner = s.substring(start + 2, end);
      // split polygons by ')),((' pattern
      const polysText = inner.split(/\)\s*\)\s*,\s*\(\s*\(/);
      const polys: number[][][] = [];
      for (const ptext of polysText) {
        const rings = parsePolygonText(ptext);
        // rings is array of linear rings; push as polygon with its rings
        polys.push(...rings.map(r => r as number[][]));
      }
      // Build multipolygon coords: array of polygons, each polygon is array of rings
      // Here we've flattened; attempt to group by separators is complex — produce a MultiPolygon with each ring as first polygon
      return {
        type: 'Feature',
        properties: {},
        geometry: { type: 'MultiPolygon', coordinates: polys.map(r => [r]) },
      };
    }
  }
  return null;
}

export function extractWktsFromText(text: string): string[] {
  const out: string[] = [];
  const lower = text.toUpperCase();
  let idx = 0;
  while (true) {
    const p1 = lower.indexOf('POLYGON', idx);
    const p2 = lower.indexOf('MULTIPOLYGON', idx);
  let start = -1;
    if (p1 === -1 && p2 === -1) break;
    if (p2 !== -1 && (p1 === -1 || p2 < p1)) {
      start = p2;
    } else {
      start = p1;
    }
    // find first '(' after start
    const parenIdx = text.indexOf('(', start);
    if (parenIdx === -1) break;
    const matchIdx = findMatchingParen(text, parenIdx);
    if (matchIdx === -1) break;
    const wkt = text.substring(start, matchIdx + 1);
    out.push(wkt);
    idx = matchIdx + 1;
  }
  return out;
}

export function parseWktsToFeatureCollection(text: string): FeatureCollection<Geometry> {
  const wkts = extractWktsFromText(text);
  const features: Feature<Geometry>[] = [];
  for (const w of wkts) {
    const f = parseWktSingle(w);
    if (f) features.push(f);
  }
  return { type: 'FeatureCollection', features };
}
