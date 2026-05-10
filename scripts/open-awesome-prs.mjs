/**
 * Opens PRs against awesome-list repos to add twineconvert. Each PR
 * forks the upstream repo into your account, edits the README in the
 * fork, pushes, and opens the PR. Maintainers still review manually
 * (that's the point, these are real contributions, not spam).
 *
 * Requires the gh CLI to be authenticated:
 *   gh auth status
 *
 * Usage:
 *   node scripts/open-awesome-prs.mjs
 *
 * Uses execFileSync (not exec) so all arguments are passed as a list
 * to the spawned process. No shell interpolation, no injection
 * surface. The TARGETS data is static so this is belt-and-suspenders
 * but worth keeping habitual.
 */

import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

function run(cmd, args, opts = {}) {
  return execFileSync(cmd, args, { encoding: "utf8", ...opts });
}

const TARGETS = [
  {
    upstream: "todrobbins/awesome-gedcom",
    branch: "master",
    file: "README.md",
    insertions: [
      {
        afterHeading: "### CSV",
        beforeHeading: "### DOT",
        insert:
          "* [twineconvert](https://twineconvert.com/gedcom-to-csv) - In-browser GEDCOM to CSV converter. No install, no upload, files stay on your device. Preserves family relationships via FAM/INDI ID links and keeps fuzzy dates (\"BEF 1850\", \"ABT JUN 1923\") as strings instead of forcing ISO.",
      },
      {
        afterHeading: "### JSON",
        beforeHeading: "### RDF",
        insert:
          "* [twineconvert](https://twineconvert.com/gedcom-to-json) - In-browser GEDCOM to JSON converter. Outputs hierarchical JSON with individuals, families, sources, and event references already linked by ID. Useful for feeding family-tree data into D3, React, or any web visualization without writing a parser.",
      },
    ],
    prTitle: "Add twineconvert to CSV and JSON converter sections",
    prBody: `Adding twineconvert to the CSV and JSON converter sections. It's a browser-only GEDCOM converter that runs entirely client-side via WebAssembly, so files never upload to a server. Useful for people whose GEDCOMs contain living-person data they'd rather not send to a third-party service.

Free, no signup, no file size cap.

Both entries match the existing list format (one bullet, name, link, short description).`,
  },

  {
    upstream: "aviaryan/awesome-no-login-web-apps",
    branch: "master",
    file: "README.md",
    insertions: [
      {
        afterHeading: "### File Converters",
        beforeHeadingRegex: /^##+ /m,
        insert:
          "* [twineconvert](https://twineconvert.com/) - 192 file converters that run entirely in the browser via WebAssembly. No upload, no signup, no file size limit. Covers HEIC/PDF/audio/video plus niches like Apple Health, Kindle clippings, GEDCOM, embroidery formats (DST/PES/JEF), ham radio (ADIF), bank statements (OFX/QFX/QBO).",
      },
    ],
    prTitle: "Add twineconvert to File Converters",
    prBody: `Adding twineconvert. It fits the spirit of this list: zero login, zero signup, zero account, runs in the browser. Stronger than that, files don't even leave the device because every conversion is client-side WASM.

192 conversion tools across mainstream (HEIC, PDF, MP4, etc.) and niche (Apple Health export, Kindle clippings, GEDCOM, embroidery, ham radio, financial formats) format families.`,
  },

  {
    upstream: "mbasso/awesome-wasm",
    branch: "master",
    file: "README.md",
    insertions: [
      {
        afterHeading: "### Data processing",
        beforeHeading: "### WebGL",
        insert:
          "- [twineconvert - 192 file converters running entirely client-side via WebAssembly (FFmpeg.wasm, libheif, jspdf, web-ifc, jsquash, gifenc, pdf.js). No upload, no server, files never leave the browser.](https://twineconvert.com)",
      },
    ],
    prTitle: "Add twineconvert to Data processing",
    prBody: `Adding twineconvert under "Projects > Data processing". The site is a working showcase of in-browser WASM tooling: it composes FFmpeg.wasm (audio/video), libheif via heic2any (HEIC), jsPDF + pdf.js (PDF), web-ifc (BIM), jSquash (AVIF), gifenc (GIF), and a few dozen smaller libraries to deliver 192 file converters with zero server processing.

Useful as a real-world reference for anyone wondering how far WASM can be pushed in a single browser tab.

Free, no signup.`,
  },

  {
    upstream: "kmaasrud/awesome-obsidian",
    branch: "master",
    file: "README.md",
    insertions: [
      {
        // The Converters section is a Markdown table. Insert as a new
        // table row right before the "---" horizontal rule that ends
        // the section.
        afterHeading: "## Converters",
        beforeHeading: "---",
        insert:
          "| [twineconvert](https://twineconvert.com/kindle-clippings-to-obsidian-md) | Browser-based converter for Kindle's `My Clippings.txt` to one Markdown file per book, with frontmatter (`title`, `author`, `date_finished`). Drops cleanly into a vault `Sources/` folder. No install, no upload, runs entirely in the browser. | [Achraf921](https://github.com/Achraf921) |",
      },
    ],
    prTitle: "Add twineconvert (Kindle clippings to Obsidian)",
    prBody: `Adding twineconvert as a no-install browser-based alternative to the existing script-based Kindle clippings converters in this section.

It takes \`My Clippings.txt\` straight off the Kindle and outputs one \`.md\` per book with frontmatter (title, author, date_finished). Runs entirely in the browser via WebAssembly, no upload, no Amazon login required.

Fits this list because the existing converters here are mostly Python scripts or Notion sync tools; this fills the "I just want to drag and drop a file in a browser tab" gap.`,
  },

  {
    upstream: "agarrharr/awesome-static-website-services",
    branch: "master",
    file: "readme.md",
    insertions: [
      {
        afterHeading: "## Images",
        beforeHeading: "## Maps",
        insert:
          "- [twineconvert](https://twineconvert.com/) - Browser-based file converter (192 tools) using WebAssembly: HEIC/JPG/PNG/AVIF/WebP/SVG/TIFF/ICO image conversion plus PDF, audio, video, and niche format families. Files stay on the user's device. Works on any static site since it runs entirely client-side.",
      },
    ],
    prTitle: "Add twineconvert to Images",
    prBody: `Adding twineconvert. Static-site native: 100% client-side, no server, no API calls, no backend dependencies. Useful for static-site authors who want to embed file conversion (image format conversion is the most common case) without standing up infrastructure.

Same niche as the existing BulkPicTools entry but broader scope (192 tools across all major format families, not just images).

Free, no signup.`,
  },
];

