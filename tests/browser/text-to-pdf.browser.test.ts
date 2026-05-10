/**
 * Browser tests for the "text input, PDF output" family. These need a
 * real browser because the underlying generation uses jspdf +
 * html2canvas, which both require Canvas.
 */

import { describe, it } from "vitest";
import { run } from "../../src/lib/engine/runner";
import { expectMagic, MAGIC } from "./helpers";
import { assertPdfContains, assertPdfNotBlank } from "./quality";

const TINY_EML = `From: alice@example.com
To: bob@example.com
Subject: Hello twineconvert
Date: Tue, 10 May 2026 12:00:00 +0000
Content-Type: text/plain; charset=utf-8

This is a test email body for the eml-to-pdf converter.
Multiple lines.

Best,
Alice
`;

const TINY_MBOX = `From alice@example.com Tue May 10 12:00:00 2026
From: alice@example.com
To: bob@example.com
Subject: Mbox test 1
Date: Tue, 10 May 2026 12:00:00 +0000

First message body.

From bob@example.com Tue May 10 12:05:00 2026
From: bob@example.com
To: alice@example.com
Subject: Mbox test 2
Date: Tue, 10 May 2026 12:05:00 +0000

Second message body.
`;

const TINY_GEDCOM = `0 HEAD
1 SOUR twineconvert
1 GEDC
2 VERS 5.5.1
2 FORM LINEAGE-LINKED
1 CHAR UTF-8
0 @I1@ INDI
1 NAME John /Doe/
1 SEX M
1 BIRT
2 DATE 1 JAN 1900
0 @I2@ INDI
1 NAME Jane /Doe/
1 SEX F
1 BIRT
2 DATE 1 FEB 1905
0 @F1@ FAM
1 HUSB @I1@
1 WIFE @I2@
0 TRLR
`;

const TINY_WHATSAPP = `[10/05/2026, 12:00:00] Alice: Hello bob
[10/05/2026, 12:01:00] Bob: Hey alice
[10/05/2026, 12:02:00] Alice: How are you?
[10/05/2026, 12:03:00] Bob: Doing well thanks
`;

// DiscordChatExporter export shape: top-level object with guild, channel, and messages.
const TINY_DISCORD = JSON.stringify({
  guild: { name: "TestServer" },
  channel: { name: "general", topic: "" },
  messages: [
    { id: "1", timestamp: "2026-05-10T12:00:00Z", author: { name: "Alice", nickname: "Alice" }, content: "Hello", attachments: [], reactions: [] },
    { id: "2", timestamp: "2026-05-10T12:01:00Z", author: { name: "Bob", nickname: "Bob" }, content: "Hi", attachments: [], reactions: [] },
  ],
});

function fileFromString(name: string, content: string, mime: string): File {
  return new File([content], name, { type: mime });
}

// Known limitation: these converters use jspdf.html() with html2canvas,
// which rasterizes HTML as a bitmap inside the PDF. The output PDF has
// no extractable text, only a rendered image. assertPdfContains would
// fail across the board even when the visual content is correct.
//
// We use assertPdfNotBlank to at least catch "the PDF is structurally
// valid but the page is empty" regressions. Switching to text-mode PDFs
// (so customers can search/copy-paste from the export) is tracked as
// engine work item PDF-SEARCHABLE; the test suite already has hooks for
// it (assertPdfContains is ready, just needs the engine to emit text).
describe("text-input PDF converters (browser, content-checked)", () => {
  it("eml-to-pdf produces a SEARCHABLE PDF with the email content", async () => {
    const eml = fileFromString("test.eml", TINY_EML, "message/rfc822");
    const result = await run("eml-to-pdf", eml);
    await expectMagic(result.blob, MAGIC.PDF);
    await assertPdfNotBlank(result.blob);
    await assertPdfContains(result.blob, [
      "alice@example.com",
      "Hello twineconvert",
      "test email body",
    ]);
  }, 60000);

  it("mbox-to-pdf produces a SEARCHABLE PDF with both messages", async () => {
    const mbox = fileFromString("test.mbox", TINY_MBOX, "application/mbox");
    const result = await run("mbox-to-pdf", mbox);
    await expectMagic(result.blob, MAGIC.PDF);
    await assertPdfNotBlank(result.blob);
    await assertPdfContains(result.blob, [
      "Mbox test 1",
      "Mbox test 2",
      "First message body",
      "Second message body",
    ]);
  }, 60000);

  it("gedcom-to-pdf produces a SEARCHABLE PDF with both individuals", async () => {
    const ged = fileFromString("test.ged", TINY_GEDCOM, "text/plain");
    const result = await run("gedcom-to-pdf", ged);
    await expectMagic(result.blob, MAGIC.PDF);
    await assertPdfNotBlank(result.blob);
    await assertPdfContains(result.blob, ["John", "Doe", "Jane"]);
  }, 60000);

  it("whatsapp-chat-to-pdf produces a SEARCHABLE PDF with chat lines", async () => {
    const chat = fileFromString("_chat.txt", TINY_WHATSAPP, "text/plain");
    const result = await run("whatsapp-chat-to-pdf", chat);
    await expectMagic(result.blob, MAGIC.PDF);
    await assertPdfNotBlank(result.blob);
    await assertPdfContains(result.blob, [
      "Alice",
      "Bob",
      "Hello bob",
      "Doing well thanks",
    ]);
  }, 60000);

  it("discord-chat-to-pdf produces a SEARCHABLE PDF with authors and content", async () => {
    const chat = fileFromString("messages.json", TINY_DISCORD, "application/json");
    const result = await run("discord-chat-to-pdf", chat);
    await expectMagic(result.blob, MAGIC.PDF);
    await assertPdfNotBlank(result.blob);
    await assertPdfContains(result.blob, ["Alice", "Bob", "Hello", "Hi"]);
  }, 60000);
});
