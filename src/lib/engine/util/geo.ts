/**
 * Internal geometry model + parsers/emitters for KML, GPX, GeoJSON.
 *
 * These three formats all describe WGS84 features (points, lines, polygons)
 * with optional names/descriptions/elevation. We model the common subset and
 * accept that some format-specific bells and whistles (KML styles, GPX
 * extensions) get dropped on conversion. That tradeoff is documented in
 * docs/bijectivity-audit.md — these pairs are content-preserving but not
 * byte-for-byte bijective.
 *
 * Position order is [lon, lat, ele?] to match the GeoJSON spec — KML uses
 * the same `lon,lat,ele` order in its <coordinates> string, GPX uses
 * `lat=""` `lon=""` attributes (which we swap in/out of position arrays at
 * the boundary).
 */

import { XMLBuilder, XMLParser } from "fast-xml-parser";

export type Position = [number, number] | [number, number, number];

export type Geometry =
  | { type: "Point"; coordinates: Position }
  | { type: "LineString"; coordinates: Position[] }
  | { type: "Polygon"; coordinates: Position[][] };

export interface Feature {
  geometry: Geometry;
  name?: string;
  description?: string;
}

export interface FeatureCollection {
  features: Feature[];
}

// ---- Parsing helpers ------------------------------------------------------

function parseCoordString(s: string): Position[] {
  // KML format: "lon,lat,ele lon,lat,ele ..." (whitespace-separated triples)
  return s
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((triple) => {
      const parts = triple.split(",").map(Number);
      const [lon, lat, ele] = parts;
      if (Number.isNaN(lon) || Number.isNaN(lat)) {
        throw new Error(`Invalid coordinate: "${triple}"`);
      }
      return ele != null && !Number.isNaN(ele)
        ? ([lon, lat, ele] as Position)
        : ([lon, lat] as Position);
    });
}

function formatCoordString(positions: Position[]): string {
  return positions
    .map((p) => (p.length === 3 ? `${p[0]},${p[1]},${p[2]}` : `${p[0]},${p[1]}`))
    .join(" ");
}

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  // Keep arrays for repeated nodes so consumers don't have to type-check
  // single-vs-array each time
  isArray: (name) =>
    ["Placemark", "wpt", "trk", "trkseg", "trkpt", "rte", "rtept"].includes(name),
});

const xmlBuilder = new XMLBuilder({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  format: true,
  indentBy: "  ",
  suppressEmptyNode: true,
});

// ---- KML ------------------------------------------------------------------

export function parseKml(text: string): FeatureCollection {
  const root = xmlParser.parse(text);
  const doc = root?.kml?.Document ?? root?.kml ?? {};
  const placemarks: unknown[] = doc.Placemark ?? [];
  const features: Feature[] = [];

  for (const raw of placemarks) {
    const pm = raw as Record<string, unknown>;
    const name = pm.name != null ? String(pm.name) : undefined;
    const description = pm.description != null ? String(pm.description) : undefined;

    const point = pm.Point as { coordinates?: string } | undefined;
    if (point?.coordinates) {
      const coords = parseCoordString(String(point.coordinates));
      if (coords[0]) {
        features.push({
          geometry: { type: "Point", coordinates: coords[0] },
          name,
          description,
        });
      }
      continue;
    }

    const line = pm.LineString as { coordinates?: string } | undefined;
    if (line?.coordinates) {
      features.push({
        geometry: { type: "LineString", coordinates: parseCoordString(String(line.coordinates)) },
        name,
        description,
      });
      continue;
    }

    const poly = pm.Polygon as
      | { outerBoundaryIs?: { LinearRing?: { coordinates?: string } } }
      | undefined;
    const ring = poly?.outerBoundaryIs?.LinearRing?.coordinates;
    if (ring) {
      features.push({
        geometry: { type: "Polygon", coordinates: [parseCoordString(String(ring))] },
        name,
        description,
      });
    }
  }

  return { features };
}

export function buildKml(fc: FeatureCollection): string {
  const placemarks = fc.features.map((f) => {
    const base: Record<string, unknown> = {};
    if (f.name) base.name = f.name;
    if (f.description) base.description = f.description;

    if (f.geometry.type === "Point") {
      base.Point = { coordinates: formatCoordString([f.geometry.coordinates]) };
    } else if (f.geometry.type === "LineString") {
      base.LineString = { coordinates: formatCoordString(f.geometry.coordinates) };
    } else {
      base.Polygon = {
        outerBoundaryIs: {
          LinearRing: { coordinates: formatCoordString(f.geometry.coordinates[0]) },
        },
      };
    }
    return base;
  });

  const doc = {
    "?xml": { "@_version": "1.0", "@_encoding": "UTF-8" },
    kml: {
      "@_xmlns": "http://www.opengis.net/kml/2.2",
      Document: { Placemark: placemarks },
    },
  };
  return xmlBuilder.build(doc);
}

// ---- GPX ------------------------------------------------------------------

