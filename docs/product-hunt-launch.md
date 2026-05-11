# Product Hunt launch package — twineconvert.com

Everything needed to ship a Product Hunt launch in one document. Copy from here on launch day.

---

## When to launch

**Best day**: Tuesday, Wednesday, or Thursday. Friday-Sunday have much lower PH traffic and worse leaderboard placement.

**Best time**: 12:01 AM Pacific Time (PT). Each PH "day" runs midnight to midnight PT. Posting at 12:01 AM PT gives you the full 24 hours on that day's leaderboard. Posting at 11 PM PT gives you 1 hour before the day rolls over, which is fatal.

**Days to avoid**:
- Mondays (the queue is full of weekend submissions)
- Major US holidays (Thanksgiving week, Christmas through Jan 2, July 4 week)
- Days an obvious AI/tech megalaunch is announced (you cannot beat them and you waste the slot)

**Realistic next launch dates** (Tuesday/Wednesday in May/June):
- Tuesday May 12 (this week)
- Wednesday May 13
- Tuesday May 19
- Wednesday May 20

---

## Listing copy

### Tagline (60 character limit)

```
Convert any file in your browser. No upload, no signup.
```

(53 chars, leaves room)

**Alternative taglines** if you want to A/B in your head:
- `300+ file converters that never upload your files` (50)
- `The file converter that runs entirely in your browser` (54)
- `Free file conversion that does not upload anything` (49)

The first one wins because it leads with the action ("convert") and ends with the two differentiators (no upload, no signup).

### Description (260 character limit)

```
twineconvert runs 300+ file conversions entirely in your browser via WebAssembly. Your file never uploads anywhere. PDF, HEIC, MP4, BibTeX, HL7, GEDCOM, KML, plus 290 more. Free, no watermark, no file size limit, no account required.
```

(229 chars)

### Topics / categories to select

Pick 2-3 from PH's topic list:
- **Productivity** (primary)
- **Design tools** (secondary, captures the image-converter audience)
- **Developer tools** (tertiary, captures the JSON/YAML/BibTeX audience)

Skip "Open source" since the repo is private.

---

## The maker comment

This is your first comment, gets pinned to the top of the discussion. Most important text on the entire launch page. Write it from the heart, post it within 30 seconds of the listing going live.

```
Hi PH!

I built twineconvert because every existing file converter (CloudConvert, Convertio, even most free ones) uploads your files to their servers. For sensitive stuff like medical records, contracts, family photos, that is a real trust ask, and most people do it anyway because there is no alternative.

twineconvert runs the conversion entirely in your browser using WebAssembly. The file never leaves your computer. There is no upload step at all.

It started with HEIC to JPG because I was tired of explaining to Windows colleagues why my iPhone photos wouldn't open. It now does 301 conversions:

- Image and photo (HEIC, JPG, PNG, WebP, AVIF, TIFF, BMP, ICO, SVG)
- PDF (to JPG, to text, to DOCX, compress, combine)
- Audio and video (MP4 to MP3, FLAC, WAV, MOV, MKV)
- Office docs (DOCX, XLSX, ODS, EPUB, RTF)
- Academic citations (BibTeX, RIS, NBIB, EndNote XML, CSL-JSON)
- Genealogy (GEDCOM)
- Medical (HL7 v2, FHIR Bundle, C-CDA)
- Legal eDiscovery (Concordance DAT, OPT)
- Data formats (JSON, YAML, TOML, JSONL, XML, CSV, TSV, SQL)
- Color, encoding, hashes, dates, fonts, subtitles, maps

Free, no signup, no watermark, no file size cap (limited only by your browser's RAM).

Would love to hear which formats you would want next, and which tools you would actually use.
```

---

## Pre-launch (the night before)

The single biggest predictor of PH success: do NOT cold-launch with zero warm-up. Send a personalized message to 15-30 people in your network the day before. Examples:

### DM template

```
Hey [name], I am launching a project tomorrow on Product Hunt at midnight PT.

It is a file converter site that runs everything in the browser instead of uploading your files. Started as a side project after the hundredth time I had to explain HEIC photos to a Windows colleague.

Not asking for an upvote (PH penalizes campaigns that ask). Just wanted you on the list in case you want to take a look. Honest feedback wins way more than a vote.

Link tomorrow: producthunt.com/products/twineconvert
```

### Who to message

- 10-15 friends/family who would actually be curious
- 5-10 ex-colleagues you have a real relationship with
- Anyone who has supported your previous launches
- 2-3 small Twitter/X accounts in adjacent spaces (privacy, productivity, indie hacking)

**Do NOT**:
- Mass DM strangers
- Post in Slack/Discord groups asking for upvotes (PH detects this and shadow-bans)
- Use PH "ladder" services or buy upvotes
- Post the link prematurely (you cannot get the URL until you submit)

