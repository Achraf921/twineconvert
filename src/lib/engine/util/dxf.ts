/**
 * ASCII DXF (Drawing Exchange Format) parser + SVG renderer.
 *
 * DXF is AutoCAD's interchange format and the closest thing 2D CAD has
 * to a universal exchange format. Every CAD/CAM tool reads it: AutoCAD,
 * LibreCAD, QCAD, BricsCAD, FreeCAD, OnShape (export), Fusion 360
 * (export), TinkerCAD, KiCad, EAGLE, even most laser-cutter and
 * CNC-control software. ASCII DXF dates to AutoCAD 1.0 in 1982 and is
 * still emitted by current AutoCAD 2025.
 *
 * Wire format: pair-based. Each value lives on its own line, preceded
 * by a "group code" on the previous line. So a LINE entity from (0,0)
 * to (100, 50) is:
 *
 *     0     <- group code 0 = entity type marker
 *     LINE
 *     8     <- group code 8 = layer name
 *     0
 *     10    <- group code 10 = start X
 *     0.0
 *     20    <- group code 20 = start Y
 *     0.0
 *     11    <- group code 11 = end X
 *     100.0
 *     21    <- group code 21 = end Y
 *     50.0
 *
 * Group code conventions we use:
 *   - 0:   entity/section type marker
 *   - 2:   section/block name
 *   - 8:   layer name
 *   - 1:   primary text value (for TEXT, MTEXT)
 *   - 10/20/30:  first point X/Y/Z (or a vertex of polyline)
 *   - 11/21/31:  second point X/Y/Z (LINE end)
 *   - 40:  float — radius for CIRCLE/ARC, text height for TEXT
 *   - 50/51:  angles (degrees) — start/end for ARC
 *   - 70:  integer flag (LWPOLYLINE bit 1 = closed)
 *   - 90:  integer count
 *
 * Binary DXF exists but is rare in the wild; we only handle ASCII DXF.
 */

