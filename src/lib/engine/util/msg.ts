/**
 * Outlook .msg parse helper. Wraps @kenjiuno/msgreader so converters
 * get a consistent ParsedMsg shape regardless of how MsgReader names
 * its many fields, and so the RFC 5322 / CSV writers stay simple.
 *
 * .msg is the OLE compound-document Outlook serialises a single
 * message to. The library reads the container, we map the fields
 * Outlook users actually care about into our own minimal struct.
 */

export interface ParsedMsg {
  from: string;
  to: string;
  cc: string;
  bcc: string;
  subject: string;
  date: string;
  body: string;
  htmlBody: string;
  messageId: string;
  attachments: Array<{ filename: string; mimeType: string; bytes: Uint8Array }>;
}

export async function parseMsg(input: ArrayBuffer): Promise<ParsedMsg> {
  const MsgReaderModule = await import("@kenjiuno/msgreader");
  // CJS interop: prefer .default but fall back to the namespace itself.
  const MsgReader = (MsgReaderModule.default ??
    MsgReaderModule) as unknown as new (
    buf: ArrayBuffer | DataView,
  ) => {
    getFileData(): unknown;
    getAttachment(att: unknown): { fileName?: string; content?: Uint8Array };
  };
  const reader = new MsgReader(input);
  const f = reader.getFileData() as Record<string, unknown> & {
    attachments?: Array<Record<string, unknown>>;
  };

  const join = (xs: unknown[]): string =>
    xs
      .filter((x) => typeof x === "string" && x.length > 0)
      .join(", ");

  // MsgReader fields vary slightly between message versions; collect
  // recipients from .recipients[] when present, otherwise fall back
  // to the per-field strings.
  const recipientsByType = (type: string): string[] => {
    const rs = (f.recipients as Array<Record<string, unknown>> | undefined) ?? [];
    return rs
      .filter((r) => String(r.recipType ?? "").toLowerCase() === type)
      .map((r) =>
        typeof r.email === "string" && r.email
          ? typeof r.name === "string" && r.name
            ? `${r.name} <${r.email}>`
            : r.email
          : typeof r.name === "string"
            ? r.name
            : "",
      )
      .filter((s) => s.length > 0);
  };

  const atts = (f.attachments ?? []).map((a) => {
    const got = reader.getAttachment(a);
    return {
      filename: String(got.fileName ?? a.fileName ?? "attachment"),
      mimeType: String(a.mimeType ?? "application/octet-stream"),
      bytes: got.content ?? new Uint8Array(0),
    };
  });

  return {
    from:
      typeof f.senderEmail === "string" && f.senderEmail
        ? typeof f.senderName === "string" && f.senderName
          ? `${f.senderName} <${f.senderEmail}>`
          : (f.senderEmail as string)
        : (f.senderName as string) ?? "",
    to: join(recipientsByType("to")) || ((f.displayTo as string) ?? ""),
    cc: join(recipientsByType("cc")) || ((f.displayCc as string) ?? ""),
    bcc: join(recipientsByType("bcc")) || ((f.displayBcc as string) ?? ""),
    subject: (f.subject as string) ?? "",
    date:
      (f.messageDeliveryTime as string) ??
      (f.clientSubmitTime as string) ??
      (f.creationTime as string) ??
      "",
    body: (f.body as string) ?? "",
    htmlBody: (f.bodyHtml as string) ?? (f.compressedRtf as string) ?? "",
    messageId: (f.internetMessageId as string) ?? "",
    attachments: atts,
  };
}

/**
 * Build an RFC 5322 .eml byte string from a ParsedMsg. We emit the
 * common headers + a text/plain body. Attachments are surfaced as a
 * filename list in an `X-Original-Attachments` header so users do not
 * silently lose track of them. Full multipart MIME packaging is more
 * than this round-trip needs; if a user needs the binary attachments
 * intact they should use a dedicated tool.
 */
export function buildEml(msg: ParsedMsg): string {
  const headers: string[] = [];
  if (msg.from) headers.push(`From: ${foldHeader(msg.from)}`);
  if (msg.to) headers.push(`To: ${foldHeader(msg.to)}`);
  if (msg.cc) headers.push(`Cc: ${foldHeader(msg.cc)}`);
  if (msg.bcc) headers.push(`Bcc: ${foldHeader(msg.bcc)}`);
  if (msg.subject) headers.push(`Subject: ${foldHeader(msg.subject)}`);
  if (msg.date) headers.push(`Date: ${msg.date}`);
  if (msg.messageId) headers.push(`Message-ID: ${msg.messageId}`);
  if (msg.attachments.length > 0) {
    headers.push(
      `X-Original-Attachments: ${msg.attachments.map((a) => a.filename).join("; ")}`,
    );
  }
  headers.push("MIME-Version: 1.0");
  headers.push('Content-Type: text/plain; charset="utf-8"');
  headers.push("Content-Transfer-Encoding: 8bit");
  return headers.join("\r\n") + "\r\n\r\n" + (msg.body || "") + "\r\n";
}

/** RFC 5322 line folding for long header values. */
function foldHeader(value: string): string {
  if (value.length <= 78) return value;
  // Naïve fold at whitespace boundaries near col 76; good enough for
  // our subject/sender lengths.
  return value.replace(/(.{1,76})(\s+|$)/g, "$1\r\n ").trim();
}
