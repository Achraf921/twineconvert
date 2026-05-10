# Backlinks playbook — twineconvert.com

A working list of places to drop a relevant link to a tool. Check off as you go.

**Rules of engagement (important):**

- Use a personal Reddit/forum account that's at least 30 days old with non-zero karma. Brand-new accounts get auto-filtered as spam.
- Each reply is **80% useful answer + 20% link**. Don't promote — help.
- Spread posts across days. Don't drop 5 links in 2 hours; that triggers anti-spam everywhere.
- Tailor each reply slightly. Don't copy-paste the same template into 5 threads — mods notice.
- Link to the **specific tool page**, not the homepage.

---

## Channel 1: Direct forum/community threads (no Reddit needed)

These are real threads I found that are discoverable from Google and have real readers landing on them every week. Forum backlinks last forever and forums typically have higher domain authority than Reddit.

### Kindle clippings → Obsidian / Notion

- [ ] **Obsidian Forum: "Kindle highlights to markdown"** — https://forum.obsidian.md/t/kindle-highlights-to-markdown/3842
  - **Tool to link:** `/kindle-clippings-to-obsidian-md`
  - **Draft reply:**
    > Slightly different angle: I built a browser-based converter that takes the raw `My Clippings.txt` straight off the Kindle and outputs one `.md` file per book with frontmatter (`title`, `author`, `date_finished`). Drops cleanly into a vault Sources/ folder. No install, no upload — runs in the tab via WebAssembly: https://twineconvert.com/kindle-clippings-to-obsidian-md
    >
    > For folks who prefer Amazon-account sync over the offline route, the official Obsidian Kindle Plugin is still the easiest. The converter is for people who don't want to log in to Amazon to get their own data back.

- [ ] **Obsidian Forum: "Fyodor for extracting Kindle clippings"** — https://forum.obsidian.md/t/fyodor-for-extracting-kindle-clippings/12567
  - **Tool to link:** `/kindle-clippings-to-obsidian-md`
  - **Draft reply:**
    > For anyone reading this who doesn't want to install a plugin or run a script, there's a no-install browser version: https://twineconvert.com/kindle-clippings-to-obsidian-md — drop `My Clippings.txt`, get a zip of one .md per book. Same end result, no setup. Built it because every existing tool I tried needed Python or an Amazon login.

### Apple Health → CSV

- [ ] **Apple Community: "How can I download or extract data from Health"** — https://discussions.apple.com/thread/255037259
  - **Tool to link:** `/apple-health-to-csv`
  - **Draft reply:**
    > The native export gives you a 100MB+ XML file that no normal spreadsheet tool can open. There's a browser converter that splits it per metric (heart rate, steps, sleep, workouts) into clean CSVs you can open in Numbers or Excel: https://twineconvert.com/apple-health-to-csv. Files stay on your device — it runs locally in the tab.
    >
    > For just one specific metric, there are sub-tools that skip the full XML parse: e.g. https://twineconvert.com/apple-health-heart-rate-to-csv

- [ ] **Apple Community: "How to export Apple Health Data to Excel"** — https://discussions.apple.com/thread/255564716
  - **Tool to link:** `/apple-health-to-csv`
  - **Draft reply:**
    > The Apple export gives you `export.xml` inside a zip — Excel can't open it directly. Easiest path I've found is converting to CSV first: https://twineconvert.com/apple-health-to-csv (browser-based, doesn't upload your health data). Each metric becomes its own CSV, opens in Excel/Numbers/Sheets directly.

- [ ] **Quantified Self Forum: "Converting iOS Health data export to CSV"** — https://forum.quantifiedself.com/t/converting-ios-health-data-export-to-csv/10749
  - **Tool to link:** `/apple-health-to-csv`
  - **Draft reply:**
    > Adding a 2026 option for anyone landing here from search: there's now a browser-only converter — drops the entire export.zip in, splits into one CSV per metric (heart rate, steps, sleep, workouts, mindful minutes, etc.). Runs locally in the tab via WASM, your health data never leaves the device. https://twineconvert.com/apple-health-to-csv
    >
    > Heads-up: large multi-year exports (300MB+) take 30-90 seconds to process — single-threaded, no GPU.

### GEDCOM → JSON / CSV / PDF

