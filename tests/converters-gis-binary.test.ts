/**
 * GIS (WKT/WKB <-> GeoJSON) and binary serialization (MessagePack/CBOR
 * <-> JSON) batch tests.
 *
 * Non-shallow: every converter is exercised against real binaries with
 * structural assertions on the output (e.g. WKB byte order + type byte,
 * MessagePack fixmap signature, CBOR major type). Roundtrip pairs are
 * also asserted to recover the exact original value.
 */

import { describe, it, expect } from "vitest";
import { run } from "../src/lib/engine/runner";
import { getMeta } from "../src/lib/engine/registry-meta";
import { fileFromText } from "./fixtures/text-fixtures";
import { fileFromBytes } from "./fixtures/binary-fixtures";

const POINT_WKT = "POINT(30 10)";
const POINT_WKB_HEX = "01010000000000000000003e400000000000002440";

const SAMPLE_GEOJSON_FEATURE = JSON.stringify({
  type: "Feature",
  properties: { name: "Origin" },
  geometry: { type: "Point", coordinates: [30, 10] },
});

const SAMPLE_GEOJSON_FC = JSON.stringify({
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {},
      geometry: { type: "Point", coordinates: [1, 2] },
    },
    {
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: [
          [0, 0],
          [1, 1],
          [2, 0],
        ],
      },
    },
  ],
});

describe("wkt-to-geojson", () => {
  it("parses POINT WKT into a GeoJSON Feature", async () => {
    const result = await run(
      "wkt-to-geojson",
      fileFromText("p.wkt", POINT_WKT, "text/plain"),
    );
    expect(result.blob.type).toContain("geo+json");
    const parsed = JSON.parse(await result.blob.text());
    expect(parsed.type).toBe("Feature");
    expect(parsed.geometry).toEqual({ type: "Point", coordinates: [30, 10] });
  });

  it("parses POLYGON WKT with multiple rings", async () => {
    const wkt = "POLYGON((0 0, 4 0, 4 4, 0 4, 0 0),(1 1, 2 1, 2 2, 1 2, 1 1))";
    const result = await run(
      "wkt-to-geojson",
      fileFromText("ring.wkt", wkt, "text/plain"),
    );
    const parsed = JSON.parse(await result.blob.text());
    expect(parsed.geometry.type).toBe("Polygon");
    expect(parsed.geometry.coordinates).toHaveLength(2);
    expect(parsed.geometry.coordinates[0]).toHaveLength(5);
  });

  it("rejects malformed WKT", async () => {
    await expect(
      run(
        "wkt-to-geojson",
        fileFromText("bad.wkt", "NOT_REAL_GEOMETRY(0 0)", "text/plain"),
      ),
    ).rejects.toThrow();
  });
});

