/**
 * Binary fixtures that we generate programmatically, using either our own
 * writers (which doubles as a sanity check for the writer) or hand-crafted
 * bytes for tiny standard formats (PNG, JPEG, etc.).
 *
 * We deliberately do NOT commit binary files to the repo; instead each
 * fixture is built at test time. This keeps the repo lean and means
 * any writer regression breaks fixture creation, which fails loudly.
 */

import type JSZipType from "jszip";
import { buildAse, buildAco, type Palette } from "../../src/lib/engine/util/palette";
import { buildBinaryStl, type Mesh } from "../../src/lib/engine/util/mesh";
import { buildDst, buildPes, buildJef, buildExp, StitchCommand, type EmbroideryDesign } from "../../src/lib/engine/util/embroidery";

/** A 1x1 transparent PNG (smallest valid PNG, hand-crafted). */
export const TINY_PNG_BYTES = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG signature
  0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR length + name
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1
  0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, // bit depth, color type, etc + CRC
  0x00, 0x00, 0x00, 0x0b, 0x49, 0x44, 0x41, 0x54, // IDAT
  0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00, 0x05, 0x00, 0x01, // deflate stream
  0x0d, 0x0a, 0x2d, 0xb4,
  0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82, // IEND
]);

/** A 1x1 white JPEG (hand-crafted minimal). */
export const TINY_JPEG_BYTES = new Uint8Array([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00,
  0x00, 0x01, 0x00, 0x01, 0x00, 0x00,
  0xff, 0xdb, 0x00, 0x43, 0x00,
  ...new Array(64).fill(0x10),
  0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01, 0x00, 0x01, 0x01, 0x01, 0x11, 0x00,
  0xff, 0xc4, 0x00, 0x14, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0xff, 0xc4, 0x00, 0x14, 0x10, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00, 0x00,
  0xff, 0xd9,
]);

const SAMPLE_PALETTE: Palette = {
  name: "Test",
  colors: [
    { r: 255, g: 0, b: 0, name: "Red" },
    { r: 0, g: 255, b: 0, name: "Green" },
    { r: 0, g: 0, b: 255, name: "Blue" },
  ],
};

/** A minimal valid ASE palette (3 colors). */
export function makeTinyAse(): Uint8Array {
  return new Uint8Array(buildAse(SAMPLE_PALETTE));
}

/** A minimal valid ACO palette (3 colors). */
export function makeTinyAco(): Uint8Array {
  return new Uint8Array(buildAco(SAMPLE_PALETTE));
}

/** A unit cube as a Mesh, useful for STL/OBJ/3MF round-trips. */
export const SAMPLE_CUBE_MESH: Mesh = {
  vertices: new Float32Array([
    0, 0, 0,  1, 0, 0,  1, 1, 0,  0, 1, 0, // bottom face
    0, 0, 1,  1, 0, 1,  1, 1, 1,  0, 1, 1, // top face
  ]),
  triangles: new Uint32Array([
    0, 1, 2,  0, 2, 3,   // bottom
    4, 6, 5,  4, 7, 6,   // top
    0, 4, 5,  0, 5, 1,   // front
    1, 5, 6,  1, 6, 2,   // right
    2, 6, 7,  2, 7, 3,   // back
    3, 7, 4,  3, 4, 0,   // left
  ]),
};

/** A binary STL of the unit cube. */
export function makeTinyStl(): Uint8Array {
  return new Uint8Array(buildBinaryStl(SAMPLE_CUBE_MESH));
}

/** A minimal embroidery design with a few stitches and an end marker. */
const SAMPLE_DESIGN: EmbroideryDesign = {
  stitches: [
    { x: 0, y: 0, command: StitchCommand.NORMAL },
    { x: 100, y: 0, command: StitchCommand.NORMAL },
    { x: 100, y: 100, command: StitchCommand.NORMAL },
    { x: 0, y: 100, command: StitchCommand.NORMAL },
    { x: 0, y: 0, command: StitchCommand.END },
  ],
};

export function makeTinyDst(): Uint8Array { return new Uint8Array(buildDst(SAMPLE_DESIGN)); }
export function makeTinyPes(): Uint8Array { return new Uint8Array(buildPes(SAMPLE_DESIGN)); }
export function makeTinyJef(): Uint8Array { return new Uint8Array(buildJef(SAMPLE_DESIGN)); }
export function makeTinyExp(): Uint8Array { return new Uint8Array(buildExp(SAMPLE_DESIGN)); }

