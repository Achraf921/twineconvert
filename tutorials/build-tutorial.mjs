/**
 * End-to-end tutorial video builder, v3.
 *
 * v3 changes vs v2:
 *   - Scene-based composition instead of "screenshot in background"
 *     - Dark Fireship-style backgrounds with iconography
 *     - Per-scene templates: logo-text, fail-list, logo-row, warning,
 *       centered-headline, cta, demo-recording
 *   - Real Playwright recording for the demo segment only (the only
 *     place where actually showing the UI matters)
 *   - Background music ducked under voice via ffmpeg amix
 *   - More cuts (9 segments instead of 6), shorter each
 *   - Crossfade transitions kept from v2
 *
 * Usage:
 *   ELEVENLABS_API_KEY=... ELEVENLABS_VOICE_ID=... \
 *     [MUSIC_PATH=tutorials/assets/music/bg.mp3] \
 *     node tutorials/build-tutorial.mjs heic-to-jpg
 */

import { execFileSync } from "node:child_process";
import { writeFileSync, readFileSync, mkdirSync, existsSync, statSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { chromium } from "playwright";

const tool = process.argv[2];
if (!tool) {
  console.error("Usage: node build-tutorial.mjs <tool-id>");
  process.exit(1);
}

const KEY = process.env.ELEVENLABS_API_KEY;
const VOICE = process.env.ELEVENLABS_VOICE_ID;
const MUSIC_PATH = process.env.MUSIC_PATH;
if (!KEY || !VOICE) {
  console.error("Set ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID env vars.");
  process.exit(1);
}

const SCRIPT_PATH = resolve(`tutorials/scripts/${tool}.json`);
const OUT_DIR = resolve("tutorials/output");
const WORK_DIR = resolve(`tutorials/output/.work-${tool}`);
const ICONS_DIR = resolve("tutorials/assets/icons");
/**
 * Per-tool fixture lookup. The demo segment uploads a real file through
 * the live conversion UI on twineconvert.com via Playwright, so we need
 * a sample input file that matches the converter's accept list.
 *
 * Add a new entry when shipping a tutorial for a new tool; default
 * fallback is the HEIC sample which most image converters can handle.
 */
const FIXTURE_BY_TOOL = {
  "heic-to-jpg": "tests/browser/fixtures/sample.heic",
  "heic-to-png": "tests/browser/fixtures/sample.heic",
  "heic-to-webp": "tests/browser/fixtures/sample.heic",
  "heic-to-pdf": "tests/browser/fixtures/sample.heic",
  "mp4-to-mp3": "tests/browser/fixtures/sample.mp4",
  "mp4-to-gif": "tests/browser/fixtures/sample.mp4",
  "pdf-to-jpg": "tests/browser/fixtures/sample.pdf",
  "pdf-to-png": "tests/browser/fixtures/sample.pdf",
  "pdf-to-webp": "tests/browser/fixtures/sample.pdf",
  "pdf-to-text": "tests/browser/fixtures/sample.pdf",
  "pdf-to-docx": "tests/browser/fixtures/sample.pdf",
  "compress-pdf": "tests/browser/fixtures/sample.pdf",
  "bibtex-to-csv": "tests/browser/fixtures/sample.bib",
  "bibtex-to-ris": "tests/browser/fixtures/sample.bib",
  "bibtex-to-nbib": "tests/browser/fixtures/sample.bib",
  "bibtex-to-csl-json": "tests/browser/fixtures/sample.bib",
  "bibtex-to-yaml": "tests/browser/fixtures/sample.bib",
  "bibtex-to-markdown": "tests/browser/fixtures/sample.bib",
  "bibtex-to-html": "tests/browser/fixtures/sample.bib",
  "vcf-to-csv": "tests/browser/fixtures/sample.vcf",
  "vcf-to-json": "tests/browser/fixtures/sample.vcf",
  "csv-to-vcf": "tests/browser/fixtures/sample-contacts.csv",
  "gedcom-to-csv": "tests/browser/fixtures/sample.ged",
  "gedcom-to-json": "tests/browser/fixtures/sample.ged",
  "gedcom-to-pdf": "tests/browser/fixtures/sample.ged",
  "gedcom-to-html": "tests/browser/fixtures/sample.ged",
};
const DEMO_FIXTURE = resolve(FIXTURE_BY_TOOL[tool] ?? "tests/browser/fixtures/sample.heic");

if (!existsSync(SCRIPT_PATH)) {
  console.error(`Script not found: ${SCRIPT_PATH}`);
  process.exit(1);
}

mkdirSync(OUT_DIR, { recursive: true });
mkdirSync(WORK_DIR, { recursive: true });

const script = JSON.parse(readFileSync(SCRIPT_PATH, "utf8"));
console.log(`Building: ${script.title}  (${script.segments.length} segments)`);

function run(cmd, args) {
  return execFileSync(cmd, args, { encoding: "utf8", stdio: "pipe" });
}

function probeDuration(path) {
  return parseFloat(
    run("ffprobe", [
      "-i",
      path,
      "-show_entries",
      "format=duration",
      "-v",
      "quiet",
      "-of",
      "csv=p=0",
    ]).trim(),
  );
}

function iconB64(name) {
  const p = join(ICONS_DIR, name);
  if (!existsSync(p)) return null;
  return readFileSync(p).toString("base64");
}

// ============================================================================
// Scene templates (HTML+CSS, rendered to 1920x1080 PNG via Playwright)
// ============================================================================

const COMMON_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@500;700;800;900&display=swap');
  html, body { margin: 0; padding: 0; }
  body {
    width: 1920px; height: 1080px;
    font-family: 'Inter', -apple-system, sans-serif;
    background: radial-gradient(ellipse at top, #1a1024 0%, #0a0710 60%, #050308 100%);
    color: white;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    overflow: hidden;
    position: relative;
  }
  body::before {
    content: '';
    position: absolute; inset: 0;
    background-image:
      radial-gradient(circle at 20% 30%, rgba(224, 41, 123, 0.18) 0%, transparent 50%),
      radial-gradient(circle at 80% 70%, rgba(157, 78, 221, 0.12) 0%, transparent 50%);
    pointer-events: none;
  }
  body::after {
    content: '';
    position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
    background-size: 60px 60px;
    pointer-events: none;
  }
  .stage { position: relative; z-index: 2; text-align: center; padding: 60px; max-width: 1700px; }
  .accent { color: #E0297B; }
  .h1 { font-weight: 900; font-size: 156px; letter-spacing: -0.04em; line-height: 0.98; }
  .h2 { font-weight: 900; font-size: 112px; letter-spacing: -0.04em; line-height: 1.0; }
  .sub { font-weight: 500; font-size: 44px; color: rgba(255,255,255,0.65); margin-top: 36px; letter-spacing: -0.01em; }
  .logo-img { width: 200px; height: 200px; object-fit: contain; border-radius: 36px;
    background: rgba(255,255,255,0.06); padding: 28px; box-sizing: border-box;
    box-shadow: 0 30px 80px -20px rgba(224, 41, 123, 0.4);
    border: 1px solid rgba(255,255,255,0.08); }
  .logo-label { font-weight: 700; font-size: 28px; margin-top: 20px; color: rgba(255,255,255,0.7); }
  .pill { display: inline-flex; align-items: center; gap: 16px;
    background: linear-gradient(180deg, #E0297B 0%, #B01368 100%); color: white;
    padding: 18px 40px; border-radius: 999px; font-weight: 800; font-size: 36px;
    box-shadow: 0 20px 60px -10px rgba(224, 41, 123, 0.5); letter-spacing: -0.01em; }
`;

function renderScene(scene) {
  const t = scene.type;
  if (t === "logo-text") {
    const logos = scene.logos
      .map((l) => {
        const b64 = iconB64(l.src);
        return `<div style="display:flex;flex-direction:column;align-items:center">
            <img class="logo-img" src="data:image/png;base64,${b64}">
            <div class="logo-label">${l.label}</div>
          </div>`;
      })
      .join("");
    return `
      <div class="stage">
        <div style="display:flex;gap:80px;justify-content:center;align-items:center;margin-bottom:60px">
          ${logos}
        </div>
        <div class="h1 accent">${scene.headline}</div>
        ${scene.sub ? `<div class="sub">${scene.sub}</div>` : ""}
      </div>
    `;
  }

  if (t === "fail-list") {
    const items = scene.items
      .map(
        (it) =>
          `<li style="display:flex;align-items:center;gap:32px;font-size:64px;font-weight:700;margin:24px 0;letter-spacing:-0.02em">
             <span style="color:#E0297B;font-size:80px;line-height:1">×</span>
             <span>${it}</span>
           </li>`,
      )
      .join("");
    return `
      <div class="stage" style="text-align:left;max-width:1300px">
        <div class="h2" style="margin-bottom:40px">${scene.headline}</div>
        <ul style="list-style:none;padding:0;margin:0">${items}</ul>
      </div>
    `;
  }

  if (t === "logo-row") {
    const logos = scene.logos
      .map(
        (l) => `<div style="display:flex;flex-direction:column;align-items:center">
            <img class="logo-img" style="width:180px;height:180px;padding:22px"
                 src="data:image/png;base64,${iconB64(l.src)}">
            <div class="logo-label">${l.label}</div>
          </div>`,
      )
      .join("");
    return `
      <div class="stage">
        <div class="h2" style="margin-bottom:80px">${scene.headline}</div>
        <div style="display:flex;gap:90px;justify-content:center;align-items:flex-start">${logos}</div>
      </div>
    `;
  }

  if (t === "warning") {
    return `
      <div class="stage" style="text-align:center">
        <div style="font-size:240px;line-height:1;margin-bottom:40px">⚠️</div>
        <div class="h1 accent" style="white-space:pre-line">${scene.headline}</div>
      </div>
    `;
  }

  if (t === "centered-headline") {
    return `
      <div class="stage">
        <div class="h1 accent" style="white-space:pre-line">${scene.headline}</div>
        ${scene.sub ? `<div class="sub">${scene.sub}</div>` : ""}
      </div>
    `;
  }

  if (t === "emoji-text") {
    return `
      <div class="stage">
        <div style="font-size:340px;line-height:1;margin-bottom:30px;
                    font-family:'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif">
          ${scene.emoji}
        </div>
        <div class="h1 accent" style="white-space:pre-line">${scene.headline}</div>
        ${scene.sub ? `<div class="sub">${scene.sub}</div>` : ""}
      </div>
    `;
  }

  if (t === "url-card") {
    return `
      <div class="stage">
        <div style="font-size:80px;font-weight:700;color:rgba(255,255,255,0.4);
                    margin-bottom:30px;letter-spacing:-0.02em">Visit:</div>
        <div class="pill" style="font-size:72px;padding:36px 80px;border-radius:24px">
          ${scene.url}
        </div>
      </div>
    `;
  }

  if (t === "cta") {
    const b64 = iconB64("twineconvert.png");
    return `
      <div class="stage">
        <img class="logo-img" style="width:220px;height:220px;margin-bottom:50px"
             src="data:image/png;base64,${b64}">
        <div class="h2" style="margin-bottom:30px">${scene.tagline}</div>
        <div class="pill" style="font-size:44px;padding:24px 56px;">${scene.url}</div>
      </div>
    `;
  }

  // demo-recording handled separately (uses live MP4)
  throw new Error(`Unknown scene type: ${t}`);
}

// ============================================================================
// Step 1: voice audio per segment
// ============================================================================

console.log("\n[1/7] generating voice audio (ElevenLabs)...");
for (let i = 0; i < script.segments.length; i++) {
  const seg = script.segments[i];
  const audioPath = join(WORK_DIR, `audio-${i}.mp3`);
  if (existsSync(audioPath)) {
    console.log(`  segment ${i}: cached`);
    continue;
  }
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE}`,
    {
      method: "POST",
      headers: { "xi-api-key": KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        text: seg.voice,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.45,
          similarity_boost: 0.8,
          style: 0.55,
          use_speaker_boost: true,
        },
      }),
    },
  );
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${await res.text()}`);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(audioPath, buf);
  console.log(`  segment ${i}: ${buf.length} bytes`);
}

// ============================================================================
// Step 2: live conversion recording (Playwright) for demo segments
// ============================================================================

const hasDemoSegment = script.segments.some((s) => s.scene.type === "demo-recording");
let recordingPath = null;

if (hasDemoSegment) {
  console.log("\n[2/7] recording live conversion (Playwright)...");
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: { dir: WORK_DIR, size: { width: 1920, height: 1080 } },
  });
  const page = await ctx.newPage();
  // DEMO_HOST env override lets the build run from networks where
  // twineconvert.com's custom-domain DNS is broken (e.g. McGill's
  // resolver returning stale A records). The .vercel.app preview URL
  // serves the same deployment, so the demo footage is identical.
  const DEMO_HOST = process.env.DEMO_HOST ?? "https://twineconvert.com";
  await page.goto(`${DEMO_HOST}/${tool}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  const fileInput = await page.$('input[type="file"]');
  if (!fileInput) throw new Error("no file input on tool page");
  await fileInput.setInputFiles(DEMO_FIXTURE);
  await page.waitForTimeout(1200);
  const convertBtn = page.locator('button:has-text("Convert")').first();
  if (await convertBtn.isVisible()) await convertBtn.click();
  await page
    .waitForSelector('button:has-text("Download")', { timeout: 30000 })
    .catch(() => {});
  await page.waitForTimeout(1500);
  await page.close();
  await ctx.close();
  await browser.close();

  const webm = readdirSync(WORK_DIR).find((f) => f.endsWith(".webm"));
  if (!webm) throw new Error("recording webm not found");
  recordingPath = join(WORK_DIR, "conversion-recording.mp4");
  run("ffmpeg", [
    "-y",
    "-i",
    join(WORK_DIR, webm),
    "-c:v",
    "libx264",
    "-preset",
    "fast",
    "-crf",
    "20",
    "-pix_fmt",
    "yuv420p",
    recordingPath,
  ]);
  console.log(`  recording: ${probeDuration(recordingPath).toFixed(2)}s`);
}

