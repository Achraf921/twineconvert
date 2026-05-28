/**
 * PSD + MSG exotic batch tests (Node-side).
 *
 * What we test here:
 *   - Registry shape: every converter is registered with the right id,
 *     label, accept extensions, fromMime, toMime.
 *   - Runner extension-check fires for wrong inputs BEFORE the lib is
 *     invoked, so this whole file runs in Node without ag-psd/canvas.
 *   - buildEml() emits a valid RFC 5322 header block + body for a known
 *     ParsedMsg shape (covers our own writer, not the msgreader lib).
 *
 * End-to-end PSD tests using a synthetic ag-psd-written PSD live in
 * tests/browser/psd.browser.test.ts where canvas + the DOM are real.
 */

import { describe, it, expect } from "vitest";
import { getMeta } from "../src/lib/engine/registry-meta";
import { run } from "../src/lib/engine/runner";
import { buildEml } from "../src/lib/engine/util/msg";
import { fileFromText } from "./fixtures/text-fixtures";

interface ShapeExpectation {
  id: string;
  label: string;
  accept: string[];
  toMime: string;
}

const EXPECTATIONS: ShapeExpectation[] = [
  { id: "psd-to-png", label: "PSD → PNG", accept: [".psd"], toMime: "image/png" },
  { id: "psd-to-jpg", label: "PSD → JPG", accept: [".psd"], toMime: "image/jpeg" },
  { id: "msg-to-eml", label: "MSG → EML", accept: [".msg"], toMime: "message/rfc822" },
  { id: "msg-to-csv", label: "MSG → CSV", accept: [".msg"], toMime: "text/csv" },
  { id: "msg-to-pdf", label: "MSG → PDF", accept: [".msg"], toMime: "application/pdf" },
];

describe("psd+msg: registry shape", () => {
  for (const exp of EXPECTATIONS) {
    it(`${exp.id} registered with correct meta`, () => {
      const meta = getMeta(exp.id);
      expect(meta, `getMeta returned null for ${exp.id}`).toBeDefined();
      expect(meta!.label).toBe(exp.label);
      expect(meta!.toMime).toBe(exp.toMime);
      for (const ext of exp.accept) expect(meta!.accept).toContain(ext);
    });
  }
});

describe("psd+msg: runner rejects wrong extensions before invoking the lib", () => {
  for (const exp of EXPECTATIONS) {
    it(`${exp.id} rejects a .csv masquerading as input`, async () => {
      const input = fileFromText("wrong.csv", "not a psd or msg", "text/csv");
      await expect(run(exp.id as never, input)).rejects.toThrow(
        new RegExp(`expects .* but got "wrong.csv"`),
      );
    });
  }
});

describe("buildEml(): RFC 5322 writer integrity", () => {
  it("emits all standard headers + body with CRLF separators", () => {
    const eml = buildEml({
      from: "Alice <alice@example.com>",
      to: "Bob <bob@example.com>",
      cc: "Carol <carol@example.com>",
      bcc: "",
      subject: "Project kickoff",
      date: "Mon, 1 Jan 2024 12:00:00 +0000",
      body: "Let's start at 9.\n\nThanks,\nAlice",
      htmlBody: "",
      messageId: "<msg-1@example.com>",
      attachments: [],
    });
    expect(eml).toMatch(/^From: Alice <alice@example.com>\r\n/);
    expect(eml).toMatch(/To: Bob <bob@example.com>\r\n/);
    expect(eml).toMatch(/Cc: Carol <carol@example.com>\r\n/);
    expect(eml).toMatch(/Subject: Project kickoff\r\n/);
    expect(eml).toMatch(/Date: Mon, 1 Jan 2024 12:00:00 \+0000\r\n/);
    expect(eml).toMatch(/Message-ID: <msg-1@example.com>\r\n/);
    expect(eml).toMatch(/MIME-Version: 1\.0\r\n/);
    expect(eml).toMatch(/Content-Type: text\/plain; charset="utf-8"\r\n/);
    // Header block ends with double CRLF, body follows
    expect(eml).toContain("\r\n\r\nLet's start at 9.");
  });

  it("surfaces attachment filenames in an X-Original-Attachments header (no silent loss)", () => {
    const eml = buildEml({
      from: "x@x.com",
      to: "",
      cc: "",
      bcc: "",
      subject: "with attachments",
      date: "",
      body: "see attached",
      htmlBody: "",
      messageId: "",
      attachments: [
        { filename: "report.pdf", mimeType: "application/pdf", bytes: new Uint8Array() },
        { filename: "data.xlsx", mimeType: "application/vnd...", bytes: new Uint8Array() },
      ],
    });
    expect(eml).toMatch(/X-Original-Attachments: report\.pdf; data\.xlsx\r\n/);
  });

  it("does not emit BCC / Subject / Cc headers when empty (no blank fields)", () => {
    const eml = buildEml({
      from: "a@a.com",
      to: "b@b.com",
      cc: "",
      bcc: "",
      subject: "",
      date: "",
      body: "hi",
      htmlBody: "",
      messageId: "",
      attachments: [],
    });
    expect(eml).not.toMatch(/^Cc:/m);
    expect(eml).not.toMatch(/^Bcc:/m);
    expect(eml).not.toMatch(/^Subject:/m);
    expect(eml).toMatch(/From: a@a.com\r\n/);
    expect(eml).toMatch(/\r\n\r\nhi/);
  });
});
