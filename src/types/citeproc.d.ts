declare module "citeproc" {
  interface CiteprocSys {
    retrieveLocale(lang: string): string;
    retrieveItem(id: string): unknown;
  }

  /** makeBibliography returns [metadata, formattedEntries[]]. */
  type BibliographyResult = [unknown, string[]];

  class Engine {
    constructor(sys: CiteprocSys, style: string, lang?: string, forceLang?: boolean);
    setOutputFormat(format: "html" | "text" | "rtf"): void;
    updateItems(ids: string[]): void;
    makeBibliography(): BibliographyResult | false;
  }

  const CSL: { Engine: typeof Engine; PROCESSOR_VERSION?: string };
  export { Engine };
  export default CSL;
}
