/**
 * Verify that the eml-to-html converter strips XSS payloads from
 * malicious email HTML bodies. Without sanitization the output HTML
 * file would execute attacker scripts when the user opens it (a stored
 * XSS that bypasses the user's webmail client's own filter).
 */

import { describe, it, expect } from "vitest";
import { run } from "../../src/lib/engine/runner";

const HOSTILE_EML = `From: attacker@example.com
To: victim@example.com
Subject: Innocent
Content-Type: text/html; charset=utf-8

<html><body>
<p>Hello!</p>
<script>window._XSS_FIRED = true</script>
<img src=x onerror="window._XSS_IMG = true">
<a href="javascript:window._XSS_HREF = true">click</a>
<iframe src="javascript:window._XSS_IFRAME = true"></iframe>
</body></html>
`;

describe("eml-to-html sanitization", () => {
  it("strips <script>, on* handlers, javascript: URLs, iframes", async () => {
    const eml = new File([HOSTILE_EML], "hostile.eml", { type: "message/rfc822" });
    const result = await run("eml-to-html", eml);
    const html = await result.blob.text();
    // Sanity: visible body should still be there
    expect(html).toContain("Hello!");
    // None of the XSS surfaces should survive
    expect(html.toLowerCase()).not.toContain("<script");
    expect(html.toLowerCase()).not.toContain("onerror");
    expect(html.toLowerCase()).not.toContain("javascript:");
    expect(html.toLowerCase()).not.toContain("<iframe");
  });
});