export function parseGpx(text: string): FeatureCollection {
  const root = xmlParser.parse(text);
  const gpx = root?.gpx ?? {};
  const features: Feature[] = [];

  // Waypoints → Point features
  const wpts: unknown[] = gpx.wpt ?? [];
  for (const raw of wpts) {
    const w = raw as Record<string, unknown>;
    const lat = Number(w["@_lat"]);
    const lon = Number(w["@_lon"]);
    if (Number.isNaN(lat) || Number.isNaN(lon)) continue;
    const ele = w.ele != null ? Number(w.ele) : NaN;
    const coords: Position = !Number.isNaN(ele) ? [lon, lat, ele] : [lon, lat];
    features.push({
      geometry: { type: "Point", coordinates: coords },
      name: w.name != null ? String(w.name) : undefined,
      description: w.desc != null ? String(w.desc) : undefined,
    });
  }

  // Tracks → LineString features (one per segment)
  const trks: unknown[] = gpx.trk ?? [];
  for (const raw of trks) {
    const t = raw as Record<string, unknown>;
    const trkName = t.name != null ? String(t.name) : undefined;
    const segs: unknown[] = (t.trkseg as unknown[]) ?? [];
    for (const segRaw of segs) {
      const seg = segRaw as Record<string, unknown>;
      const pts: unknown[] = (seg.trkpt as unknown[]) ?? [];
      const coords: Position[] = [];
      for (const pRaw of pts) {
        const p = pRaw as Record<string, unknown>;
        const lat = Number(p["@_lat"]);
        const lon = Number(p["@_lon"]);
        if (Number.isNaN(lat) || Number.isNaN(lon)) continue;
        const ele = p.ele != null ? Number(p.ele) : NaN;
        coords.push(!Number.isNaN(ele) ? [lon, lat, ele] : [lon, lat]);
      }
      if (coords.length > 0) {
        features.push({
          geometry: { type: "LineString", coordinates: coords },
          name: trkName,
        });
      }
    }
  }

  // Routes → LineString features
  const rtes: unknown[] = gpx.rte ?? [];
  for (const raw of rtes) {
    const r = raw as Record<string, unknown>;
    const rteName = r.name != null ? String(r.name) : undefined;
    const pts: unknown[] = (r.rtept as unknown[]) ?? [];
    const coords: Position[] = [];
    for (const pRaw of pts) {
      const p = pRaw as Record<string, unknown>;
      const lat = Number(p["@_lat"]);
      const lon = Number(p["@_lon"]);
      if (Number.isNaN(lat) || Number.isNaN(lon)) continue;
      const ele = p.ele != null ? Number(p.ele) : NaN;
      coords.push(!Number.isNaN(ele) ? [lon, lat, ele] : [lon, lat]);
    }
    if (coords.length > 0) {
      features.push({
        geometry: { type: "LineString", coordinates: coords },
        name: rteName,
      });
    }
  }

  return { features };
}

export function buildGpx(fc: FeatureCollection): string {
  const wpts: Record<string, unknown>[] = [];
  const trks: Record<string, unknown>[] = [];

  for (const f of fc.features) {
    if (f.geometry.type === "Point") {
      const [lon, lat, ele] = f.geometry.coordinates;
      const wpt: Record<string, unknown> = { "@_lat": lat, "@_lon": lon };
      if (ele != null) wpt.ele = ele;
      if (f.name) wpt.name = f.name;
      if (f.description) wpt.desc = f.description;
      wpts.push(wpt);
    } else if (f.geometry.type === "LineString") {
      const trkpts = f.geometry.coordinates.map((p) => {
        const [lon, lat, ele] = p;
        const o: Record<string, unknown> = { "@_lat": lat, "@_lon": lon };
        if (ele != null) o.ele = ele;
        return o;
      });
      const trk: Record<string, unknown> = { trkseg: [{ trkpt: trkpts }] };
      if (f.name) trk.name = f.name;
      trks.push(trk);
    } else if (f.geometry.type === "Polygon") {
      // GPX has no polygon — emit the outer ring as a closed track instead
      const trkpts = f.geometry.coordinates[0].map((p) => {
        const [lon, lat, ele] = p;
        const o: Record<string, unknown> = { "@_lat": lat, "@_lon": lon };
        if (ele != null) o.ele = ele;
        return o;
      });
      const trk: Record<string, unknown> = { trkseg: [{ trkpt: trkpts }] };
      if (f.name) trk.name = f.name;
      trks.push(trk);
    }
  }

  const out: Record<string, unknown> = {
    "?xml": { "@_version": "1.0", "@_encoding": "UTF-8" },
    gpx: {
      "@_version": "1.1",
      "@_creator": "twineconvert",
      "@_xmlns": "http://www.topografix.com/GPX/1/1",
    },
  };
  const gpxObj = out.gpx as Record<string, unknown>;
  if (wpts.length > 0) gpxObj.wpt = wpts;
  if (trks.length > 0) gpxObj.trk = trks;
  return xmlBuilder.build(out);
}

// ---- GeoJSON --------------------------------------------------------------

interface GeoJsonFeature {
  type: "Feature";
  geometry: Geometry;
  properties?: Record<string, unknown>;
}

export function parseGeoJson(text: string): FeatureCollection {
  const parsed = JSON.parse(text);
  const rawFeatures: GeoJsonFeature[] =
    parsed?.type === "FeatureCollection" ? parsed.features ?? [] :
    parsed?.type === "Feature" ? [parsed] :
    parsed?.type === "Point" || parsed?.type === "LineString" || parsed?.type === "Polygon"
      ? [{ type: "Feature", geometry: parsed }]
      : [];

  return {
    features: rawFeatures
      .filter((f) => f && f.geometry && ["Point", "LineString", "Polygon"].includes(f.geometry.type))
      .map((f) => ({
        geometry: f.geometry,
        name: typeof f.properties?.name === "string" ? f.properties.name : undefined,
        description:
          typeof f.properties?.description === "string" ? f.properties.description : undefined,
      })),
  };
}

export function buildGeoJson(fc: FeatureCollection): string {
  const features = fc.features.map((f) => {
    const properties: Record<string, unknown> = {};
    if (f.name) properties.name = f.name;
    if (f.description) properties.description = f.description;
    return {
      type: "Feature" as const,
      geometry: f.geometry,
      properties,
    };
  });
  return JSON.stringify({ type: "FeatureCollection", features }, null, 2) + "\n";
}
