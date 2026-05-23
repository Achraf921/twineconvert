/**
 * Per-tool SERP overrides for pages whose auto-generated title /
 * description are not capturing the modifier queries showing up in GSC.
 *
 * Sourced from the 2026-05-23 GSC pull. Only tools with a real
 * high-impression / low-CTR gap go here; the autogenerator handles
 * the long tail just fine. Re-evaluate after the next trend read.
 *
 * Note: titles stay under ~65 chars to avoid SERP truncation;
 * descriptions stay under ~155.
 */

export interface ToolSeoOverride {
  title?: string;
  description?: string;
  keywords?: string[];
}

export const TOOL_SEO_OVERRIDES: Record<string, ToolSeoOverride> = {
  // 248 impr / 3.2% CTR pos 9.2. Lowest-CTR top-impression page.
  // Already includes "converter"; emphasize reference managers users
  // search alongside ("EndNote", "Zotero", "Mendeley") and verbs
  // ("convert", "import") to lift CTR at the existing rank.
  "bibtex-to-ris": {
    title: "Convert BibTeX to RIS for EndNote, Zotero, Mendeley, Free",
    description:
      "Convert a .bib BibTeX file to RIS in your browser, free. Import the result into EndNote, Zotero, Mendeley, or any reference manager that reads RIS. No upload, no signup.",
    keywords: [
      "bibtex to ris",
      "bibtex to ris converter",
      "convert bibtex to ris",
      "bib to ris",
      "endnote import bibtex",
      "zotero import bibtex",
      "mendeley import bibtex",
    ],
  },
  // 70 impr / 5.7% CTR pos 3.9. NBIB = PubMed; tightening for the
  // "PubMed" brand intent that real searchers carry.
  "nbib-to-bibtex": {
    title: "Convert PubMed NBIB to BibTeX (LaTeX), Free, in Browser",
    description:
      "Convert a PubMed .nbib export to BibTeX for LaTeX, Overleaf, JabRef, or any reference manager. Free, runs in your browser, no upload.",
    keywords: [
      "nbib to bibtex",
      "pubmed to bibtex",
      "convert nbib to bibtex",
      "pubmed nbib latex",
      "nbib to latex",
    ],
  },
  // 257 impr / 0 clicks (your earlier GSC paste). The "export" verb
  // and "QuickBooks" brand are completely missing from the current
  // auto-title. QBO = QuickBooks Online's bank-feed export.
  "qbo-to-csv": {
    title: "Export QuickBooks QBO to CSV, Free, in Your Browser",
    description:
      "Export a QuickBooks .qbo file to CSV for Excel or Google Sheets, free. Convert bank-feed transactions in your browser, no upload, no signup. Works with QuickBooks Online and Desktop.",
    keywords: [
      "qbo to csv",
      "export qbo to csv",
      "quickbooks to csv",
      "convert qbo to csv",
      "quickbooks bank feed csv",
    ],
  },
  // 119 impr / 0 clicks. QFX = Quicken's bank-feed format. The
  // "Quicken" brand is what searchers type; auto-title misses it.
  "qfx-to-csv": {
    title: "Convert Quicken QFX to CSV, Free, in Your Browser",
    description:
      "Convert a Quicken .qfx file to CSV for Excel or Google Sheets, free. Bank-feed transactions in your browser, no upload, no signup. Works with Quicken Web Connect exports.",
    keywords: [
      "qfx to csv",
      "quicken qfx to csv",
      "convert qfx to csv",
      "quicken to csv",
      "quicken bank feed csv",
    ],
  },
  // 170 impr / 12 clicks pos 29.5. Climbing organically; tighten the
  // SERP for "ged to pdf" / Ancestry / MyHeritage genealogy intent.
  "gedcom-to-pdf": {
    title: "Convert GEDCOM (.ged) Family Tree to PDF, Free, in Browser",
    description:
      "Turn a GEDCOM family tree from Ancestry, MyHeritage, FamilySearch, or Gramps into a printable PDF in your browser, free. No upload, no signup.",
    keywords: [
      "gedcom to pdf",
      "ged to pdf",
      "convert gedcom to pdf",
      "family tree to pdf",
      "ancestry gedcom pdf",
      "myheritage gedcom pdf",
    ],
  },
};

export function getToolSeoOverride(toolId: string): ToolSeoOverride | undefined {
  return TOOL_SEO_OVERRIDES[toolId];
}
