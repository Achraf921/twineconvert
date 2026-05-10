/**
 * Prepares submission packages for tool aggregator sites that index
 * "free online tools." Most have web forms (not APIs), so this script
 * generates a single markdown file with everything pre-filled per
 * site: URL, name, tagline, description, category, screenshot URL,
 * tags. You then spend 2-3 min per site clicking through the form.
 *
 * Why semi-automated and not fully automated: most aggregator sites
 * use Cloudflare Turnstile or hCaptcha + email verification on
 * submission. Browser automation gets caught by these. Manual entry
 * with pre-filled copy is the realistic path.
 *
 * Usage:
 *   node scripts/aggregator-submissions.mjs
 *
 * Outputs: docs/aggregator-submissions.md
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const PRODUCT = {
  name: "twineconvert",
  url: "https://twineconvert.com",
  taglineShort: "192 file converters that run in your browser",
  taglineLong:
    "Free file converter that runs entirely in your browser via WebAssembly. No upload, no signup, no file size limit. Covers HEIC, PDF, audio, video, and niche formats like Apple Health export, Kindle clippings, GEDCOM, embroidery (DST/PES/JEF), ham radio (ADIF), bank statements (OFX/QFX/QBO), and more.",
  descriptionLong: `twineconvert is a free file conversion site with 192 tools across image, document, audio, video, ebook, financial, genealogy, ham radio, embroidery, music, and 3D format families. Every conversion runs entirely client-side via WebAssembly, so files never upload to any server. No account, no signup, no file size limit, no watermark.

Built to fill the gap left by upload-based converters (Smallpdf, CloudConvert, etc.) for users who don't want their personal files (bank statements, family photos, health data, private chats) to land on a third party's infrastructure.

Notable niche tools: Apple Health → CSV per metric, Kindle My Clippings.txt → one Markdown file per book (Obsidian-ready), GEDCOM → JSON/CSV/PDF/HTML, embroidery format conversion for home Brother/Babylock machines, ham radio ADIF/Cabrillo, financial OFX/QFX/QBO/QIF.`,
  category: "File Converter / Productivity / Privacy Tool",
  tags: [
    "file converter",
    "online converter",
    "in-browser",
    "no upload",
    "webassembly",
    "privacy",
    "free",
    "no signup",
  ],
  screenshotUrl: "https://twineconvert.com/opengraph-image",
  contactEmail: "achrafbavi@gmail.com",
  yearFounded: "2026",
  pricing: "Free",
};

const SITES = [
  {
    name: "AlternativeTo",
    url: "https://alternativeto.net/software/new/",
    notes: `Submit as a "new app." Picks: name=${PRODUCT.name}, URL=${PRODUCT.url}, primary category="File Manager" or "Online Service", license="Free."`,
    fields: {
      Name: PRODUCT.name,
      URL: PRODUCT.url,
      "Short description": PRODUCT.taglineShort,
      "Long description": PRODUCT.descriptionLong,
      Category: "File Manager / Online Service",
      License: "Free",
      "Available platforms": "Online / Web-based",
      Tags: PRODUCT.tags.join(", "),
    },
  },
  {
    name: "Slant",
    url: "https://www.slant.co/",
    notes: `Slant works by adding your tool as an option to existing comparison questions. Search "best free pdf to docx converter", "best free heic converter" etc. and add twineconvert as an option to each one that fits.`,
    fields: {
      "When asked for product info": JSON.stringify(PRODUCT, null, 2),
    },
  },
  {
    name: "SaaSHub",
    url: "https://www.saashub.com/submit-product",
    notes: `Free tier submission. Goes through manual review. Approval ~3-7 days.`,
    fields: {
      "Product name": PRODUCT.name,
      "Product URL": PRODUCT.url,
      Tagline: PRODUCT.taglineShort,
      Description: PRODUCT.descriptionLong,
      Category: "Productivity Software / File Conversion",
      Tags: PRODUCT.tags.join(", "),
      Pricing: "Free",
      "Founded year": PRODUCT.yearFounded,
    },
  },
  {
    name: "ToolFinder",
    url: "https://toolfinder.xyz/submit",
    notes: `Curated newsletter+directory. Selective. Pitch the niche angle (privacy, no-upload).`,
    fields: {
      Name: PRODUCT.name,
      URL: PRODUCT.url,
      Tagline: PRODUCT.taglineShort,
      "Why is this useful?": "Files stay on the user's device because every conversion is client-side WebAssembly. Major differentiator vs Smallpdf/CloudConvert/etc. which all upload to their servers. 192 tools cover both mainstream and niche format families.",
      Category: "Productivity / File Tools",
    },
  },
  {
    name: "Product Hunt",
    url: "https://www.producthunt.com/products/new",
    notes: `One-shot launch. Save for a polished moment. Tuesday/Wednesday 12:01am PT for max visibility. Need 1-2 friends to upvote/comment in the first hour.`,
    fields: {
      Name: PRODUCT.name,
      Tagline: PRODUCT.taglineShort,
      "Description (260 chars)":
        "Free file converter for HEIC, PDF, video, GEDCOM, Apple Health, Kindle clippings, and 180+ more formats. Runs entirely in your browser, files never upload. No signup, no size limit, no watermark.",
      "First comment (post yourself)": `Built this because I got tired of every free converter wanting me to upload personal files to their server. Every conversion runs in the browser via WebAssembly: FFmpeg.wasm for audio/video, libheif for HEIC, jsPDF for PDFs, web-ifc for BIM, and a bunch of niche libs.

Notable tools you won't find on the big converters: Apple Health → CSV per metric, Kindle clippings → Obsidian Markdown, GEDCOM → JSON/CSV/PDF, embroidery formats (DST/PES/JEF), ham radio ADIF/Cabrillo, bank statements (OFX/QFX/QBO).

Honest limits: FFmpeg is single-threaded right now (no COOP/COEP because it breaks AdSense), so video transcoding on mobile is slow. Mobile Safari kills tabs at ~1GB so very large videos may fail.`,
      Topics: "Productivity, Open Source, File Management, Privacy",
      "Maker comment first hour":
        "Happy to dig into specific format implementations or the in-browser WASM architecture if anyone has questions.",
    },
  },
  {
    name: "BetaList",
    url: "https://betalist.com/submit",
    notes: `Targeted at "interesting startups." Free submission, manual review. ~2-4 weeks to publish.`,
    fields: {
      "Startup name": PRODUCT.name,
      "Startup URL": PRODUCT.url,
      Tagline: PRODUCT.taglineShort,
      "What problem does it solve":
        "Existing free file converters (Smallpdf, CloudConvert, iLovePDF) require uploading your file to their server. For sensitive files (bank statements, photos, health data, chats), that's a privacy compromise users don't always notice. twineconvert runs every conversion client-side in WebAssembly, so files stay on the device.",
      "What's unique":
        "192 tools, all in-browser, including niche formats nobody else covers (embroidery, ham radio, BIM, color LUTs, music notation, personal data exports).",
    },
  },
  {
    name: "Indie Hackers (Products)",
    url: "https://www.indiehackers.com/products/new",
    notes: `Free. Need an Indie Hackers account. Goes into the products directory.`,
    fields: {
      Name: PRODUCT.name,
      URL: PRODUCT.url,
      Tagline: PRODUCT.taglineShort,
      Description: PRODUCT.descriptionLong,
      Categories: "Developer Tools, Productivity",
    },
  },
  {
    name: "Sourceforge",
    url: "https://sourceforge.net/blog/submit-your-project/",
    notes: `Sourceforge Slashdot media network gives some link juice. Less relevant for pure web apps; submit as "web-based software."`,
    fields: {
      "Project name": PRODUCT.name,
      Description: PRODUCT.descriptionLong,
      "Project URL": PRODUCT.url,
      Categories: "Productivity / File Format",
      License: "Free for use (proprietary code)",
    },
  },
  {
    name: "WebApp.io / launchingnext.com",
    url: "https://www.launchingnext.com/submit/",
    notes: `Targeted at new web apps. Easy free submission, fast publication.`,
    fields: {
      Name: PRODUCT.name,
      URL: PRODUCT.url,
      Tagline: PRODUCT.taglineShort,
      Description: PRODUCT.descriptionLong,
      Category: "Productivity",
    },
  },
  {
    name: "Devhunt",
    url: "https://devhunt.org/submit-tool",
    notes: `Free tool directory for developers. Lower DR than Product Hunt but easier acceptance. Pitch the WASM angle.`,
    fields: {
      Name: PRODUCT.name,
      URL: PRODUCT.url,
      Tagline: PRODUCT.taglineShort,
      Description:
        "Working showcase of in-browser WASM tooling. Composes FFmpeg.wasm, libheif, jsPDF, web-ifc, jSquash, gifenc, pdf.js etc. into 192 file converters that run entirely client-side. Useful as a real-world reference for the limits of what WASM can do in a single browser tab.",
      Tags: "wasm, webassembly, file conversion, privacy, no-upload",
    },
  },
];

let md = `# Tool aggregator submissions\n\n`;
md += `Submission packages for ${SITES.length} aggregator sites. For each site:\n`;
md += `1. Click the URL\n`;
md += `2. Sign up if needed (use ${PRODUCT.contactEmail})\n`;
md += `3. Copy/paste the prefilled fields\n`;
md += `4. Submit\n\n`;
md += `Time per site: ~2-3 minutes. Total: ~30-45 min.\n\n`;
md += `Realistic outcome: 5-10 listings approved within 1-4 weeks. Each listing = one permanent backlink from a directory + some referral traffic.\n\n`;
md += `**Skip Product Hunt for now.** Save it for a polished launch when you have some traffic data and improvements queued.\n\n`;
md += `---\n\n`;

for (const site of SITES) {
  md += `## ${site.name}\n\n`;
  md += `**Submit at:** ${site.url}\n\n`;
  md += `**Notes:** ${site.notes}\n\n`;
  md += `**Fields to fill:**\n\n`;
  for (const [key, val] of Object.entries(site.fields)) {
    md += `- **${key}:**\n`;
    if (val.includes("\n")) {
      md += `  \`\`\`\n${val.split("\n").map((l) => "  " + l).join("\n")}\n  \`\`\`\n\n`;
    } else {
      md += `  \`${val}\`\n\n`;
    }
  }
  md += `---\n\n`;
}

md += `## Reusable assets across all sites\n\n`;
md += `**Logo:** https://twineconvert.com/logo.png (500x500 PNG, transparent bg)\n`;
md += `**Open Graph image:** https://twineconvert.com/opengraph-image (1200x630)\n`;
md += `**Email:** ${PRODUCT.contactEmail}\n`;
md += `**Pricing:** Free\n`;
md += `**Year:** ${PRODUCT.yearFounded}\n`;

const out = resolve("docs/aggregator-submissions.md");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, md);
console.log(`Wrote ${out}`);
console.log(`\n${SITES.length} aggregators ready to submit. Open the file, work through them in order.`);
