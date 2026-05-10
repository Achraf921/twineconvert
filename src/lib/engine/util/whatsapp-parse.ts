/**
 * Parser for WhatsApp's chat export `_chat.txt` (or whichever name the
 * platform happens to use, same regex either way).
 *
 * WhatsApp exports come in two shapes:
 *   1. A `.txt` file (the chat transcript only)
 *   2. A `.zip` containing the txt plus all the referenced media (images,
 *      videos, voice notes, documents). Filename inside the zip is
 *      `_chat.txt` on iOS, "WhatsApp Chat with NAME.txt" on Android.
 *
 * Each message line looks like one of:
 *   [DD/MM/YYYY, HH:MM:SS] Sender Name: Message text
 *   DD/MM/YYYY, HH:MM - Sender Name: Message text       (Android)
 *   12/31/2024, 11:59 PM - Sender Name: Message text    (US locale)
 *
 * Multi-line messages continue on subsequent lines without a timestamp;
 * we attach those continuation lines to the previous message.
 *
 * System events ("X added Y", "Messages and calls are end-to-end
 * encrypted") have no sender, we capture them with sender = undefined
 * so consumers can choose to render or filter.
 */

import type JSZipType from "jszip";

export interface WhatsappMessage {
  /** ISO 8601 datetime when parseable; otherwise the raw timestamp string. */
  timestamp: string;
  /** Sender display name. Undefined for system messages. */
  sender?: string;
  /** Message body, may include `<Media omitted>` placeholder when the
   *  user exported "without media" mode. */
  text: string;
  /** Filename of attached media (when the export bundle includes it).
   *  We populate this by scanning `text` for the WhatsApp media-attached
   *  pattern (the bundle ships media files alongside the txt). */
  mediaFilename?: string;
  /** True when this is a system notice (joins, leaves, encryption notice). */
  isSystem: boolean;
}

export interface ParsedWhatsapp {
  messages: WhatsappMessage[];
  /** Sender name → message count, useful for "who talked the most" stats. */
  participantCounts: Record<string, number>;
  /** When input was a zip, this maps media filename → Blob for renderers
   *  that want to embed the original images. */
  media?: Map<string, Blob>;
}

// Two timestamp prefix shapes; both anchored at the start of a line.
const IOS_LINE_RE = /^\[(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s?[AP]M)?)\]\s*([^:]+?):\s*(.*)$/;
const ANDROID_LINE_RE = /^(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s?[AP]M)?)\s*[-–]\s*([^:]+?):\s*(.*)$/;
const SYSTEM_LINE_RE = /^(?:\[)?(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s?[AP]M)?)(?:\])?\s*[-–]?\s*(.*)$/;

const MEDIA_ATTACHED_RE = /‎?<attached:\s*([^>]+)>|‎?(.+\.(?:jpg|jpeg|png|gif|webp|mp4|mov|m4a|opus|ogg|pdf))\s*\(file attached\)/i;

function tryParseDate(date: string, time: string): string {
  const dateNorm = date.replace(/[.-]/g, "/");
  const dParts = dateNorm.split("/").map((p) => p.trim());
  if (dParts.length !== 3) return `${date} ${time}`;

  // WhatsApp follows the device locale: DD/MM/YY in most of Europe/Asia,
  // MM/DD/YY in US. We can't infer the locale from one line, we use a
  // mild heuristic: if the FIRST number is > 12, it must be a day. The
  // whole batch typically uses the same locale, so if any line in the
  // file disambiguates, all dates parse the same way. For v1 we default
  // to DD/MM/YY (international majority) when ambiguous.
  let day = parseInt(dParts[0], 10);
  let month = parseInt(dParts[1], 10);
  let year = parseInt(dParts[2], 10);
  if (day <= 12 && month > 12) {
    // Definitely MM/DD/YY format
    [day, month] = [month, day];
  }
  if (year < 100) year += 2000;
  if (!day || !month || !year) return `${date} ${time}`;

  // Convert AM/PM time to 24-hour for the ISO output.
  const timeNorm = time.trim().toUpperCase();
  let hour = 0, minute = 0, second = 0;
  const mm = timeNorm.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([AP]M)?$/);
  if (mm) {
    hour = parseInt(mm[1], 10);
    minute = parseInt(mm[2], 10);
    second = mm[3] ? parseInt(mm[3], 10) : 0;
    if (mm[4] === "PM" && hour < 12) hour += 12;
    if (mm[4] === "AM" && hour === 12) hour = 0;
  }

  const pad = (n: number) => String(n).padStart(2, "0");
  return `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:${pad(second)}`;
}

async function readChatTxt(input: File | Blob): Promise<{ text: string; media?: Map<string, Blob> }> {
  const bytes = new Uint8Array(await input.arrayBuffer());
  const isZip = bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04;
  if (!isZip) {
    return { text: new TextDecoder("utf-8").decode(bytes) };
  }
  const JSZip = (await import("jszip")).default as typeof JSZipType;
  const zip = await JSZip.loadAsync(bytes);
  // iOS uses `_chat.txt`; Android uses "WhatsApp Chat with NAME.txt".
  const txtEntry =
    zip.file("_chat.txt") ??
    zip.file(/whatsapp.*chat.*\.txt$/i)[0] ??
    zip.file(/\.txt$/i)[0];
  if (!txtEntry) throw new Error("No chat .txt file found inside the zip");
  const text = await txtEntry.async("string");
  // Collect all non-txt entries as media for renderers that want them.
  const media = new Map<string, Blob>();
  const entries = Object.values(zip.files).filter((f) => !f.dir && f !== txtEntry);
  for (const entry of entries) {
    media.set(entry.name, await entry.async("blob"));
  }
  return { text, media };
}

export async function parseWhatsapp(input: File | Blob): Promise<ParsedWhatsapp> {
  const { text, media } = await readChatTxt(input);
  const lines = text.split(/\r?\n/);
  const messages: WhatsappMessage[] = [];
  const participantCounts: Record<string, number> = {};

  for (const rawLine of lines) {
    // Strip the U+200E left-to-right-mark WhatsApp likes to inject.
    const line = rawLine.replace(/‎/g, "");
    if (!line.trim()) continue;

    const ios = line.match(IOS_LINE_RE);
    const android = !ios ? line.match(ANDROID_LINE_RE) : null;
    const m = ios ?? android;

    if (m) {
      const [, date, time, sender, body] = m;
      const ts = tryParseDate(date, time);
      const mediaMatch = body.match(MEDIA_ATTACHED_RE);
      const mediaFilename = mediaMatch?.[1] ?? mediaMatch?.[2];
      messages.push({
        timestamp: ts,
        sender: sender.trim(),
        text: body,
        mediaFilename,
        isSystem: false,
      });
      participantCounts[sender.trim()] = (participantCounts[sender.trim()] ?? 0) + 1;
    } else {
      // Could be a system event (no colon in the prefix) or a continuation
      // line of the previous message.
      const sys = line.match(SYSTEM_LINE_RE);
      if (sys && !sys[3].includes(":")) {
        const [, date, time, body] = sys;
        messages.push({
          timestamp: tryParseDate(date, time),
          sender: undefined,
          text: body,
          isSystem: true,
        });
      } else if (messages.length > 0) {
        // Continuation, append to previous message.
        messages[messages.length - 1].text += "\n" + line;
      }
    }
  }

  return { messages, participantCounts, media };
}
