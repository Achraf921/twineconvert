/**
 * iCalendar (.ics) parse + build, RFC 5545, scoped to VEVENT and the
 * fields people actually need in a spreadsheet (summary, start, end,
 * location, description, uid, all-day). Not a full calendar engine: no
 * RRULE expansion, no VTODO/VALARM. Lossless for the exposed fields.
 */

export interface ICalEvent {
  uid: string;
  summary: string;
  description: string;
  location: string;
  start: string;
  end: string;
  allDay: boolean;
}

const EMPTY: ICalEvent = {
  uid: "",
  summary: "",
  description: "",
  location: "",
  start: "",
  end: "",
  allDay: false,
};

function unfold(text: string): string[] {
  const raw = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const out: string[] = [];
  for (const line of raw) {
    if ((line.startsWith(" ") || line.startsWith("\t")) && out.length > 0) {
      out[out.length - 1] += line.slice(1);
    } else {
      out.push(line);
    }
  }
  return out;
}

function unescape(v: string): string {
  return v
    .replace(/\\n/gi, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\");
}

function escape(v: string): string {
  return v
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

/** Normalize an iCal date/datetime to a human, sortable string.
 *  20240115T130000Z -> 2024-01-15 13:00:00 ; 20240115 -> 2024-01-15 */
function fmtDate(raw: string): { value: string; allDay: boolean } {
  const m = raw.match(/^(\d{4})(\d{2})(\d{2})(T(\d{2})(\d{2})(\d{2})Z?)?/);
  if (!m) return { value: raw, allDay: false };
  const date = `${m[1]}-${m[2]}-${m[3]}`;
  if (!m[4]) return { value: date, allDay: true };
  return { value: `${date} ${m[5]}:${m[6]}:${m[7]}`, allDay: false };
}

/** Pack a "YYYY-MM-DD HH:MM:SS" / "YYYY-MM-DD" back to iCal form. */
function toICalDate(v: string): string {
  const dt = v.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/);
  if (dt) return `${dt[1]}${dt[2]}${dt[3]}T${dt[4]}${dt[5]}${dt[6]}Z`;
  const d = v.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (d) return `${d[1]}${d[2]}${d[3]}`;
  return v.replace(/[-: ]/g, "");
}

export function parseIcal(text: string): ICalEvent[] {
  const lines = unfold(text);
  const events: ICalEvent[] = [];
  let cur: ICalEvent | null = null;
  for (const line of lines) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const rawKey = line.slice(0, idx);
    const key = rawKey.split(";")[0].toUpperCase();
    const value = line.slice(idx + 1);
    if (key === "BEGIN" && value.trim().toUpperCase() === "VEVENT") {
      cur = { ...EMPTY };
      continue;
    }
    if (key === "END" && value.trim().toUpperCase() === "VEVENT") {
      if (cur) events.push(cur);
      cur = null;
      continue;
    }
    if (!cur) continue;
    switch (key) {
      case "UID":
        cur.uid = value.trim();
        break;
      case "SUMMARY":
        cur.summary = unescape(value).trim();
        break;
      case "DESCRIPTION":
        cur.description = unescape(value).trim();
        break;
      case "LOCATION":
        cur.location = unescape(value).trim();
        break;
      case "DTSTART": {
        const f = fmtDate(value.trim());
        cur.start = f.value;
        cur.allDay = rawKey.toUpperCase().includes("VALUE=DATE") || f.allDay;
        break;
      }
      case "DTEND": {
        cur.end = fmtDate(value.trim()).value;
        break;
      }
    }
  }
  return events;
}

export function buildIcal(events: ICalEvent[]): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//twineconvert//ical//EN",
    "CALSCALE:GREGORIAN",
  ];
  let seq = 0;
  for (const e of events) {
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${e.uid || `${Date.now()}-${seq++}@twineconvert`}`);
    if (e.start) {
      lines.push(
        e.allDay
          ? `DTSTART;VALUE=DATE:${toICalDate(e.start)}`
          : `DTSTART:${toICalDate(e.start)}`,
      );
    }
    if (e.end) {
      lines.push(
        e.allDay
          ? `DTEND;VALUE=DATE:${toICalDate(e.end)}`
          : `DTEND:${toICalDate(e.end)}`,
      );
    }
    if (e.summary) lines.push(`SUMMARY:${escape(e.summary)}`);
    if (e.location) lines.push(`LOCATION:${escape(e.location)}`);
    if (e.description) lines.push(`DESCRIPTION:${escape(e.description)}`);
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}

export const ICAL_COLUMNS: (keyof ICalEvent)[] = [
  "uid",
  "summary",
  "start",
  "end",
  "location",
  "description",
  "allDay",
];

export function eventFromRow(row: Record<string, string>): ICalEvent {
  return {
    uid: (row.uid ?? "").toString(),
    summary: (row.summary ?? "").toString(),
    description: (row.description ?? "").toString(),
    location: (row.location ?? "").toString(),
    start: (row.start ?? "").toString(),
    end: (row.end ?? "").toString(),
    allDay: String(row.allDay ?? "").toLowerCase() === "true",
  };
}
