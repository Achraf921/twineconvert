/**
 * Render an HTML string to a PDF Blob using jsPDF's html() method, which
 * leverages html2canvas under the hood.
 *
 * jsPDF.html() requires a real DOM element with computed styles, so we
 * mount the parsed HTML into an off-screen container, run the conversion,
 * then unmount. Off-screen positioning (not display:none) is required
 * because html2canvas needs computed dimensions, which display:none
 * collapses to zero.
 *
 * Safety note: the HTML originates from documents the user uploaded into
 * their own browser session, there is no cross-user surface. We still
 * use DOMParser + adoptNode rather than innerHTML so any inert <script>
 * fragments are parsed but not executed (the html parser created by
 * DOMParser does not run scripts).
 */

export interface HtmlToPdfOptions {
  /** Page margin in mm. Default 15. */
  margin?: number;
  /** Width of the rendering viewport in pixels. Default 800. */
  windowWidth?: number;
  /** 0..1 progress callback (rendering takes most of the time). */
  onProgress?: (fraction: number) => void;
}

function buildContainer(html: string, widthPx: number): HTMLDivElement {
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.style.width = `${widthPx}px`;
  container.style.fontFamily = "system-ui, -apple-system, Segoe UI, sans-serif";
  container.style.fontSize = "14px";
  container.style.lineHeight = "1.5";
  container.style.color = "#000";
  container.style.background = "#fff";

  // Parse HTML in inert mode then move parsed nodes into the live container.
  // DOMParser.parseFromString with text/html does NOT execute <script> tags.
  const parsed = new DOMParser().parseFromString(html, "text/html");
  const sourceBody = parsed.body;
  while (sourceBody.firstChild) {
    container.appendChild(document.adoptNode(sourceBody.firstChild));
  }
  return container;
}

export async function htmlToPdf(
  html: string,
  opts: HtmlToPdfOptions = {},
): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const widthPx = opts.windowWidth ?? 800;
  const container = buildContainer(html, widthPx);
  document.body.appendChild(container);

  try {
    opts.onProgress?.(0.1);
    const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
    await doc.html(container, {
      margin: opts.margin ?? 15,
      autoPaging: "text",
      windowWidth: widthPx,
      width: 180,
      html2canvas: { scale: 0.5, backgroundColor: "#ffffff" },
    });
    opts.onProgress?.(0.95);

    const arrayBuffer = doc.output("arraybuffer");
    return new Blob([arrayBuffer], { type: "application/pdf" });
  } finally {
    document.body.removeChild(container);
  }
}