export interface DxfLine {
  type: "LINE";
  layer: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface DxfCircle {
  type: "CIRCLE";
  layer: string;
  cx: number;
  cy: number;
  r: number;
}

export interface DxfArc {
  type: "ARC";
  layer: string;
  cx: number;
  cy: number;
  r: number;
  /** start angle in degrees */
  startAngle: number;
  /** end angle in degrees */
  endAngle: number;
}

export interface DxfPoint {
  type: "POINT";
  layer: string;
  x: number;
  y: number;
}

export interface DxfText {
  type: "TEXT";
  layer: string;
  x: number;
  y: number;
  height: number;
  content: string;
}

export interface DxfPolyline {
  type: "LWPOLYLINE" | "POLYLINE";
  layer: string;
  closed: boolean;
  vertices: Array<{ x: number; y: number }>;
}

export type DxfEntity = DxfLine | DxfCircle | DxfArc | DxfPoint | DxfText | DxfPolyline;

/**
 * Parse an ASCII DXF document and return its drawable entities.
 *
 * Sections we ignore: HEADER (metadata), CLASSES, TABLES, BLOCKS, OBJECTS.
 * Section we extract: ENTITIES. Real-world DXFs from CAD exports
 * almost always carry their geometry in ENTITIES; block instancing
 * (INSERT entities expanded from BLOCKS) is not yet expanded — INSERTs
 * are parsed but treated as opaque markers we drop in the SVG renderer.
 */
export function parseDxf(text: string): DxfEntity[] {
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  // Normalize CRLF and strip trailing whitespace once.
  const lines = text.split(/\r?\n/).map((s) => s.replace(/\s+$/, ""));
  // Read (code, value) pairs.
  const pairs: Array<{ code: number; value: string }> = [];
  for (let i = 0; i + 1 < lines.length; i += 2) {
    const code = parseInt(lines[i].trim(), 10);
    const value = lines[i + 1];
    if (Number.isNaN(code)) continue;
    pairs.push({ code, value });
  }

  // Find ENTITIES section bounds.
  let entitiesStart = -1;
  let entitiesEnd = pairs.length;
  for (let i = 0; i < pairs.length - 1; i++) {
    if (pairs[i].code === 0 && pairs[i].value === "SECTION") {
      const nameIdx = i + 1;
      if (pairs[nameIdx]?.code === 2 && pairs[nameIdx]?.value === "ENTITIES") {
        entitiesStart = nameIdx + 1;
      }
    } else if (entitiesStart >= 0 && pairs[i].code === 0 && pairs[i].value === "ENDSEC") {
      entitiesEnd = i;
      break;
    }
  }
  if (entitiesStart < 0) return [];

  const entities: DxfEntity[] = [];
  let i = entitiesStart;
  while (i < entitiesEnd) {
    if (pairs[i].code !== 0) {
      i++;
      continue;
    }
    const type = pairs[i].value;
    i++;
    // Collect this entity's group code pairs until the next code-0 marker.
    const fields: Array<{ code: number; value: string }> = [];
    while (i < entitiesEnd && pairs[i].code !== 0) {
      fields.push(pairs[i]);
      i++;
    }
    const entity = buildEntity(type, fields);
    if (entity) entities.push(entity);
  }
  return entities;
}

function getNum(fields: Array<{ code: number; value: string }>, code: number, fallback = 0): number {
  for (const f of fields) {
    if (f.code === code) {
      const n = parseFloat(f.value);
      return Number.isFinite(n) ? n : fallback;
    }
  }
  return fallback;
}

function getStr(fields: Array<{ code: number; value: string }>, code: number, fallback = ""): string {
  for (const f of fields) if (f.code === code) return f.value;
  return fallback;
}

function buildEntity(
  type: string,
  fields: Array<{ code: number; value: string }>,
): DxfEntity | null {
  const layer = getStr(fields, 8, "0");
  switch (type) {
    case "LINE":
      return {
        type: "LINE",
        layer,
        x1: getNum(fields, 10),
        y1: getNum(fields, 20),
        x2: getNum(fields, 11),
        y2: getNum(fields, 21),
      };
    case "CIRCLE":
      return {
        type: "CIRCLE",
        layer,
        cx: getNum(fields, 10),
        cy: getNum(fields, 20),
        r: getNum(fields, 40),
      };
    case "ARC":
      return {
        type: "ARC",
        layer,
        cx: getNum(fields, 10),
        cy: getNum(fields, 20),
        r: getNum(fields, 40),
        startAngle: getNum(fields, 50),
        endAngle: getNum(fields, 51),
      };
    case "POINT":
      return { type: "POINT", layer, x: getNum(fields, 10), y: getNum(fields, 20) };
    case "TEXT":
    case "MTEXT":
      return {
        type: "TEXT",
        layer,
        x: getNum(fields, 10),
        y: getNum(fields, 20),
        height: getNum(fields, 40, 1),
        content: getStr(fields, 1),
      };
    case "LWPOLYLINE":
    case "POLYLINE": {
      // LWPOLYLINE: vertices ride inline as repeated (10, 20) pairs.
      const vertices: Array<{ x: number; y: number }> = [];
      let curX: number | null = null;
      for (const f of fields) {
        if (f.code === 10) curX = parseFloat(f.value);
        else if (f.code === 20 && curX != null) {
          vertices.push({ x: curX, y: parseFloat(f.value) });
          curX = null;
        }
      }
      const closed = (getNum(fields, 70, 0) & 1) === 1;
      return { type: type as "LWPOLYLINE" | "POLYLINE", layer, closed, vertices };
    }
    default:
      // INSERT, ATTRIB, HATCH, DIMENSION, SOLID, 3DFACE, etc. are dropped
      // for the SVG/JSON renderer. We don't fail the conversion on them.
      return null;
  }
}

/** Compute the bounding box across an entity list, in DXF coordinates. */
function boundingBox(entities: DxfEntity[]): { minX: number; minY: number; maxX: number; maxY: number } {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const consume = (x: number, y: number) => {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  };
  for (const e of entities) {
    switch (e.type) {
      case "LINE":
        consume(e.x1, e.y1);
        consume(e.x2, e.y2);
        break;
      case "CIRCLE":
      case "ARC":
        consume(e.cx - e.r, e.cy - e.r);
        consume(e.cx + e.r, e.cy + e.r);
        break;
      case "POINT":
        consume(e.x, e.y);
        break;
      case "TEXT":
        consume(e.x, e.y);
        consume(e.x + e.content.length * e.height * 0.6, e.y + e.height);
        break;
      case "LWPOLYLINE":
      case "POLYLINE":
        for (const v of e.vertices) consume(v.x, v.y);
        break;
    }
  }
  if (!Number.isFinite(minX)) return { minX: 0, minY: 0, maxX: 100, maxY: 100 };
  return { minX, minY, maxX, maxY };
}

/**
 * Render parsed DXF entities to SVG. DXF uses math-convention Y-axis
 * (positive Y goes up); SVG uses screen-convention Y-axis (positive Y
 * goes down). We apply a `transform="scale(1,-1)"` group so all the
 * entity coordinates can be emitted verbatim while still displaying
 * right-side-up.
 */
export function buildSvgFromDxf(entities: DxfEntity[]): string {
  const bb = boundingBox(entities);
  const pad = Math.max((bb.maxX - bb.minX) * 0.05, (bb.maxY - bb.minY) * 0.05, 1);
  const minX = bb.minX - pad;
  const minY = bb.minY - pad;
  const width = bb.maxX - bb.minX + 2 * pad;
  const height = bb.maxY - bb.minY + 2 * pad;
  // ViewBox uses the same coordinate axes as DXF; the inner <g> flips Y.
  const viewBox = `${minX} ${-(bb.maxY + pad)} ${width} ${height}`;
  const strokeWidth = Math.max(Math.min(width, height) * 0.002, 0.1);
  const out: string[] = [];
  out.push(`<?xml version="1.0" encoding="UTF-8"?>`);
  out.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${width.toFixed(2)}" height="${height.toFixed(2)}">`,
  );
  out.push(`<g transform="scale(1,-1)" fill="none" stroke="black" stroke-width="${strokeWidth.toFixed(4)}">`);
  for (const e of entities) {
    out.push(entityToSvg(e));
  }
  out.push(`</g></svg>`);
  return out.join("\n");
}

