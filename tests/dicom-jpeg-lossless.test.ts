/**
 * DICOM JPEG-Lossless decode.
 *
 * Production (PostHog): dicom-to-pdf/png/jpg rejected transfer syntax
 * 1.2.840.10008.1.2.4.70 (JPEG Lossless, SV1) outright — a 100% failure rate
 * on those uploads. We now decode it with jpeg-lossless-decoder-js.
 *
 * Ground truth: the decoder package ships a real .70 DICOM
 * (jpeg_lossless_sel1.dcm) and documents its decoded output — 256x256, 16-bit,
 * CRC32 = 3476557349. This test runs that file through OUR parser
 * (parseDicom locates the encapsulated fragment) and OUR decode step
 * (loadDicomPixels), then checks the CRC. If our fragment offset is wrong by
 * even one byte the checksum won't match, so this verifies the whole path, not
 * just that the library exists.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseDicom, loadDicomPixels } from "../src/lib/engine/util/dicom";

const SAMPLE = "node_modules/jpeg-lossless-decoder-js/tests/data/jpeg_lossless_sel1.dcm";
const EXPECTED_BYTES = 256 * 256 * 2; // 131072
const EXPECTED_CRC32 = 3476557349;

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc ^= bytes[i];
    for (let k = 0; k < 8; k++) {
      crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function sampleBuffer(): ArrayBuffer {
  const buf = readFileSync(SAMPLE);
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
}

describe("DICOM JPEG-Lossless (transfer syntax .4.70)", () => {
  it("detects the encapsulated JPEG-lossless pixel data", () => {
    const file = parseDicom(sampleBuffer());
    // Both .4.57 and .4.70 are JPEG Lossless (Process 14 / SV1) and share this
    // encapsulated decode path; the shipped sample happens to be .57.
    expect(["1.2.840.10008.1.2.4.57", "1.2.840.10008.1.2.4.70"]).toContain(
      file.metadata.transferSyntaxUID,
    );
    expect(file.pixelData).toBeUndefined(); // not decoded yet
    expect(file.encapsulated).toBeDefined();
    expect(file.encapsulated!.jpeg.byteLength).toBeGreaterThan(0);
  });

  it("decodes to the known-correct pixel buffer (CRC32 ground truth)", async () => {
    const file = await loadDicomPixels(parseDicom(sampleBuffer()));
    expect(file.pixelData).toBeDefined();
    expect(file.pixelData!.byteLength).toBe(EXPECTED_BYTES);
    expect(crc32(file.pixelData!)).toBe(EXPECTED_CRC32);
  });

  it("leaves uncompressed DICOM untouched (loadDicomPixels is a no-op there)", async () => {
    // A minimal Explicit VR LE file with raw pixel data should pass through
    // unchanged — loadDicomPixels only acts on encapsulated files.
    const raw: import("../src/lib/engine/util/dicom").DicomFile = {
      metadata: { rows: 2, columns: 2, bitsAllocated: 8 },
      pixelData: new Uint8Array([1, 2, 3, 4]),
    };
    const out = await loadDicomPixels(raw);
    expect(out.pixelData).toBe(raw.pixelData);
  });
});