/** A trivial valid ZIP containing a single text file. Used as a stand-in
 *  for any "X is a zip" format we want to smoke-test (epub, docx, ase
 *  is NOT a zip but iWork/EPUB are). */
export async function makeTinyZip(): Promise<Uint8Array> {
  const JSZip = (await import("jszip")).default as typeof JSZipType;
  const zip = new JSZip();
  zip.file("hello.txt", "world");
  const buf = await zip.generateAsync({ type: "uint8array" });
  return buf;
}

/** Wrap a Uint8Array as a File. */
export function fileFromBytes(name: string, bytes: Uint8Array, type = "application/octet-stream"): File {
  const buf = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  return new File([buf], name, { type });
}

// ============================================================================
// Programmatic builders for binary fixtures we can synthesize using
// libraries already in our dependency tree. The output of each builder
// is a real, decodable file in the target format, not a fake stub.
// ============================================================================

/** A minimal valid PDF with one page of text. Built via pdf-lib. */
export async function makeTinyPdf(): Promise<Uint8Array> {
  const { PDFDocument } = await import("pdf-lib");
  const doc = await PDFDocument.create();
  const page = doc.addPage([300, 200]);
  page.drawText("Test PDF", { x: 50, y: 100, size: 24 });
  return doc.save();
}

/** A minimal valid DOCX with one paragraph. Built via the docx lib. */
export async function makeTinyDocx(): Promise<Uint8Array> {
  const { Document, Packer, Paragraph, TextRun } = await import("docx");
  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({ children: [new TextRun("Hello world.")] }),
        new Paragraph({ children: [new TextRun("Second paragraph.")] }),
      ],
    }],
  });
  const blob = await Packer.toBlob(doc);
  return new Uint8Array(await blob.arrayBuffer());
}

/** A minimal valid XLSX with a 3x3 sheet. Built via SheetJS. */
export async function makeTinyXlsx(): Promise<Uint8Array> {
  const XLSXModule = await import("xlsx");
  const XLSX = XLSXModule.default ?? XLSXModule;
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([
    ["name", "age", "city"],
    ["Alice", 30, "Paris"],
    ["Bob", 25, "London"],
  ]);
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  // SheetJS returns ArrayBuffer (not Uint8Array) for type:"array" in
  // recent versions; coerce so callers can treat it uniformly.
  const out = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  return out instanceof Uint8Array ? out : new Uint8Array(out as ArrayBuffer);
}

/** A minimal valid ODS (OpenDocument spreadsheet). Same in-memory workbook
 *  as makeTinyXlsx() — SheetJS handles both formats from a single book model. */
export async function makeTinyOds(): Promise<Uint8Array> {
  const XLSXModule = await import("xlsx");
  const XLSX = XLSXModule.default ?? XLSXModule;
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([
    ["name", "age", "city"],
    ["Alice", 30, "Paris"],
    ["Bob", 25, "London"],
  ]);
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  const out = XLSX.write(wb, { type: "array", bookType: "ods" });
  return out instanceof Uint8Array ? out : new Uint8Array(out as ArrayBuffer);
}

/** A minimal valid EPUB. Built by hand-assembling the zip structure. */
export async function makeTinyEpub(): Promise<Uint8Array> {
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  zip.file("mimetype", "application/epub+zip");
  zip.file("META-INF/container.xml", `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`);
  zip.file("OEBPS/content.opf", `<?xml version="1.0" encoding="UTF-8"?>
<package version="2.0" xmlns="http://www.idpf.org/2007/opf" unique-identifier="bookid">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>Test Book</dc:title>
    <dc:identifier id="bookid">test-id</dc:identifier>
    <dc:language>en</dc:language>
  </metadata>
  <manifest>
    <item id="ch1" href="chapter1.xhtml" media-type="application/xhtml+xml"/>
  </manifest>
  <spine><itemref idref="ch1"/></spine>
</package>`);
  zip.file("OEBPS/chapter1.xhtml", `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html><html xmlns="http://www.w3.org/1999/xhtml"><head><title>Chapter 1</title></head>
<body><h1>Chapter 1</h1><p>This is the first paragraph.</p></body></html>`);
  return zip.generateAsync({ type: "uint8array" });
}

/** A minimal valid 3MF wrapping the unit cube mesh. Built via our own writer. */
export async function makeTiny3mf(): Promise<Uint8Array> {
  const { buildThreeMf } = await import("../../src/lib/engine/util/mesh");
  const blob = await buildThreeMf(SAMPLE_CUBE_MESH);
  return new Uint8Array(await blob.arrayBuffer());
}