describe("geojson-to-wkt", () => {
  it("emits one WKT literal per feature in a FeatureCollection", async () => {
    const result = await run(
      "geojson-to-wkt",
      fileFromText("fc.geojson", SAMPLE_GEOJSON_FC, "application/geo+json"),
    );
    const text = await result.blob.text();
    const lines = text.trim().split("\n");
    expect(lines).toHaveLength(2);
    expect(lines[0]).toMatch(/^POINT\s*\(1 2\)$/);
    expect(lines[1]).toMatch(/^LINESTRING\s*\(/);
  });

  it("handles bare Feature input", async () => {
    const result = await run(
      "geojson-to-wkt",
      fileFromText("f.geojson", SAMPLE_GEOJSON_FEATURE, "application/geo+json"),
    );
    const text = await result.blob.text();
    expect(text.trim()).toBe("POINT (30 10)");
  });

  it("rejects GeoJSON with no geometries", async () => {
    await expect(
      run(
        "geojson-to-wkt",
        fileFromText(
          "empty.geojson",
          JSON.stringify({ type: "FeatureCollection", features: [] }),
          "application/geo+json",
        ),
      ),
    ).rejects.toThrow(/No GeoJSON geometries/);
  });

  it("round-trip: WKT -> GeoJSON -> WKT preserves coordinates", async () => {
    const r1 = await run(
      "wkt-to-geojson",
      fileFromText("p.wkt", POINT_WKT, "text/plain"),
    );
    const r2 = await run(
      "geojson-to-wkt",
      new File([await r1.blob.text()], "out.geojson", {
        type: "application/geo+json",
      }) as unknown as File,
    );
    expect((await r2.blob.text()).trim()).toBe("POINT (30 10)");
  });
});

describe("wkb-to-geojson", () => {
  it("decodes a hex WKB point", async () => {
    const result = await run(
      "wkb-to-geojson",
      fileFromText("p.wkb", POINT_WKB_HEX, "text/plain"),
    );
    const parsed = JSON.parse(await result.blob.text());
    expect(parsed.type).toBe("Feature");
    expect(parsed.geometry.type).toBe("Point");
    expect(parsed.geometry.coordinates).toEqual([30, 10]);
  });

  it("decodes a binary WKB buffer", async () => {
    const bytes = new Uint8Array(
      POINT_WKB_HEX.match(/.{2}/g)!.map((h) => parseInt(h, 16)),
    );
    const result = await run(
      "wkb-to-geojson",
      fileFromBytes("p.wkb", bytes, "application/wkb"),
    );
    const parsed = JSON.parse(await result.blob.text());
    expect(parsed.geometry.coordinates).toEqual([30, 10]);
  });
});

describe("geojson-to-wkb", () => {
  it("emits a binary blob with WKB-correct header bytes", async () => {
    const result = await run(
      "geojson-to-wkb",
      fileFromText("f.geojson", SAMPLE_GEOJSON_FEATURE, "application/geo+json"),
    );
    expect(result.blob.type).toBe("application/octet-stream");
    const buf = new Uint8Array(await result.blob.arrayBuffer());
    // WKB Point, little-endian: byte 0 = 0x01 (LE), bytes 1-4 = 0x00000001 (Point type).
    expect(buf[0]).toBe(0x01);
    expect(buf[1]).toBe(0x01);
    expect(buf[2]).toBe(0x00);
    expect(buf[3]).toBe(0x00);
    expect(buf[4]).toBe(0x00);
    expect(buf.byteLength).toBe(21);
  });

  it("round-trip: GeoJSON -> WKB -> GeoJSON preserves coordinates", async () => {
    const r1 = await run(
      "geojson-to-wkb",
      fileFromText("f.geojson", SAMPLE_GEOJSON_FEATURE, "application/geo+json"),
    );
    const bytes = new Uint8Array(await r1.blob.arrayBuffer());
    const r2 = await run(
      "wkb-to-geojson",
      fileFromBytes("rt.wkb", bytes, "application/wkb"),
    );
    const parsed = JSON.parse(await r2.blob.text());
    expect(parsed.geometry).toEqual({ type: "Point", coordinates: [30, 10] });
  });
});

describe("json-to-msgpack + msgpack-to-json", () => {
  it("encodes JSON to a fixmap MessagePack signature", async () => {
    const result = await run(
      "json-to-msgpack",
      fileFromText(
        "obj.json",
        JSON.stringify({ hello: "world", n: 42 }),
        "application/json",
      ),
    );
    expect(result.blob.type).toBe("application/msgpack");
    const buf = new Uint8Array(await result.blob.arrayBuffer());
    // fixmap-2 (two-key map) is 0x82 per msgpack spec.
    expect(buf[0]).toBe(0x82);
    expect(buf.byteLength).toBeLessThan(20);
  });

  it("round-trip: JSON -> MessagePack -> JSON preserves the document", async () => {
    const doc = { hello: "world", n: 42, arr: [1, 2, 3] };
    const r1 = await run(
      "json-to-msgpack",
      fileFromText("in.json", JSON.stringify(doc), "application/json"),
    );
    const bytes = new Uint8Array(await r1.blob.arrayBuffer());
    const r2 = await run(
      "msgpack-to-json",
      fileFromBytes("in.msgpack", bytes, "application/msgpack"),
    );
    expect(JSON.parse(await r2.blob.text())).toEqual(doc);
  });

  it("rejects malformed JSON input to json-to-msgpack", async () => {
    await expect(
      run(
        "json-to-msgpack",
        fileFromText("bad.json", "{not json", "application/json"),
      ),
    ).rejects.toThrow();
  });

  it("rejects truncated MessagePack input", async () => {
    await expect(
      run(
        "msgpack-to-json",
        fileFromBytes(
          "trunc.msgpack",
          new Uint8Array([0x82, 0xa5, 0x68]),
          "application/msgpack",
        ),
      ),
    ).rejects.toThrow();
  });
});

describe("json-to-cbor + cbor-to-json", () => {
  it("encodes JSON to a CBOR map", async () => {
    const result = await run(
      "json-to-cbor",
      fileFromText(
        "obj.json",
        JSON.stringify({ hello: "world", n: 42 }),
        "application/json",
      ),
    );
    expect(result.blob.type).toBe("application/cbor");
    const buf = new Uint8Array(await result.blob.arrayBuffer());
    // CBOR major type 5 (map) starts at 0xA0; cbor-x uses tags so we
    // assert non-empty plus that the first byte is a valid CBOR initial
    // byte (map major-type, tag, or record-extension).
    expect(buf.byteLength).toBeGreaterThan(5);
    const major = (buf[0] & 0xe0) >> 5;
    expect([5, 6, 0xd].includes(major) || buf[0] === 0xd9 || buf[0] === 0xb9).toBe(
      true,
    );
  });

  it("round-trip: JSON -> CBOR -> JSON preserves the document", async () => {
    const doc = { hello: "world", n: 42, arr: [1, 2, 3] };
    const r1 = await run(
      "json-to-cbor",
      fileFromText("in.json", JSON.stringify(doc), "application/json"),
    );
    const bytes = new Uint8Array(await r1.blob.arrayBuffer());
    const r2 = await run(
      "cbor-to-json",
      fileFromBytes("in.cbor", bytes, "application/cbor"),
    );
    expect(JSON.parse(await r2.blob.text())).toEqual(doc);
  });

  it("rejects malformed CBOR input", async () => {
    await expect(
      run(
        "cbor-to-json",
        fileFromBytes(
          "bad.cbor",
          new Uint8Array([0xff, 0xff, 0xff]),
          "application/cbor",
        ),
      ),
    ).rejects.toThrow();
  });
});

describe("registry meta wiring", () => {
  const ids = [
    "wkt-to-geojson",
    "geojson-to-wkt",
    "wkb-to-geojson",
    "geojson-to-wkb",
    "msgpack-to-json",
    "json-to-msgpack",
    "cbor-to-json",
    "json-to-cbor",
  ] as const;

  for (const id of ids) {
    it(`${id} is registered with non-empty meta`, () => {
      const meta = getMeta(id);
      expect(meta).toBeDefined();
      expect(meta!.label).toBeTruthy();
      expect(meta!.accept.length).toBeGreaterThan(0);
      expect(meta!.toMime).toBeTruthy();
    });
  }
});