function entityToSvg(e: DxfEntity): string {
  switch (e.type) {
    case "LINE":
      return `<line x1="${e.x1}" y1="${e.y1}" x2="${e.x2}" y2="${e.y2}" />`;
    case "CIRCLE":
      return `<circle cx="${e.cx}" cy="${e.cy}" r="${e.r}" />`;
    case "ARC": {
      // Convert center + angles to SVG path "M start A r r 0 large sweep end"
      const rad = (deg: number) => (deg * Math.PI) / 180;
      const sx = e.cx + e.r * Math.cos(rad(e.startAngle));
      const sy = e.cy + e.r * Math.sin(rad(e.startAngle));
      const ex = e.cx + e.r * Math.cos(rad(e.endAngle));
      const ey = e.cy + e.r * Math.sin(rad(e.endAngle));
      const sweep = e.endAngle > e.startAngle ? 1 : 0;
      const span = ((e.endAngle - e.startAngle) % 360 + 360) % 360;
      const large = span > 180 ? 1 : 0;
      return `<path d="M ${sx} ${sy} A ${e.r} ${e.r} 0 ${large} ${sweep} ${ex} ${ey}" />`;
    }
    case "POINT":
      return `<circle cx="${e.x}" cy="${e.y}" r="0.5" fill="black" />`;
    case "TEXT": {
      const text = e.content
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      // Re-flip Y on TEXT specifically so glyphs aren't mirrored by the
      // outer scale(1,-1). Standard SVG trick: inner transform applies
      // scale(1,-1) at the text origin so the parent flip cancels.
      return `<g transform="translate(${e.x} ${e.y}) scale(1,-1)"><text x="0" y="0" font-size="${e.height}" font-family="Arial, sans-serif" fill="black" stroke="none">${text}</text></g>`;
    }
    case "LWPOLYLINE":
    case "POLYLINE": {
      if (e.vertices.length === 0) return "";
      const pts = e.vertices.map((v) => `${v.x},${v.y}`).join(" ");
      return e.closed
        ? `<polygon points="${pts}" />`
        : `<polyline points="${pts}" />`;
    }
  }
}