/** A minimal valid MIDI file (one track, one note). Built via midi-file. */
export async function makeTinyMidi(): Promise<Uint8Array> {
  const { writeMidi } = await import("midi-file");
  const data = writeMidi({
    header: { format: 1, numTracks: 1, ticksPerBeat: 480 },
    tracks: [[
      { type: "noteOn", channel: 0, noteNumber: 60, velocity: 80, deltaTime: 0 },
      { type: "noteOff", channel: 0, noteNumber: 60, velocity: 0, deltaTime: 480 },
      { type: "endOfTrack", deltaTime: 0 },
    ]],
  });
  return new Uint8Array(data);
}

/** A minimal valid MXL (compressed MusicXML). */
export async function makeTinyMxl(): Promise<Uint8Array> {
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  zip.file("META-INF/container.xml", `<?xml version="1.0" encoding="UTF-8"?>
<container>
  <rootfiles>
    <rootfile full-path="score.xml" media-type="application/vnd.recordare.musicxml+xml"/>
  </rootfiles>
</container>`);
  zip.file("score.xml", `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<score-partwise version="3.1">
  <part-list><score-part id="P1"><part-name>Music</part-name></score-part></part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>4</divisions>
        <key><fifths>0</fifths></key>
        <time><beats>4</beats><beat-type>4</beat-type></time>
        <clef><sign>G</sign><line>2</line></clef>
      </attributes>
      <note>
        <pitch><step>C</step><octave>4</octave></pitch>
        <duration>4</duration>
        <type>quarter</type>
      </note>
    </measure>
  </part>
</score-partwise>`);
  return zip.generateAsync({ type: "uint8array" });
}

/** A minimal 3DL LUT. Size 4 because our parser requires the coordinate
 *  ladder to have > 3 entries to disambiguate from a normal RGB triplet
 *  line. 4^3 = 64 entries, still tiny. */
export function makeTiny3dl(): string {
  const ladder = [0, 341, 682, 1023];
  const lines = [ladder.join(" ")];
  // 3DL is B-major ordering: outer B, middle G, inner R
  for (let bi = 0; bi < 4; bi++) {
    for (let gi = 0; gi < 4; gi++) {
      for (let ri = 0; ri < 4; ri++) {
        lines.push(`${ladder[ri]} ${ladder[gi]} ${ladder[bi]}`);
      }
    }
  }
  return lines.join("\n") + "\n";
}

/** A minimal CSP LUT (size 2). */
export function makeTinyCsp(): string {
  const lines = [
    "CSPLUTV100", "3D",
    "BEGIN METADATA", "test", "END METADATA", "",
    "2", "0.0 1.0", "0.0 1.0",
    "2", "0.0 1.0", "0.0 1.0",
    "2", "0.0 1.0", "0.0 1.0",
    "",
    "2 2 2",
  ];
  for (let b = 0; b < 2; b++) {
    for (let g = 0; g < 2; g++) {
      for (let r = 0; r < 2; r++) {
        lines.push(`${r.toFixed(6)} ${g.toFixed(6)} ${b.toFixed(6)}`);
      }
    }
  }
  return lines.join("\n") + "\n";
}

/** Minimal Apple Health export.zip with one of each record type our
 *  per-metric converters filter by (steps / heart rate / sleep / workout). */
export async function makeTinyAppleHealthZip(): Promise<Uint8Array> {
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  zip.file("apple_health_export/export.xml", `<?xml version="1.0" encoding="UTF-8"?>
<HealthData locale="en_US">
  <ExportDate value="2024-01-01 12:00:00 -0500"/>
  <Record type="HKQuantityTypeIdentifierStepCount" sourceName="iPhone" unit="count" startDate="2024-01-01 08:00:00 -0500" endDate="2024-01-01 09:00:00 -0500" value="1234"/>
  <Record type="HKQuantityTypeIdentifierHeartRate" sourceName="Apple Watch" unit="count/min" startDate="2024-01-01 08:30:00 -0500" endDate="2024-01-01 08:30:00 -0500" value="72"/>
  <Record type="HKCategoryTypeIdentifierSleepAnalysis" sourceName="Apple Watch" startDate="2024-01-01 23:00:00 -0500" endDate="2024-01-02 07:00:00 -0500" value="HKCategoryValueSleepAnalysisAsleep"/>
  <Workout workoutActivityType="HKWorkoutActivityTypeRunning" duration="30" totalDistance="5" totalDistanceUnit="km" totalEnergyBurned="250" totalEnergyBurnedUnit="kcal" sourceName="Apple Watch" startDate="2024-01-01 07:00:00 -0500" endDate="2024-01-01 07:30:00 -0500"/>
</HealthData>`);
  return zip.generateAsync({ type: "uint8array" });
}