- [ ] **awesome-gedcom GitHub list** — https://github.com/todrobbins/awesome-gedcom
  - **Action:** Open a Pull Request adding the relevant tools. GitHub PR descriptions are more durable than Reddit comments.
  - **Suggested PR title:** `Add twineconvert: in-browser GEDCOM converters (no upload)`
  - **Suggested PR body:**
    > Adding twineconvert to the "Online Tools" section. It's a browser-based GEDCOM converter that runs entirely client-side via WebAssembly — no upload, no account. Useful for people whose GEDCOMs contain living-person data they don't want to send to a server.
    >
    > Specific tools:
    > - https://twineconvert.com/gedcom-to-json (for web visualizations / D3 / React)
    > - https://twineconvert.com/gedcom-to-csv (for spreadsheet analysis)
    > - https://twineconvert.com/gedcom-to-pdf (for printing for relatives)
    > - https://twineconvert.com/gedcom-to-html (for embeddable browser display)

---

## Channel 2: Reddit threads — search queries to run yourself

Reddit's better than forums for traffic but I can't browse it from here. Run these searches in your Reddit account, sort by **New** or **Top (Year)**, find a thread where someone's actually asking the question, drop the relevant tool link.

For each search, find ~2 good threads to reply to. **Don't reply to threads more than 2 years old** — they don't index well and you risk necroposting flags.

### r/genealogy

- Search: `site:reddit.com/r/genealogy "GEDCOM" csv`
- Search: `site:reddit.com/r/genealogy export json`
- Tool: `/gedcom-to-csv`, `/gedcom-to-json`, `/gedcom-to-pdf`
- **Draft reply skeleton:**
  > [Acknowledge their specific situation, e.g. "Yeah Family Tree Maker's GEDCOM export is a nightmare to import elsewhere"]
  >
  > [Format-specific tip, e.g. "GEDCOM dates with non-Gregorian calendars or 'BEF 1850' fuzzy notations don't survive most converters cleanly"]
  >
  > For a no-install option I built one that runs in the browser: https://twineconvert.com/gedcom-to-csv — it preserves family relationships via the FAM/INDI ID links, and keeps fuzzy dates as strings instead of forcing ISO. Does JSON, PDF, HTML too.

### r/ObsidianMD

