/**
 * EndNote XML writer. EndNote's "Generic" XML schema, which their
 * reference manager imports cleanly. Maps our unified Citation back
 * into the `<record>` shape with `<contributors>`/`<authors>` and
 * `<titles>`/`<title>`/`<secondary-title>` nesting.
 */

import type { Citation, CitationType } from "./citation";

const REVERSE_REF_TYPE: Record<CitationType, { id: string; name: string }> = {
  article: { id: "17", name: "Journal Article" },
  book: { id: "6", name: "Book" },
  inbook: { id: "5", name: "Book Section" },
  incollection: { id: "5", name: "Book Section" },
  inproceedings: { id: "47", name: "Conference Paper" },
  thesis: { id: "32", name: "Thesis" },
  report: { id: "27", name: "Report" },
  manual: { id: "27", name: "Report" },
  misc: { id: "13", name: "Generic" },
  online: { id: "12", name: "Web Page" },
  patent: { id: "25", name: "Patent" },
  audiovisual: { id: "3", name: "Audiovisual Material" },
};

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function buildEndnoteXml(citations: Citation[]): string {
  const records = citations.map((c, idx) => {
    const refType = REVERSE_REF_TYPE[c.type] ?? REVERSE_REF_TYPE.misc;
    const authorEls = (c.authors ?? [])
      .map((a) => `<author><style face="normal" font="default" size="100%">${escapeXml(a)}</style></author>`)
      .join("");
    const titleEls = [
      c.title ? `<title><style face="normal" font="default" size="100%">${escapeXml(c.title)}</style></title>` : "",
      c.journal ? `<secondary-title><style face="normal" font="default" size="100%">${escapeXml(c.journal)}</style></secondary-title>` : "",
      c.booktitle && !c.journal ? `<secondary-title><style face="normal" font="default" size="100%">${escapeXml(c.booktitle)}</style></secondary-title>` : "",
    ].filter(Boolean).join("");

    const fields: string[] = [];
    if (c.publisher) fields.push(`<publisher>${escapeXml(c.publisher)}</publisher>`);
    if (c.address) fields.push(`<pub-location>${escapeXml(c.address)}</pub-location>`);
    if (c.volume) fields.push(`<volume>${escapeXml(c.volume)}</volume>`);
    if (c.issue) fields.push(`<number>${escapeXml(c.issue)}</number>`);
    if (c.pages) fields.push(`<pages>${escapeXml(c.pages)}</pages>`);
    if (c.doi) fields.push(`<electronic-resource-num>${escapeXml(c.doi)}</electronic-resource-num>`);
    if (c.isbn) fields.push(`<isbn>${escapeXml(c.isbn)}</isbn>`);
    if (c.abstract) fields.push(`<abstract>${escapeXml(c.abstract)}</abstract>`);
    if (c.url) fields.push(`<urls><related-urls><url>${escapeXml(c.url)}</url></related-urls></urls>`);

    return `<record>
  <ref-type id="${refType.id}" name="${refType.name}">${refType.id}</ref-type>
  <rec-number>${idx + 1}</rec-number>
  <contributors><authors>${authorEls}</authors></contributors>
  <titles>${titleEls}</titles>
  ${c.year ? `<dates><year>${escapeXml(c.year)}</year></dates>` : ""}
  ${fields.join("\n  ")}
</record>`;
  }).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<xml>
<records>
${records}
</records>
</xml>`;
}
