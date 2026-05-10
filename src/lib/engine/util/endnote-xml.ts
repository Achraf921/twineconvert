/**
 * EndNote XML parser. EndNote (the reference manager) exports references
 * as XML with a well-known shape:
 *
 *   <xml>
 *     <records>
 *       <record>
 *         <ref-type name="Journal Article">17</ref-type>
 *         <contributors>
 *           <authors>
 *             <author><style face="normal">Smith, John</style></author>
 *           </authors>
 *         </contributors>
 *         <titles>
 *           <title>A Paper About Things</title>
 *           <secondary-title>Nature</secondary-title>
 *         </titles>
 *         <pages>45-67</pages>
 *         <volume>123</volume>
 *         <number>4</number>
 *         <dates><year>2024</year></dates>
 *         <electronic-resource-num>10.1038/...</electronic-resource-num>
 *       </record>
 *     </records>
 *   </xml>
 *
 * `<style>` wrappers around values are an EndNote rendering hint we strip.
 */

import { type Citation, type CitationType } from "./citation";

const REF_TYPE_MAP: Record<string, CitationType> = {
  "Journal Article": "article",
  "Book": "book",
  "Book Section": "inbook",
  "Conference Paper": "inproceedings",
  "Conference Proceedings": "inproceedings",
  "Thesis": "thesis",
  "Report": "report",
  "Web Page": "online",
  "Electronic Article": "article",
  "Patent": "patent",
  "Audiovisual Material": "audiovisual",
};

function getText(el: Element | null): string | undefined {
  if (!el) return undefined;
  // Strip nested <style> wrappers EndNote inserts for visual styling.
  const text = el.textContent?.trim();
  return text || undefined;
}

function getAuthors(record: Element): string[] | undefined {
  const auths = Array.from(record.getElementsByTagName("author"))
    .map((a) => getText(a))
    .filter(Boolean) as string[];
  return auths.length ? auths : undefined;
}

export function parseEndnoteXml(text: string): Citation[] {
  if (typeof DOMParser === "undefined") throw new Error("DOMParser unavailable");
  const doc = new DOMParser().parseFromString(text, "application/xml");
  const parseError = doc.getElementsByTagName("parsererror")[0];
  if (parseError) throw new Error(`EndNote XML parse failed: ${parseError.textContent?.slice(0, 120)}`);

  const records = Array.from(doc.getElementsByTagName("record"));
  const citations: Citation[] = [];
  for (const r of records) {
    const refTypeEl = r.getElementsByTagName("ref-type")[0];
    const refTypeName = refTypeEl?.getAttribute("name") ?? "";
    const type = REF_TYPE_MAP[refTypeName] ?? "misc";

    const titlesEl = r.getElementsByTagName("titles")[0];
    const title = getText(titlesEl?.getElementsByTagName("title")[0] ?? null);
    const secondaryTitle = getText(titlesEl?.getElementsByTagName("secondary-title")[0] ?? null);

    const datesEl = r.getElementsByTagName("dates")[0];
    const year = getText(datesEl?.getElementsByTagName("year")[0] ?? null);

    const id = getText(r.getElementsByTagName("rec-number")[0] ?? null) ?? `endnote-${citations.length + 1}`;

    citations.push({
      id,
      type,
      title,
      authors: getAuthors(r),
      year,
      journal: type === "article" ? secondaryTitle : undefined,
      booktitle: type === "inbook" || type === "inproceedings" ? secondaryTitle : undefined,
      publisher: getText(r.getElementsByTagName("publisher")[0] ?? null),
      address: getText(r.getElementsByTagName("pub-location")[0] ?? null),
      volume: getText(r.getElementsByTagName("volume")[0] ?? null),
      issue: getText(r.getElementsByTagName("number")[0] ?? null),
      pages: getText(r.getElementsByTagName("pages")[0] ?? null),
      doi: getText(r.getElementsByTagName("electronic-resource-num")[0] ?? null),
      url: getText(r.getElementsByTagName("url")[0] ?? null) ?? getText(r.getElementsByTagName("urls")[0]?.getElementsByTagName("related-urls")[0]?.getElementsByTagName("url")[0] ?? null),
      isbn: getText(r.getElementsByTagName("isbn")[0] ?? null),
      abstract: getText(r.getElementsByTagName("abstract")[0] ?? null),
    });
  }
  return citations;
}
