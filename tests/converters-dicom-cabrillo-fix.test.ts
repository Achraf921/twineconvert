/**
 * Two PostHog-driven production fixes:
 *  1. dicom-to-* accept extensionless / numerically-named files (IM1,
 *     IM4, I0000001) — how real DICOM studies are named on CDs/PACS.
 *     Previously the .dcm/.dicom extension gate rejected all of them
 *     (54 failures, 0 successes). Validation now happens on the DICM
 *     magic bytes inside the parser.
 *  2. cabrillo-to-adif no longer crashes on a QSO line with only 8
 *     fields (missing the received RST/exchange): buildAdif skipped a
 *     field whose value was undefined and hit `undefined.length`.
 */

import { describe, it, expect } from "vitest";
import { run } from "../src/lib/engine/runner";
import { makeTinyDicom, fileFromBytes } from "./fixtures/binary-fixtures";

const DICOM_OCTET = "application/octet-stream";

describe("dicom: extensionless / numerically-named files convert", () => {
  it("dicom-to-json accepts an extensionless IM4 (octet-stream) file", async () => {
    const out = await run("dicom-to-json", fileFromBytes("IM4", makeTinyDicom(), DICOM_OCTET));
    const meta = JSON.parse(await out.blob.text());
    expect(meta).toBeTruthy();
    expect(out.filename).toMatch(/\.json$/);
  });

  it("dicom-to-json accepts a numerically-named I0000001 file with empty mime", async () => {
    const out = await run("dicom-to-json", fileFromBytes("I0000001", makeTinyDicom(), ""));
    expect(JSON.parse(await out.blob.text())).toBeTruthy();
  });

  it("a proper .dcm still works (no regression)", async () => {
    const out = await run("dicom-to-json", fileFromBytes("scan.dcm", makeTinyDicom(), "application/dicom"));
    expect(JSON.parse(await out.blob.text())).toBeTruthy();
  });

  it("a non-DICOM file dropped on the tool fails with a clear magic-bytes error", async () => {
    const notDicom = new TextEncoder().encode("this is plainly not a DICOM file, ".repeat(8));
    await expect(
      run("dicom-to-json", fileFromBytes("photo.jpg", notDicom, "image/jpeg")),
    ).rejects.toThrow(/DICOM|DICM/i);
  });
});

describe("cabrillo-to-adif: 8-field QSO line no longer crashes", () => {
  const f = (c: string) => new File([c], "contest.cbr", { type: "text/plain" }) as unknown as File;

  it("converts a QSO line missing the received RST/exchange (8 fields)", async () => {
    const log = "START-OF-LOG: 3.0\nQSO: 14250 PH 2024-01-15 1230 W1AW 59 CT K2XX\nEND-OF-LOG:\n";
    const adi = await (await run("cabrillo-to-adif", f(log))).blob.text();
    expect(adi).toMatch(/<CALL:4>K2XX/);
    expect(adi).toMatch(/<STATION_CALLSIGN:4>W1AW/);
    expect(adi).toMatch(/<EOR>/);
    // The absent RST_RCVD field is simply omitted, not emitted broken.
    expect(adi).not.toMatch(/<RST_RCVD:/);
  });

  it("converts a full 10-field QSO line with the received exchange", async () => {
    const log = "QSO: 14250 PH 2024-01-15 1230 W1AW 59 CT K2XX 59 NY\n";
    const adi = await (await run("cabrillo-to-adif", f(log))).blob.text();
    expect(adi).toMatch(/<CALL:4>K2XX/);
    expect(adi).toMatch(/<RST_RCVD:2>59/);
    expect(adi).toMatch(/<SRX:2>NY/);
  });
});
