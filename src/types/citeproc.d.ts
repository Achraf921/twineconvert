declare module "citeproc" {
  interface CiteprocSys {
    retrieveLocale(lang: string): string;
    retrieveItem(id: string): unknown;
  }

  /** makeBibliography returns [metadata, formattedEntries[]]. */
  type BibliographyResult = [unknown, string[]];

  /** processCitationCluster returns [statusObject, [[index, renderedString, clusterId], ...]]. */
  type CitationClusterResult = [unknown, Array<[number, string, string]>];

  interface CitationCluster {
    citationID?: string;
    citationItems: Array<{ id: string; [k: string]: unknown }>;
    properties?: { noteIndex?: number; [k: string]: unknown };
  }

  class Engine {
    constructor(sys: CiteprocSys, style: string, lang?: string, forceLang?: boolean);
    setOutputFormat(format: "html" | "text" | "rtf"): void;
    updateItems(ids: string[]): void;
    makeBibliography(): BibliographyResult | false;
    processCitationCluster(
      citation: CitationCluster,
      citationsPre: Array<[string, number]>,
      citationsPost: Array<[string, number]>,
    ): CitationClusterResult;
  }

  const CSL: { Engine: typeof Engine; PROCESSOR_VERSION?: string };
  export { Engine };
  export default CSL;
}