- Search: `site:reddit.com/r/ObsidianMD "kindle"` and look for `clippings` posts
- Search: `site:reddit.com/r/ObsidianMD highlights export`
- Tool: `/kindle-clippings-to-obsidian-md`
- **Draft reply skeleton:**
  > [Address whatever they're actually trying to do — vault structure, frontmatter, etc.]
  >
  > For the "I don't want to install a plugin" route, there's a browser converter that takes My Clippings.txt and outputs one .md per book with title/author/date_finished frontmatter: https://twineconvert.com/kindle-clippings-to-obsidian-md. Drops into a Sources/ folder ready to [[wiki-link]].

### r/Notion

- Search: `site:reddit.com/r/Notion kindle highlights import database`
- Tool: `/kindle-clippings-to-notion-csv`
- **Draft reply skeleton:**
  > For Notion specifically you want CSV with each highlight as a row — Notion's native CSV importer creates a database with a row per highlight that you can filter/sort/group by book or date. There's a converter that produces a Notion-friendly CSV directly from My Clippings.txt: https://twineconvert.com/kindle-clippings-to-notion-csv

### r/embroidery

- Search: `site:reddit.com/r/embroidery convert dst pes`
- Search: `site:reddit.com/r/embroidery file format brother`
- Tool: `/dst-to-pes` (or `/pes-to-dst`, etc. depending on direction)
- **Draft reply skeleton:**
  > Brother home machines need .pes; commercial digitizers usually output .dst — this trips up everyone moving designs from a paid digitizer to a Brother SE/PE. There's a free browser-based converter (no software install): https://twineconvert.com/dst-to-pes. Heads-up: DST has no color info so you'll see placeholder thread colors after conversion — that's a DST limitation, not the tool.

### r/amateurradio (or r/HamRadio)

- Search: `site:reddit.com/r/amateurradio adif csv export`
- Search: `site:reddit.com/r/amateurradio LoTW import contest log`
- Tool: `/adif-to-csv`
- **Draft reply skeleton:**
  > For analyzing a contest log in Excel/Sheets, ADIF → CSV is the way. Browser-based converter (no install, doesn't upload your log): https://twineconvert.com/adif-to-csv. Outputs one row per QSO with all the standard fields populated.

### r/personalfinance, r/Quicken, r/GnuCash

- Search: `site:reddit.com/r/personalfinance "ofx" csv export bank`
- Search: `site:reddit.com/r/Quicken qfx convert csv excel`
- Tool: `/ofx-to-csv`, `/qfx-to-csv`, `/qbo-to-csv`
- **Draft reply skeleton:**
  > For per-transaction CSV (the bank-statement-to-spreadsheet pipeline), there's a browser converter that handles OFX/QFX/QBO/QIF without uploading your bank data anywhere: https://twineconvert.com/ofx-to-csv (and `/qfx-to-csv`, `/qbo-to-csv`, `/qif-to-csv` for the other formats). Output goes straight into Excel or Sheets.

### r/DataHoarder

- Search: `site:reddit.com/r/DataHoarder discord export markdown`
- Search: `site:reddit.com/r/DataHoarder whatsapp export pdf`
- Search: `site:reddit.com/r/DataHoarder twitter archive csv`
- Tools: `/discord-chat-to-md`, `/whatsapp-chat-to-pdf`, `/twitter-archive-to-csv`
- **Draft reply skeleton:**
  > For the [Discord/WhatsApp/Twitter] export → readable archive flow, there's a no-install browser converter: https://twineconvert.com/discord-chat-to-md (drop the JSON from DiscordChatExporter, get clean Markdown with timestamps, attachments referenced inline, reactions preserved). Runs locally — your chat data doesn't leave the tab.

---

## Channel 3: GitHub awesome-list PRs (highest-quality permanent backlinks)

Each accepted PR = one permanent backlink from GitHub (DR 95+). These are reviewed by humans, so the PR description quality matters.

| List | URL | Section to PR into |
|---|---|---|
| awesome-gedcom | https://github.com/todrobbins/awesome-gedcom | "Online Tools" |
| awesome-self-hosted | https://github.com/awesome-selfhosted/awesome-selfhosted | "File Transfer & Synchronization" or "Tools > File Conversion" |
| awesome-privacy | https://github.com/pluja/awesome-privacy | "Web Tools" |
| awesome-no-login-web-apps | https://github.com/aviaryan/awesome-no-login-web-apps | "Productivity" or "Files" |
| awesome-static-tools | (search GitHub for the active fork) | Wherever converters fit |

**PR template (adapt per list):**

> ## Adding twineconvert
>
> [twineconvert](https://twineconvert.com) is a browser-based file converter — every conversion runs client-side via WebAssembly, so files never upload to a server. No signup, no account, no file size cap.
>
> Currently 192 conversion tools across image, document, audio, video, ebook, financial, genealogy, ham radio, embroidery, music, and 3D format families. Source-private but the tool itself is free + open in the browser.
>
> Fits this list because [reason specific to that list — e.g. "every tool here requires a server, this one doesn't" for self-hosted, or "no upload = no privacy risk" for awesome-privacy].

---

## Channel 4: Stack Overflow / Stack Exchange answers

Find old highly-viewed questions that match our tools. Post a clean answer that mentions the tool as the no-code alternative. Permanent traffic forever from Google.

**How to find good targets (use these search queries):**

- `site:stackoverflow.com "convert gedcom" python`
- `site:stackoverflow.com "apple health" xml csv`
- `site:stackoverflow.com "kindle" clippings parse`
- `site:stackoverflow.com "ofx" csv`
- `site:stackoverflow.com convert pdf docx javascript`

Look for questions with **5,000+ views** that are still getting traffic. Post an answer like:

> If you're here from Google looking for the no-code path: there's a browser-based converter that does this without any setup — [link]. For people who actually need code, [acknowledge the existing answers and add value, maybe a sample snippet using the same library].

The "I'll show you the code AND the no-code alternative" answer pattern usually upvotes well because it serves both audiences.

---

## Channel 5: Show HN (one-shot, when ready)

Save this for later — you only get one good Show HN per project. Don't burn it before the site is fully polished.

**When you're ready, post here:** https://news.ycombinator.com/submit
- **Title format:** `Show HN: twineconvert – Free browser-only file converter (192 tools, no upload)`
- **Best timing:** Tuesday or Wednesday, 8:30–10am ET
- **First comment (post immediately yourself):** Explain why you built it. Mention the specific niche tools (Kindle clippings, Apple Health, GEDCOM, embroidery, ham radio) — those are what differentiate from CloudConvert/SmallPDF. Acknowledge limitations honestly (FFmpeg slow on mobile, etc.). HN respects honesty over marketing.

---

## Tracking

Mark items above with `[x]` when posted. Keep a note of dates so you spread submissions.

Target cadence:
- Days 1-3: 3-5 forum/Apple Community replies
- Days 4-7: 3-5 Reddit replies
- Week 2: 2-3 GitHub awesome-list PRs
- Week 2-3: 2-3 Stack Overflow answers
- Month 2 (when polished): 1 Show HN

Realistic outcome from finishing this list: 15–25 acquired backlinks, full sitemap indexed within 2 weeks, first organic clicks within 3-4 weeks.