// ============================================================================
// Step 3: render scene PNGs (one per segment, except demo segments)
// ============================================================================

console.log("\n[3/7] rendering scene PNGs (Playwright)...");
const scenePaths = [];
const sceneBrowser = await chromium.launch();
const sceneCtx = await sceneBrowser.newContext({
  viewport: { width: 1920, height: 1080 },
});
for (let i = 0; i < script.segments.length; i++) {
  const seg = script.segments[i];
  if (seg.scene.type === "demo-recording") {
    scenePaths.push(null);
    console.log(`  segment ${i}: demo (uses recording)`);
    continue;
  }
  const html = `<!DOCTYPE html><html><head><style>${COMMON_STYLES}</style></head><body>${renderScene(seg.scene)}</body></html>`;
  const page = await sceneCtx.newPage();
  await page.setContent(html);
  await page.waitForTimeout(700);
  const scenePath = join(WORK_DIR, `scene-${i}.png`);
  await page.screenshot({ path: scenePath, fullPage: false });
  scenePaths.push(scenePath);
  await page.close();
  console.log(`  segment ${i}: ${seg.scene.type} rendered`);
}
await sceneCtx.close();
await sceneBrowser.close();

// ============================================================================
// Step 4: per-segment video clips
// ============================================================================

console.log("\n[4/7] building per-segment clips...");
const segmentClips = [];
for (let i = 0; i < script.segments.length; i++) {
  const seg = script.segments[i];
  const audioPath = join(WORK_DIR, `audio-${i}.mp3`);
  const clipPath = join(WORK_DIR, `clip-${i}.mp4`);
  const duration = probeDuration(audioPath);
  const fps = 30;
  const totalFrames = Math.ceil(duration * fps);

  if (seg.scene.type === "demo-recording" && recordingPath) {
    // Use the live recording. Trim to audio duration; scale; overlay a
    // small "live demo" pill.
    const filterComplex = [
      `[0:v]scale=1920:1080,setsar=1,trim=duration=${duration},setpts=PTS-STARTPTS[base]`,
      `color=c=#E0297B@0.95:s=380x68:d=${duration},format=rgba,drawtext=text='LIVE DEMO':x=(w-text_w)/2:y=(h-text_h)/2:fontcolor=white:fontsize=32[pill]`,
    ];
    // drawtext may fail on this Homebrew build; fall back to no pill.
    let useTextPill = false;
    try {
      run("ffmpeg", ["-y", "-f", "lavfi", "-i", "color=c=red:s=10x10:d=0.1", "-vf", "drawtext=text=test:x=0:y=0", "-frames:v", "1", "/tmp/.drawtext-test.png"]);
      useTextPill = true;
    } catch {
      useTextPill = false;
    }
    const finalGraph = useTextPill
      ? filterComplex.concat([`[base][pill]overlay=x=W-w-60:y=60:format=auto[final]`]).join(";")
      : `[0:v]scale=1920:1080,setsar=1,trim=duration=${duration},setpts=PTS-STARTPTS[final]`;
    run("ffmpeg", [
      "-y",
      "-i",
      recordingPath,
      "-i",
      audioPath,
      "-filter_complex",
      finalGraph,
      "-map",
      "[final]",
      "-map",
      "1:a",
      "-c:v",
      "libx264",
      "-preset",
      "fast",
      "-crf",
      "20",
      "-c:a",
      "aac",
      "-b:a",
      "192k",
      "-pix_fmt",
      "yuv420p",
      "-shortest",
      "-r",
      String(fps),
      clipPath,
    ]);
    console.log(`  segment ${i}: demo  ${duration.toFixed(2)}s`);
  } else {
    // Scene PNG: Ken Burns zoom-in (different starting zoom per segment
    // adds visual variety).
    const startZoom = 1.0 + (i % 3) * 0.02;
    const endZoom = startZoom + 0.08;
    const filterComplex = `[0:v]scale=1920:1080,setsar=1,zoompan=z='if(lte(zoom,${startZoom}),${startZoom},min(zoom+0.0015,${endZoom}))':d=${totalFrames}:s=1920x1080:fps=${fps}[final]`;
    run("ffmpeg", [
      "-y",
      "-loop",
      "1",
      "-i",
      scenePaths[i],
      "-i",
      audioPath,
      "-filter_complex",
      filterComplex,
      "-map",
      "[final]",
      "-map",
      "1:a",
      "-c:v",
      "libx264",
      "-preset",
      "fast",
      "-crf",
      "20",
      "-c:a",
      "aac",
      "-b:a",
      "192k",
      "-pix_fmt",
      "yuv420p",
      "-shortest",
      "-r",
      String(fps),
      clipPath,
    ]);
    console.log(`  segment ${i}: ${seg.scene.type}  ${duration.toFixed(2)}s`);
  }
  segmentClips.push(clipPath);
}

