/**
 * vCard (.vcf) parse + build. Covers vCard 2.1 / 3.0 / 4.0 well enough for
 * the common contact fields people actually export from phones, Google
 * Contacts, and Outlook. Not a full RFC 6350 implementation (no GROUPs,
 * no vendor X- round-tripping), but lossless for the fields we expose.
 */

export interface VCardContact {
  fullName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  organization: string;
  title: string;
  url: string;
  birthday: string;
  address: string;
  note: string;
}

const EMPTY: VCardContact = {
  fullName: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  organization: "",
  title: "",
  url: "",
  birthday: "",
  address: "",
  note: "",
};

/** RFC 6350 line folding: a CRLF followed by a space or tab continues
 *  the previous logical line. Unfold before parsing. */
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

/** Strip parameters from a property name: "TEL;TYPE=CELL" -> "TEL". */
function propName(rawKey: string): string {
  return rawKey.split(";")[0].toUpperCase();
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

export function parseVcard(text: string): VCardContact[] {
  const lines = unfold(text);
  const contacts: VCardContact[] = [];
  let cur: VCardContact | null = null;
  for (const line of lines) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = propName(line.slice(0, idx));
    const value = line.slice(idx + 1);
    if (key === "BEGIN" && value.toUpperCase().trim() === "VCARD") {
      cur = { ...EMPTY };
      continue;
    }
    if (key === "END" && value.toUpperCase().trim() === "VCARD") {
      if (cur) contacts.push(cur);
      cur = null;
      continue;
    }
    if (!cur) continue;
    const v = unescape(value).trim();
    switch (key) {
      case "FN":
        cur.fullName = v;
        break;
      case "N": {
        // N: Family;Given;Additional;Prefix;Suffix
        const parts = value.split(";");
        cur.lastName = unescape(parts[0] ?? "").trim();
        cur.firstName = unescape(parts[1] ?? "").trim();
        break;
      }
      case "EMAIL":
        if (!cur.email) cur.email = v;
        break;
      case "TEL":
        if (!cur.phone) cur.phone = v;
        break;
      case "ORG":
        cur.organization = v.replace(/;/g, " ").trim();
        break;
      case "TITLE":
        cur.title = v;
        break;
      case "URL":
        cur.url = v;
        break;
      case "BDAY":
        cur.birthday = v;
        break;
      case "ADR":
        // ADR: PO;Ext;Street;Locality;Region;Postal;Country
        cur.address = value
          .split(";")
          .map((p) => unescape(p).trim())
          .filter(Boolean)
          .join(", ");
        break;
      case "NOTE":
        cur.note = v;
        break;
    }
  }
  return contacts;
}

export function buildVcard(contacts: VCardContact[]): string {
  const blocks = contacts.map((c) => {
    const fn = c.fullName || `${c.firstName} ${c.lastName}`.trim() || "Unknown";
    const lines = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      `N:${escape(c.lastName)};${escape(c.firstName)};;;`,
      `FN:${escape(fn)}`,
    ];
    if (c.organization) lines.push(`ORG:${escape(c.organization)}`);
    if (c.title) lines.push(`TITLE:${escape(c.title)}`);
    if (c.email) lines.push(`EMAIL;TYPE=INTERNET:${escape(c.email)}`);
    if (c.phone) lines.push(`TEL;TYPE=CELL:${escape(c.phone)}`);
    if (c.url) lines.push(`URL:${escape(c.url)}`);
    if (c.birthday) lines.push(`BDAY:${escape(c.birthday)}`);
    if (c.address) lines.push(`ADR:;;${escape(c.address)};;;;`);
    if (c.note) lines.push(`NOTE:${escape(c.note)}`);
    lines.push("END:VCARD");
    return lines.join("\r\n");
  });
  return blocks.join("\r\n") + "\r\n";
}

/** Column order shared by vcf<->csv so the round-trip is stable. */
export const VCARD_COLUMNS: (keyof VCardContact)[] = [
  "fullName",
  "firstName",
  "lastName",
  "email",
  "phone",
  "organization",
  "title",
  "url",
  "birthday",
  "address",
  "note",
];

export function contactFromRow(row: Record<string, string>): VCardContact {
  const c: VCardContact = { ...EMPTY };
  for (const k of VCARD_COLUMNS) c[k] = (row[k] ?? "").toString();
  return c;
}
