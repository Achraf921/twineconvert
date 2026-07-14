/**
 * RFC-822 email parsing for `.eml` and `.mbox` files.
 *
 * `.eml` is a single message, headers, blank line, body (plus optional
 * MIME multipart structure for HTML/attachments).
 *
 * `.mbox` is a concatenation of EMLs separated by lines beginning with
 * `From ` (note the trailing space), the legacy Unix mbox convention.
 * We split on that delimiter and parse each chunk as an EML.
 *
 * We use postal-mime for the actual heavy lifting (header decoding,
 * multipart MIME, encoded-word handling, attachment extraction). It's a
 * pure-JS pkg with no native deps and works in browsers.
 */

import type { default as PostalMimeType, Email as PostalEmail, Attachment as PostalAttachment } from "postal-mime";

export interface ParsedEmail {
  from?: string;
  to?: string;
  cc?: string;
  bcc?: string;
  subject?: string;
  date?: string;
  messageId?: string;
  /** Plaintext body. May be empty if the email was HTML-only. */
  textBody?: string;
  /** HTML body, used by the PDF/HTML renderers. */
  htmlBody?: string;
  attachments: ParsedEmailAttachment[];
}

export interface ParsedEmailAttachment {
  filename: string;
  mimeType: string;
  content: ArrayBuffer;
}

function attachmentToOurs(a: PostalAttachment): ParsedEmailAttachment {
  // postal-mime's Attachment.content is `ArrayBuffer | Uint8Array | string`
  // depending on the part's encoding: binary parts come back as ArrayBuffer
  // (the common case), some as a Uint8Array view, and text parts as a string.
  // Hand callers a plain ArrayBuffer regardless of which shape we got.
  return {
    filename: a.filename ?? "attachment",
    mimeType: a.mimeType ?? "application/octet-stream",
    content: toArrayBuffer(a.content),
  };
}

/** Normalize postal-mime's ArrayBuffer | Uint8Array | string content to an ArrayBuffer. */
function toArrayBuffer(content: ArrayBuffer | Uint8Array | string): ArrayBuffer {
  if (typeof content === "string") {
    return new TextEncoder().encode(content).buffer as ArrayBuffer;
  }
  if (content instanceof Uint8Array) {
    return content.buffer.slice(
      content.byteOffset,
      content.byteOffset + content.byteLength,
    ) as ArrayBuffer;
  }
  // Already an ArrayBuffer.
  return content;
}

function postalToOurs(email: PostalEmail): ParsedEmail {
  return {
    from: email.from?.address ? `${email.from.name ?? ""} <${email.from.address}>`.trim() : undefined,
    to: email.to?.map((a) => a.address).filter(Boolean).join(", ") || undefined,
    cc: email.cc?.map((a) => a.address).filter(Boolean).join(", ") || undefined,
    bcc: email.bcc?.map((a) => a.address).filter(Boolean).join(", ") || undefined,
    subject: email.subject,
    date: email.date,
    messageId: email.messageId,
    textBody: email.text,
    htmlBody: email.html,
    attachments: (email.attachments ?? []).map(attachmentToOurs),
  };
}

export async function parseEml(raw: string | ArrayBuffer): Promise<ParsedEmail> {
  const PostalMime = ((await import("postal-mime")).default) as typeof PostalMimeType;
  const parser = new PostalMime();
  const email = await parser.parse(raw);
  return postalToOurs(email);
}

/**
 * Split an mbox file into individual EML strings. The "From " separator
 * convention has a known false-positive rate (any body line starting
 * with "From " in the wild collides with the header). The standard
 * mitigation is to require a preceding blank line, we apply that.
 */
function splitMbox(text: string): string[] {
  const messages: string[] = [];
  const lines = text.split(/\r?\n/);
  let current: string[] = [];
  let prevBlank = true;

  for (const line of lines) {
    if (prevBlank && /^From .+\d{4}/.test(line)) {
      // Start of a new message; flush the current one.
      if (current.length > 0) {
        messages.push(current.join("\n"));
      }
      current = [];
      prevBlank = false;
      continue;
    }
    current.push(line);
    prevBlank = line.trim() === "";
  }
  if (current.length > 0) messages.push(current.join("\n"));
  return messages;
}

export async function parseMbox(text: string): Promise<ParsedEmail[]> {
  const PostalMime = ((await import("postal-mime")).default) as typeof PostalMimeType;
  const blocks = splitMbox(text);
  const emails: ParsedEmail[] = [];
  for (const block of blocks) {
    if (!block.trim()) continue;
    try {
      const parser = new PostalMime();
      const parsed = await parser.parse(block);
      emails.push(postalToOurs(parsed));
    } catch {
      // Skip unparseable messages rather than failing the whole batch.
      continue;
    }
  }
  return emails;
}
