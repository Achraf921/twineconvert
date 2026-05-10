/**
 * Competitor comparison table — shown on every per-tool page.
 *
 * Honest, factual comparison vs the major server-upload converters.
 * Numbers come from each competitor's pricing/help pages as of 2026;
 * we'll need to refresh them annually but they're stable enough.
 *
 * Why it's on every per-tool page (not just the homepage): SEO. Google
 * gives a ranking lift for pages that include comparison content
 * because comparison intent is a high-value query class. And users
 * landing on /heic-to-jpg from a Google search benefit from seeing
 * "here's why this is better than the other 4 options that came up
 * in your search."
 */

interface Row {
  feature: string;
  twine: string | true | false;
  cloudConvert: string | true | false;
  iLovePDF: string | true | false;
  freeConvert: string | true | false;
  smallpdf: string | true | false;
}

const ROWS: Row[] = [
  {
    feature: "Files uploaded to a server",
    twine: false,
    cloudConvert: true,
    iLovePDF: true,
    freeConvert: true,
    smallpdf: true,
  },
  {
    feature: "Free file size limit",
    twine: "No limit",
    cloudConvert: "1 GB",
    iLovePDF: "200 MB",
    freeConvert: "1 GB",
    smallpdf: "5 GB",
  },
  {
    feature: "Free conversions per day",
    twine: "Unlimited",
    cloudConvert: "10/day",
    iLovePDF: "Limited",
    freeConvert: "Limited",
    smallpdf: "2/day",
  },
  {
    feature: "Signup required",
    twine: false,
    cloudConvert: false,
    iLovePDF: false,
    freeConvert: false,
    smallpdf: false,
  },
  {
    feature: "Watermark on output",
    twine: false,
    cloudConvert: false,
    iLovePDF: false,
    freeConvert: false,
    smallpdf: false,
  },
  {
    feature: "Open source",
    twine: true,
    cloudConvert: false,
    iLovePDF: false,
    freeConvert: false,
    smallpdf: false,
  },
  {
    feature: "Works offline (after first load)",
    twine: true,
    cloudConvert: false,
    iLovePDF: false,
    freeConvert: false,
    smallpdf: false,
  },
];

export function CompetitorComparison() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-[var(--color-border)]">
            <th className="text-left font-semibold text-[var(--color-text-3)] uppercase text-[11px] tracking-wider py-3 px-2">Feature</th>
            <th className="font-semibold py-3 px-2 text-center bg-[var(--color-pink-50)] text-[var(--color-pink-700)] rounded-t-lg">
              twineconvert
            </th>
            <th className="font-medium py-3 px-2 text-center text-[var(--color-text-2)]">CloudConvert</th>
            <th className="font-medium py-3 px-2 text-center text-[var(--color-text-2)]">iLovePDF</th>
            <th className="font-medium py-3 px-2 text-center text-[var(--color-text-2)]">FreeConvert</th>
            <th className="font-medium py-3 px-2 text-center text-[var(--color-text-2)]">Smallpdf</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row) => (
            <tr key={row.feature} className="border-b border-[var(--color-border)]/50">
              <td className="py-3 px-2 text-[var(--color-text-2)]">{row.feature}</td>
              <td className="py-3 px-2 text-center bg-[var(--color-pink-50)]/40">
                <Cell value={row.twine} highlight />
              </td>
              <td className="py-3 px-2 text-center"><Cell value={row.cloudConvert} /></td>
              <td className="py-3 px-2 text-center"><Cell value={row.iLovePDF} /></td>
              <td className="py-3 px-2 text-center"><Cell value={row.freeConvert} /></td>
              <td className="py-3 px-2 text-center"><Cell value={row.smallpdf} /></td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-[11px] text-[var(--color-text-3)] mt-3 italic">
        Comparison data from each competitor&apos;s own pricing and FAQ pages, last verified May 2026. Limits and pricing change frequently.
      </p>
    </div>
  );
}

function Cell({ value, highlight = false }: { value: string | true | false; highlight?: boolean }) {
  if (value === true) {
    return (
      <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full ${highlight ? "bg-[var(--color-pink-600)] text-white" : "bg-green-100 text-green-700"}`}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
          <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }
  if (value === false) {
    return (
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-50 text-red-600">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
          <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </span>
    );
  }
  return (
    <span className={`text-xs ${highlight ? "font-semibold text-[var(--color-pink-700)]" : "text-[var(--color-text-2)]"}`}>
      {value}
    </span>
  );
}
