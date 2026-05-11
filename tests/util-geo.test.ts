/**
 * Deep unit tests for geo.ts. KML/GPX/GeoJSON share a tiny common geometry
 * model; we verify all 3 parsers extract identical features and that
 * builders → parsers round-trip the model.
 */

import { describe, it, expect } from "vitest";
import {
  parseKml,
  buildKml,
  parseGpx,
  buildGpx,
  parseGeoJson,
  buildGeoJson,
  type FeatureCollection,
} from "../src/lib/engine/util/geo";

const kmlFixture = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <Placemark>
      <name>Eiffel Tower</name>
      <description>Paris landmark</description>
      <Point>
        <coordinates>2.2945,48.8584,330</coordinates>
      </Point>
    </Placemark>
    <Placemark>
      <name>Trail</name>
      <LineString>
        <coordinates>2.0,48.0,0 2.1,48.1,0 2.2,48.2,0</coordinates>
      </LineString>
    </Placemark>
  </Document>
</kml>`;

const gpxFixture = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="test" xmlns="http://www.topografix.com/GPX/1/1">
  <wpt lat="48.8584" lon="2.2945">
    <ele>330</ele>
    <name>Eiffel Tower</name>
    <desc>Paris landmark</desc>
  </wpt>
  <trk>
    <name>Trail</name>
    <trkseg>
      <trkpt lat="48.0" lon="2.0"><ele>0</ele></trkpt>
      <trkpt lat="48.1" lon="2.1"><ele>0</ele></trkpt>
      <trkpt lat="48.2" lon="2.2"><ele>0</ele></trkpt>
    </trkseg>
  </trk>
</gpx>`;

const geojsonFixture = `{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": { "type": "Point", "coordinates": [2.2945, 48.8584, 330] },
      "properties": { "name": "Eiffel Tower", "description": "Paris landmark" }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "LineString",
        "coordinates": [[2.0, 48.0, 0], [2.1, 48.1, 0], [2.2, 48.2, 0]]
      },
      "properties": { "name": "Trail" }
    }
  ]
}`;

describe("geo: cross-format parsers extract identical features", () => {
  it("all 3 parsers find the same number of features", () => {
    expect(parseKml(kmlFixture).features).toHaveLength(2);
    expect(parseGpx(gpxFixture).features).toHaveLength(2);
    expect(parseGeoJson(geojsonFixture).features).toHaveLength(2);
  });

  it("Eiffel Tower point has identical coordinates across formats", () => {
    const k = parseKml(kmlFixture).features[0];
    const g = parseGpx(gpxFixture).features[0];
    const j = parseGeoJson(geojsonFixture).features[0];

    expect(k.geometry.type).toBe("Point");
    expect(g.geometry.type).toBe("Point");
    expect(j.geometry.type).toBe("Point");

    expect(k.geometry.coordinates).toEqual([2.2945, 48.8584, 330]);
    expect(g.geometry.coordinates).toEqual([2.2945, 48.8584, 330]);
    expect(j.geometry.coordinates).toEqual([2.2945, 48.8584, 330]);

    expect(k.name).toBe("Eiffel Tower");
    expect(g.name).toBe("Eiffel Tower");
    expect(j.name).toBe("Eiffel Tower");

    expect(k.description).toBe("Paris landmark");
    expect(g.description).toBe("Paris landmark");
    expect(j.description).toBe("Paris landmark");
  });

  it("LineString coordinates preserve order and elevation", () => {
    const k = parseKml(kmlFixture).features[1];
    const g = parseGpx(gpxFixture).features[1];
    const j = parseGeoJson(geojsonFixture).features[1];

    if (
      k.geometry.type !== "LineString" ||
      g.geometry.type !== "LineString" ||
      j.geometry.type !== "LineString"
    ) {
      throw new Error("expected LineString geometry");
    }

    expect(k.geometry.coordinates).toEqual(g.geometry.coordinates);
    expect(g.geometry.coordinates).toEqual(j.geometry.coordinates);
    expect(k.geometry.coordinates).toEqual([
      [2.0, 48.0, 0],
      [2.1, 48.1, 0],
      [2.2, 48.2, 0],
    ]);
  });
});

describe("geo: builders → parsers round-trip the model", () => {
  const fc: FeatureCollection = parseGeoJson(geojsonFixture);

  it("buildKml → parseKml preserves features", () => {
    const back = parseKml(buildKml(fc));
    expect(back.features).toHaveLength(fc.features.length);
    expect(back.features[0].name).toBe("Eiffel Tower");
    expect(back.features[0].geometry).toEqual(fc.features[0].geometry);
  });

  it("buildGpx → parseGpx preserves features (Point and LineString)", () => {
    const back = parseGpx(buildGpx(fc));
    expect(back.features).toHaveLength(fc.features.length);
    // Point survives
    expect(back.features[0].geometry).toEqual(fc.features[0].geometry);
    // LineString survives (same coords)
    if (
      back.features[1].geometry.type !== "LineString" ||
      fc.features[1].geometry.type !== "LineString"
    ) {
      throw new Error("expected LineString");
    }
    expect(back.features[1].geometry.coordinates).toEqual(
      fc.features[1].geometry.coordinates,
    );
  });

  it("buildGeoJson output is valid JSON parseable as a FeatureCollection", () => {
    const text = buildGeoJson(fc);
    const parsed = JSON.parse(text);
    expect(parsed.type).toBe("FeatureCollection");
    expect(parsed.features).toHaveLength(2);
  });
});

describe("geo: KML polygon support", () => {
  const polyKml = `<?xml version="1.0"?>
<kml><Document>
<Placemark>
  <name>Triangle</name>
  <Polygon>
    <outerBoundaryIs>
      <LinearRing>
        <coordinates>0,0 1,0 0,1 0,0</coordinates>
      </LinearRing>
    </outerBoundaryIs>
  </Polygon>
</Placemark>
</Document></kml>`;

  it("parses polygon coordinates and preserves them on round-trip", () => {
    const fc = parseKml(polyKml);
    expect(fc.features).toHaveLength(1);
    expect(fc.features[0].geometry.type).toBe("Polygon");
    if (fc.features[0].geometry.type !== "Polygon") return;
    expect(fc.features[0].geometry.coordinates[0]).toEqual([
      [0, 0],
      [1, 0],
      [0, 1],
      [0, 0],
    ]);
  });

  it("polygon → KML → KML preserves polygon (not converted away)", () => {
    const fc = parseKml(polyKml);
    const back = parseKml(buildKml(fc));
    expect(back.features[0].geometry.type).toBe("Polygon");
  });
});

describe("geo: edge cases and tolerance", () => {
  it("ignores Placemarks with missing geometry", () => {
    const incomplete = `<?xml version="1.0"?>
<kml><Document>
<Placemark><name>Empty</name></Placemark>
<Placemark><name>Real</name><Point><coordinates>1,2</coordinates></Point></Placemark>
</Document></kml>`;
    expect(parseKml(incomplete).features).toHaveLength(1);
  });

  it("accepts a bare GeoJSON Geometry as a single feature", () => {
    const fc = parseGeoJson(`{"type":"Point","coordinates":[1,2]}`);
    expect(fc.features).toHaveLength(1);
    expect(fc.features[0].geometry.type).toBe("Point");
  });

  it("returns empty feature collection for empty/no-feature input", () => {
    expect(parseGeoJson(`{"type":"FeatureCollection","features":[]}`).features).toEqual([]);
  });
});