/** Minimal Twitter archive zip. Modern Twitter GDPR exports include
 *  many manifest files; twitter-archive-reader needs at minimum
 *  manifest.js + account.js + tweets.js + profile.js + verified.js
 *  to initialize without throwing. We provide stubs for all of them. */
export async function makeTinyTwitterArchiveZip(): Promise<Uint8Array> {
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  // Manifest tells the reader this is a GDPR archive
  zip.file("data/manifest.js", `window.__THAR_CONFIG = {
    "userInfo": { "accountId": "12345", "userName": "testuser", "displayName": "Test User" },
    "archiveInfo": { "sizeBytes": 1024, "type": "user", "generationDate": "2024-01-01T00:00:00.000Z" },
    "readmeInfo": { "fileName": "Your archive.html", "directory": "/", "name": "Your archive" },
    "dataTypes": {
      "account": { "files": [{ "fileName": "data/account.js", "globalName": "YTD.account.part0", "count": "1" }] },
      "tweets": { "files": [{ "fileName": "data/tweets.js", "globalName": "YTD.tweets.part0", "count": "2" }] },
      "profile": { "files": [{ "fileName": "data/profile.js", "globalName": "YTD.profile.part0", "count": "1" }] },
      "verified": { "files": [{ "fileName": "data/verified.js", "globalName": "YTD.verified.part0", "count": "1" }] }
    }
  }`);
  zip.file("data/account.js", `window.YTD.account.part0 = ${JSON.stringify([
    { account: { username: "testuser", accountId: "12345", createdAt: "2020-01-01T00:00:00.000Z", accountDisplayName: "Test User" } },
  ])}`);
  zip.file("data/tweets.js", `window.YTD.tweets.part0 = ${JSON.stringify([
    { tweet: { id_str: "1", created_at: "Mon Jan 01 12:00:00 +0000 2024", full_text: "First tweet", retweet_count: "5", favorite_count: "10", entities: { hashtags: [], symbols: [], user_mentions: [], urls: [] } } },
    { tweet: { id_str: "2", created_at: "Mon Jan 02 12:00:00 +0000 2024", full_text: "Second tweet", retweet_count: "0", favorite_count: "3", entities: { hashtags: [], symbols: [], user_mentions: [], urls: [] } } },
  ])}`);
  zip.file("data/profile.js", `window.YTD.profile.part0 = ${JSON.stringify([
    { profile: { description: { bio: "test bio", website: "", location: "" }, headerMediaUrl: "", avatarMediaUrl: "" } },
  ])}`);
  zip.file("data/verified.js", `window.YTD.verified.part0 = ${JSON.stringify([
    { verified: { accountId: "12345", verified: false } },
  ])}`);
  return zip.generateAsync({ type: "uint8array" });
}

/** Minimal Instagram data export zip. */
export async function makeTinyInstagramZip(): Promise<Uint8Array> {
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  zip.file("your_instagram_activity/content/posts_1.json", JSON.stringify([
    { creation_timestamp: 1704067200, title: "Test caption", media: [{ uri: "media/photo.jpg" }] },
  ]));
  return zip.generateAsync({ type: "uint8array" });
}

/** Minimal Facebook archive zip with posts. */
export async function makeTinyFacebookZip(): Promise<Uint8Array> {
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  zip.file("your_facebook_activity/posts/your_posts__check_ins__photos_and_videos_1.json", JSON.stringify([
    { timestamp: 1704067200, data: [{ post: "Test Facebook post" }] },
  ]));
  return zip.generateAsync({ type: "uint8array" });
}

/** Minimal iWork .pages document, zip with embedded preview.pdf. */
export async function makeTinyIworkPages(): Promise<Uint8Array> {
  const JSZip = (await import("jszip")).default;
  const pdfBytes = await makeTinyPdf();
  const zip = new JSZip();
  zip.file("preview.pdf", pdfBytes);
  zip.file("Index.zip", new Uint8Array([1, 2, 3])); // placeholder iWork content
  return zip.generateAsync({ type: "uint8array" });
}
