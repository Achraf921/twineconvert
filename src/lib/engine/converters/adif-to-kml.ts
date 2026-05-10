import type { Converter } from "../types";
import { ConvertFailedError } from "../types";
import { swapExtension } from "../util/canvas-encode";
import { parseAdif } from "../util/adif";

/**
 * ADIF → KML. Maps each QSO with a Maidenhead grid square (GRIDSQUARE
 * field) to a Google-Earth-friendly KML point. Hams who want to
 * visualize their contacts open the resulting .kml in Google Earth or
 * import it into QGIS / Google My Maps.
 *
 * Maidenhead → lat/lon conversion is well-defined: each field+square+subsquare
 * pair narrows down to a small geographic patch. We use the CENTER of
 * each grid square (most common rendering choice).
 */
const adifToKml: Converter = {
  id: "adif-to-kml",
  label: "ADIF → KML (map)",
  fromMime: ["text/plain", "application/x-adif"],
  accept: [".adi", ".adif"],
  toMime: "application/vnd.google-earth.kml+xml",
  maxFileSizeBytes: 50 * 1024 * 1024,

  async convert(input, opts) {
    opts?.onProgress?.(0.1);
    let kml: string;
    try {
      const text = await input.text();
      const { qsos } = parseAdif(text);
      const points = qsos
        .map((q) => {
          const grid = q.fields.GRIDSQUARE;
          if (!grid) return null;
          const coords = maidenheadToLatLon(grid);
          if (!coords) return null;
          return { qso: q, coords };
        })
        .filter(Boolean) as Array<{ qso: typeof qsos[0]; coords: { lat: number; lon: number } }>;
      kml = buildKml(points);
    } catch (err) {
      throw new ConvertFailedError(
        err instanceof Error ? err.message : "Could not convert ADIF to KML",
        err,
      );
    }
    opts?.onProgress?.(1);
    return {
      blob: new Blob([kml], { type: "application/vnd.google-earth.kml+xml" }),
      filename: swapExtension(input.name, "kml"),
    };
  },
};

function maidenheadToLatLon(grid: string): { lat: number; lon: number } | null {
  const g = grid.toUpperCase();
  if (g.length < 4) return null;
  const A = "A".charCodeAt(0);
  const lonField = g.charCodeAt(0) - A; // 0..17
  const latField = g.charCodeAt(1) - A; // 0..17
  const lonSquare = parseInt(g[2], 10);
  const latSquare = parseInt(g[3], 10);
  if (isNaN(lonSquare) || isNaN(latSquare)) return null;
  let lon = -180 + lonField * 20 + lonSquare * 2;
  let lat = -90 + latField * 10 + latSquare * 1;
  if (g.length >= 6) {
    const lonSub = g.charCodeAt(4) - A;
    const latSub = g.charCodeAt(5) - A;
    lon += lonSub * (2 / 24);
    lat += latSub * (1 / 24);
    // Center of subsquare
    lon += 1 / 24;
    lat += 0.5 / 24;
  } else {
    // Center of square
    lon += 1;
    lat += 0.5;
  }
  return { lat, lon };
}

function escapeXml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!),
  );
}

function buildKml(points: Array<{ qso: import("../util/adif").AdifQso; coords: { lat: number; lon: number } }>): string {
  const placemarks = points
    .map(({ qso, coords }) => {
      const f = qso.fields;
      const name = escapeXml(f.CALL ?? "QSO");
      const desc = escapeXml(
        [
          f.QSO_DATE ? `Date: ${f.QSO_DATE}` : "",
          f.BAND ? `Band: ${f.BAND}` : "",
          f.MODE ? `Mode: ${f.MODE}` : "",
          f.NAME ? `Operator: ${f.NAME}` : "",
          f.QTH ? `QTH: ${f.QTH}` : "",
        ]
          .filter(Boolean)
          .join("\n"),
      );
      return `    <Placemark>
      <name>${name}</name>
      <description>${desc}</description>
      <Point><coordinates>${coords.lon.toFixed(6)},${coords.lat.toFixed(6)},0</coordinates></Point>
    </Placemark>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Ham Radio QSOs</name>
${placemarks}
  </Document>
</kml>`;
}

export default adifToKml;