// ============================================================================
// Step 5: crossfade-concat segments
// ============================================================================

console.log("\n[5/7] crossfade-concatenating...");
const XFADE_DUR = 0.25;
const segmentDurations = segmentClips.map(probeDuration);
let lastV = "0:v";
let lastA = "0:a";
const xfadeFilters = [];
let cumulative = segmentDurations[0];
for (let i = 1; i < segmentClips.length; i++) {
  const offset = cumulative - XFADE_DUR;
  const vOut = `v${i}`;
  const aOut = `a${i}`;
  xfadeFilters.push(`[${lastV}][${i}:v]xfade=transition=fade:duration=${XFADE_DUR}:offset=${offset}[${vOut}]`);
  xfadeFilters.push(`[${lastA}][${i}:a]acrossfade=d=${XFADE_DUR}[${aOut}]`);
  lastV = vOut;
  lastA = aOut;
  cumulative += segmentDurations[i] - XFADE_DUR;
}
const concatPath = join(WORK_DIR, "concat.mp4");
const concatInputs = segmentClips.flatMap((p) => ["-i", p]);
run("ffmpeg", [
  "-y",
  ...concatInputs,
  "-filter_complex",
  xfadeFilters.join(";"),
  "-map",
  `[${lastV}]`,
  "-map",
  `[${lastA}]`,
  "-c:v",
  "libx264",
  "-preset",
  "fast",
  "-crf",
  "20",
  "-c:a",
  "aac",
  "-b:a",
  "192k",
  "-pix_fmt",
  "yuv420p",
  concatPath,
]);
console.log(`  concat: ${probeDuration(concatPath).toFixed(2)}s`);