---

## Launch day timeline

**12:00 AM PT**: Final pre-flight check. Make sure the site is up, recent deploy is healthy.

**12:01 AM PT**: Click "Schedule Launch" → "Launch Now" in PH dashboard.

**12:02 AM PT**: Drop the maker comment immediately. Pin it.

**12:05 AM PT**: Send a single Twitter/X post:
```
Just launched twineconvert on @ProductHunt — 300+ file converters that never upload your files, all running in your browser via WebAssembly.

[link]

Built it because I was tired of trusting random sites with my files. Would love your honest take.
```

**12:10 AM - 2:00 AM PT**: Stay online. Respond to every single comment within minutes. This is the most important window of the day.

**6:00 AM - 9:00 AM PT**: East Coast wakes up, traffic surge. Keep responding.

**12:00 PM PT**: Midday check-in. Post one update tweet if you have momentum:
```
Hit #X on @ProductHunt today. Thank you to everyone who took the time to check out twineconvert.

If you have a file format we don't support yet, drop it in the comments. We have shipped 300 conversions, easy to add more.
```

**8:00 PM PT**: Final hours. Make sure the maker comment is still pinned and recent comments are addressed.

**11:59 PM PT**: Day ends. The final leaderboard position is locked.

---

## Response templates for common comment questions

### "How does this stay free?"

```
For now, just my time and a few dollars a month for Vercel hosting. Plan is to add unobtrusive ads (AdSense first, then Mediavine when traffic warrants) once organic traffic builds. No ads on the actual conversions, no plan to put anything behind a paywall.

The cost model genuinely is small for this kind of site since there is no server doing the conversions, every browser does its own work.
```

### "What about privacy and security?"

```
Everything runs as JavaScript and WebAssembly in your browser tab. The Network tab in your DevTools shows zero outbound requests during a conversion. The actual converter libraries (FFmpeg, libheif, pdfjs, etc.) are compiled to WebAssembly and downloaded once, then run locally.

We do load Vercel Analytics and PostHog for site-wide pageview tracking but they never see file content. Anything you drop in the dropzone stays on your machine.
```

### "Why not just X commercial tool?"

```
The main pitch is privacy + price. CloudConvert is great if you trust uploading; the API tier costs $9-49/month and the free tier caps at 25 conversions/day with file size limits. Our 301 conversions are unlimited and free because there is no per-conversion server cost on our side. You pay your own electricity to run the WebAssembly; we never see your data.
```

### "Is this open source?"

```
Repo is private right now. Maybe later if there is real interest in self-hosting, but it would mostly be a curiosity since the whole thing runs as static files and a Vercel deployment.
```

### "Will it work for huge files?"

```
The cap is whatever your browser can hold in memory. On a normal laptop with 16GB RAM, conversions of 1-2GB files work. Above that, you start hitting browser tab memory limits.

The exact limit depends on the converter: PDF can be heavier than JPG, video heavier than audio. We do not artificially cap; if your browser can do it, the conversion runs.
```

### "Does it work offline?"

```
After the first page load, yes. Each tool's WebAssembly converter library is cached after first download. You can install the site as a PWA (Add to Home Screen on iOS, Install button in Chrome on desktop) for a full offline experience.
```

### "Why no [specific tool]?"

```
If it is feasible to do in the browser, often easy to add. Tell me the exact format pair and a real use case (what you would actually use it for) and I can usually ship it within a day. The ones we deliberately do NOT do are formats that require server-side processing: Photoshop PSD, AutoCAD DWG, anything with closed-source decoders.
```

### "How is this different from [Smallpdf, iLovePDF, Convertio]?"

```
Three differences:
1. Browser-side, your file never uploads
2. 300+ format pairs vs their 30-50 (we cover the long tail like BibTeX → CSL-JSON, HL7 → CSV, KML → GPX, etc.)
3. Genuinely free, no file size cap, no daily limit, no signup
```

### Negative comment (e.g., "doesn't work for me")

```
Sorry about that. What file format did you try, and what did the error message say? Most often this is either the browser missing a codec or a file using an unusual variant. If you DM me the file name (not the file, just the name) I can usually identify the cause within a few minutes.
```

---

## Gallery images (4-6 needed, 1270x760px each)

Product Hunt's hero gallery is the first thing people see after the headline. Each image should communicate ONE thing.

### Image 1: Hero shot (REQUIRED)
**What**: A clean rendering of the twineconvert.com homepage hero section. Show the pink "twineconvert" wordmark, the "Convert your files in your browser" tagline, the chip widget showing HEIC → JPG, and the dropzone.

**Why**: This is what visitors see when they click through. It needs to look polished.