const FORK_OWNER = run("gh", ["api", "user", "--jq", ".login"]).trim();
console.log(`gh authenticated as: ${FORK_OWNER}`);

for (const target of TARGETS) {
  console.log(`\n=== ${target.upstream} ===`);
  const repoName = target.upstream.split("/")[1];
  const tmp = mkdtempSync(join(tmpdir(), "awesome-pr-"));

  try {
    // Idempotency: skip if we already have an open PR to this upstream
    // (avoids creating duplicate PRs on re-run).
    try {
      const openPRs = run("gh", [
        "pr",
        "list",
        "--repo",
        target.upstream,
        "--author",
        FORK_OWNER,
        "--state",
        "open",
        "--json",
        "url",
      ]);
      const arr = JSON.parse(openPRs || "[]");
      if (arr.length > 0) {
        console.log(`  already have open PR: ${arr[0].url}, skipping`);
        continue;
      }
    } catch {
      // gh pr list failure is non-fatal; proceed
    }

    console.log(`  forking...`);
    try {
      run("gh", [
        "repo",
        "fork",
        target.upstream,
        "--clone=false",
        "--remote=false",
      ]);
    } catch {
      // Already forked is fine
    }

    console.log(`  cloning fork into ${tmp}...`);
    run("gh", ["repo", "clone", `${FORK_OWNER}/${repoName}`, tmp]);

    // gh repo clone of a fork auto-adds an `upstream` remote, so only
    // add it if it's missing.
    const remotes = run("git", ["-C", tmp, "remote"]);
    if (!remotes.split("\n").map((s) => s.trim()).includes("upstream")) {
      run("git", [
        "-C",
        tmp,
        "remote",
        "add",
        "upstream",
        `https://github.com/${target.upstream}.git`,
      ]);
    }

    console.log(`  pulling from upstream/${target.branch}...`);
    run("git", ["-C", tmp, "pull", "upstream", target.branch]);

    const branchName = `add-twineconvert-${Date.now()}`;
    run("git", ["-C", tmp, "checkout", "-b", branchName]);

    const filePath = join(tmp, target.file);
    let content = readFileSync(filePath, "utf8");

    // Idempotency: if our entry is already in the file (e.g. a previous
    // PR was merged or is still open), skip this target entirely.
    if (content.includes("twineconvert.com")) {
      console.log(`  already present in upstream, skipping`);
      continue;
    }

    for (const ins of target.insertions) {
      const headingIdx = content.indexOf(ins.afterHeading);
      if (headingIdx === -1) {
        console.error(`  SKIP insertion: heading "${ins.afterHeading}" not found`);
        continue;
      }
      const afterHeading = content.slice(headingIdx + ins.afterHeading.length);
      let endOffset;
      if (ins.beforeHeading) {
        const idx = afterHeading.indexOf(ins.beforeHeading);
        if (idx === -1) {
          console.error(`  SKIP: end heading "${ins.beforeHeading}" not found`);
          continue;
        }
        endOffset = headingIdx + ins.afterHeading.length + idx;
      } else if (ins.beforeHeadingRegex) {
        const m = afterHeading.match(ins.beforeHeadingRegex);
        if (!m) {
          console.error(`  SKIP: end heading regex didn't match`);
          continue;
        }
        endOffset = headingIdx + ins.afterHeading.length + (m.index ?? 0);
      } else {
        console.error(`  SKIP: no end marker specified`);
        continue;
      }
      const before = content.slice(0, endOffset).trimEnd();
      const after = content.slice(endOffset);
      content = `${before}\n${ins.insert}\n\n${after.trimStart()}`;
      console.log(`  inserted entry under "${ins.afterHeading}"`);
    }

    writeFileSync(filePath, content);

    run("git", ["-C", tmp, "add", target.file]);
    run("git", ["-C", tmp, "commit", "-m", "Add twineconvert"]);

    console.log(`  pushing branch ${branchName}...`);
    run("git", ["-C", tmp, "push", "origin", branchName]);

    const prBodyFile = join(tmp, "PR_BODY.txt");
    writeFileSync(prBodyFile, target.prBody);

    console.log(`  opening PR...`);
    const prUrl = run("gh", [
      "pr",
      "create",
      "--repo",
      target.upstream,
      "--base",
      target.branch,
      "--head",
      `${FORK_OWNER}:${branchName}`,
      "--title",
      target.prTitle,
      "--body-file",
      prBodyFile,
    ]).trim();

    console.log(`  PR opened: ${prUrl}`);
  } catch (e) {
    console.error(`  FAILED: ${e.message}`);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

console.log("\ndone. Check the PR URLs above. Maintainers usually merge within days to weeks.");