// ============================================================================
// Step 6: mix in background music
// ============================================================================

const finalPath = join(OUT_DIR, `${tool}.mp4`);
if (MUSIC_PATH && existsSync(MUSIC_PATH)) {
  console.log(`\n[6/7] mixing in background music: ${MUSIC_PATH}...`);
  run("ffmpeg", [
    "-y",
    "-i",
    concatPath,
    "-stream_loop",
    "-1",
    "-i",
    MUSIC_PATH,
    "-filter_complex",
    "[1:a]volume=0.06,aloop=loop=-1:size=2e9[bg];[0:a][bg]amix=inputs=2:duration=first:dropout_transition=0[a]",
    "-map",
    "0:v",
    "-map",
    "[a]",
    "-c:v",
    "copy",
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    "-shortest",
    finalPath,
  ]);
} else {
  console.log(`\n[6/7] no MUSIC_PATH set or file missing, skipping music`);
  run("ffmpeg", ["-y", "-i", concatPath, "-c", "copy", finalPath]);
}

// ============================================================================
// Step 7: thumbnail
// ============================================================================

console.log("\n[7/7] generating thumbnail...");
const thumbPath = join(OUT_DIR, `${tool}-thumb.png`);
const hookText = script.thumbnailHook || script.title;
const thumbEmoji = script.thumbnailEmoji || "✨";
const thumbBadge = script.thumbnailBadge || "FREE & EASY";
const thumbBrowser = await chromium.launch();
const thumbPage = await thumbBrowser.newPage({ viewport: { width: 1280, height: 720 } });
const iconB64Twine = iconB64("twineconvert.png");
const thumbHtml = `<!DOCTYPE html><html><head><style>
  ${COMMON_STYLES}
  body { width: 1280px; height: 720px; padding: 0; flex-direction: row;
         justify-content: space-between; align-items: center; }
  .left { flex: 0 0 480px; display: flex; align-items: center; justify-content: center;
          padding: 40px; position: relative; z-index: 2; }
  .left .emoji {
    font-size: 360px; line-height: 1;
    font-family: 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif;
    filter: drop-shadow(0 30px 60px rgba(224, 41, 123, 0.4));
  }
  .right { flex: 1; padding-right: 50px; position: relative; z-index: 2; text-align: left; }
  .right .hook {
    font-weight: 900; font-size: 110px; letter-spacing: -0.04em; line-height: 0.96;
    color: white; white-space: pre-line; margin-bottom: 28px;
    text-shadow: 0 4px 24px rgba(0,0,0,0.5);
  }
  .right .hook .accent { color: #E0297B; }
  .right .badge {
    display: inline-block;
    background: linear-gradient(180deg, #E0297B 0%, #B01368 100%); color: white;
    font-weight: 900; font-size: 38px; letter-spacing: 0.04em;
    padding: 16px 32px; border-radius: 12px;
    box-shadow: 0 18px 50px -8px rgba(224, 41, 123, 0.65);
    transform: rotate(-2deg);
  }
  .brand {
    position: absolute; top: 24px; right: 24px; z-index: 3;
    display: flex; align-items: center; gap: 10px;
    background: rgba(255,255,255,0.10); padding: 10px 18px;
    border-radius: 10px; backdrop-filter: blur(8px);
    font-weight: 800; font-size: 20px; letter-spacing: -0.01em;
    border: 1px solid rgba(255,255,255,0.10);
  }
  .brand img { width: 26px; height: 26px; border-radius: 6px; }
</style></head><body>
  <div class="brand"><img src="data:image/png;base64,${iconB64Twine}">twineconvert</div>
  <div class="left"><div class="emoji">${thumbEmoji}</div></div>
  <div class="right">
    <div class="hook">${hookText
      .replace(/</g, "&lt;")
      .split("\n")
      .map((line, idx) => idx === 1 ? `<span class="accent">${line}</span>` : line)
      .join("<br>")}</div>
    <div class="badge">${thumbBadge}</div>
  </div>
</body></html>`;
await thumbPage.setContent(thumbHtml);
await thumbPage.waitForTimeout(800);
await thumbPage.screenshot({ path: thumbPath, fullPage: false });
await thumbBrowser.close();

console.log(`\nDone.`);
const finalSize = (statSync(finalPath).size / 1024 / 1024).toFixed(2);
console.log(`  ${finalPath}  (${probeDuration(finalPath).toFixed(2)}s, ${finalSize} MB)`);
console.log(`  ${thumbPath}`);
console.log(`\nopen ${finalPath}`);