**How to make**: Take a 1270x760 screenshot of your homepage. Use Cleanshot X (Mac) or Greenshot (Windows). Crop to exactly 1270x760.

### Image 2: The tool variety
**What**: A grid showing logos / format names for 20-30 of your tools. Title at the top: "301 file conversions, all in your browser." Subtitle: "Image, audio, video, documents, citations, medical, legal, and more."

**Why**: Communicates the scope of what is shipped, not just "another HEIC converter."

**How to make**: Take a screenshot of /all-tools, crop to a 16:9 frame.

### Image 3: The "never uploads" proof
**What**: A split-screen showing the conversion UI on the left and a DevTools Network tab on the right with ZERO requests during the actual conversion. Title at the top: "Watch the Network tab — nothing uploads."

**Why**: This is THE differentiator. Showing it visually beats describing it 10x.

**How to make**: Open the site in Chrome, open DevTools (Cmd+Option+I), Network tab. Drop a file, click Convert. Screenshot the moment when conversion is happening. Highlight the empty network log.

### Image 4: The conversion success state
**What**: Screenshot of the converter after a successful conversion: the green check, the "Download" button, the file name. Title: "Free. No signup. Done in seconds."

**Why**: Shows the actual completed workflow. Reduces hesitation about whether the tool actually works.

### Image 5 (optional): The breadth
**What**: A more sophisticated visual showing the 8 categories (Image, Audio, Video, PDF, Spreadsheet, Academic, Medical, Legal) with one example tool per category. Title: "Every file format. One tab. No upload."

**Why**: For viewers who need to see "yes this is comprehensive" before clicking.

### Image 6 (optional, GIF or short video): The actual conversion in action
**What**: 5-10 second screen recording: drag a HEIC file in, click Convert, click Download. Shows the actual user experience.

**Why**: PH supports a video as the first asset. A real conversion in <10 seconds is more compelling than any static image.

---

## Hunter (optional but helpful)

Product Hunt has "Hunters" who can hunt your product on your behalf. A Hunter with high PH karma can give your launch a boost via their follower notifications, but you do NOT need one to launch successfully.

If you want a Hunter:
- Reach out via Twitter/X DM 1-2 weeks before launch
- Pick someone who has hunted similar tools (file utilities, dev tools, privacy-focused products)
- Be specific about why your launch matters
- Do NOT pay for a Hunter (against PH rules + correlates with low-quality launches)

If you cannot get a Hunter, hunt yourself. You can submit your own product.

---

## What success looks like

**Below average launch**: <100 upvotes, finish day in the top 20-30 range.
- Still a permanent backlink + listing
- Maybe 200-500 visitors from PH
- A few comments

**Average launch**: 200-500 upvotes, finish top 5-10.
- 2,000-5,000 visitors on launch day
- 30-100 comments  
- Real signal in PostHog metrics

**Great launch**: 500-1,000+ upvotes, finish top 3.
- 10,000-30,000 visitors on launch day
- A "Product of the Day" badge if #1
- Mentioned in PH's weekly newsletter (top 5)
- Potential coverage from a TechCrunch newsletter writer

**Outlier launch**: 1,500+ upvotes, #1 Product of the Day.
- 50,000-150,000 visitors on launch day
- "Product of the Week" badge if you hold #1 across the week
- TechCrunch / The Verge / Wired might pick up the story

The realistic outcome for twineconvert is "average" with potential upside. The combination of privacy positioning + 300 tools + working product is strong; the lack of an existing audience is the bottleneck.

---

## Post-launch (the next week)

- **Day 2**: Reply to any comments that came in overnight. Thank the people who upvoted.
- **Day 3-7**: Add the PH badge to twineconvert.com if you ranked top 5. PH gives you embed code in the launch dashboard.
- **Week 2**: PH adds you to its "Last Week's Top Products" newsletter if you ranked. Plus permanent listing for SEO (links to PH carry weight).

**Long tail**: a successful PH launch gives you a permanent listing that traffic finds via Google for years. The single-day spike is real but the permanent listing is the bigger payoff.

---

## What I would do specifically

1. **Launch on Tuesday May 13** (gives 2 days to prep gallery images + lock in the launch dashboard)
2. **Send DMs Monday evening** to your 15-30 closest contacts
3. **Schedule the listing for 12:01 AM PT Tuesday** in PH dashboard
4. **Have the maker comment in your clipboard** for instant posting at 12:02 AM PT
5. **Block off 12 AM - 2 AM PT Tuesday and 6 AM - 10 AM PT Tuesday** for comment responses
6. **Cross-post to Twitter once at launch** (no spam)

If you want to wait a week, Wednesday May 21 is the next best slot. Don't launch on a Friday, you waste the slot.
