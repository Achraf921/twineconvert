/**
 * End-to-end tutorial video builder.
 *
 * Pipeline:
 *   1. Read script JSON (segments with voice text + overlay text + screenshot ref)
 *   2. Generate one voice MP3 per segment via ElevenLabs API
 *   3. Capture screenshots from twineconvert.com via Playwright (homepage,
 *      tool page in idle/converting/done states)
 *   4. Build per-segment video clips with ffmpeg: screenshot with subtle
 *      Ken Burns zoom + bold animated text overlay + that segment's audio
 *   5. Concat all segment clips into final tutorial MP4
 *   6. Generate Fireship-style thumbnail PNG
 *
 * Output:
 *   tutorials/output/<tool>.mp4
 *   tutorials/output/<tool>-thumb.png
 *
 * Usage:
 *   ELEVENLABS_API_KEY=... ELEVENLABS_VOICE_ID=... \
 *     node tutorials/build-tutorial.mjs heic-to-jpg
 */

import { execFileSync } from "node:child_process";
import { writeFileSync, readFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";
import { chromium } from "playwright";

const tool = process.argv[2];
if (!tool) {
  console.error("Usage: node build-tutorial.mjs <tool-id>");
  console.error("Example: node build-tutorial.mjs heic-to-jpg");
  process.exit(1);
}

const KEY = process.env.ELEVENLABS_API_KEY;
const VOICE = process.env.ELEVENLABS_VOICE_ID;
if (!KEY || !VOICE) {
  console.error("Set ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID env vars.");
  process.exit(1);
}

const SCRIPT_PATH = resolve(`tutorials/scripts/${tool}.json`);
const OUT_DIR = resolve("tutorials/output");
const WORK_DIR = resolve(`tutorials/output/.work-${tool}`);

if (!existsSync(SCRIPT_PATH)) {
  console.error(`Script not found: ${SCRIPT_PATH}`);
  process.exit(1);
}

mkdirSync(OUT_DIR, { recursive: true });
mkdirSync(WORK_DIR, { recursive: true });

const script = JSON.parse(readFileSync(SCRIPT_PATH, "utf8"));
console.log(`Building tutorial: ${script.title}`);
console.log(`  ${script.segments.length} segments`);

function run(cmd, args, opts = {}) {
  return execFileSync(cmd, args, { encoding: "utf8", stdio: "pipe", ...opts });
}

// ============================================================================
// Step 1: generate voice audio per segment
// ============================================================================

console.log("\n[1/5] generating voice audio (ElevenLabs)...");
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
      headers: {
        "xi-api-key": KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: seg.voice,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.4,
          use_speaker_boost: true,
        },
      }),
    },
  );
  if (!res.ok) {
    throw new Error(`ElevenLabs ${res.status}: ${await res.text()}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(audioPath, buf);
  console.log(`  segment ${i}: ${buf.length} bytes`);
}

// ============================================================================
// Step 2: capture screenshots from twineconvert.com
// ============================================================================

console.log("\n[2/5] capturing screenshots (Playwright)...");
const SCREENSHOT_TYPES = new Set(script.segments.map((s) => s.screenshot));
const screenshotPaths = {};

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
const page = await ctx.newPage();

if (SCREENSHOT_TYPES.has("homepage")) {
  await page.goto("https://twineconvert.com/", { waitUntil: "networkidle" });
  const path = join(WORK_DIR, "shot-homepage.png");
  await page.screenshot({ path, fullPage: false });
  screenshotPaths.homepage = path;
  console.log(`  homepage: captured`);
}

if (
  SCREENSHOT_TYPES.has("tool-idle") ||
  SCREENSHOT_TYPES.has("tool-converting") ||
  SCREENSHOT_TYPES.has("tool-done")
) {
  await page.goto(`https://twineconvert.com/${tool}`, {
    waitUntil: "networkidle",
  });
  await page.waitForTimeout(500);
  if (SCREENSHOT_TYPES.has("tool-idle")) {
    const path = join(WORK_DIR, "shot-tool-idle.png");
    await page.screenshot({ path, fullPage: false });
    screenshotPaths["tool-idle"] = path;
    console.log(`  tool-idle: captured`);
  }
  // For converting/done states we'd ideally drop a real file and capture
  // the live UI mid-conversion. Simpler for the prototype: reuse the idle
  // shot with different overlays. The video viewer's eye won't track that
  // closely in a 60-90 second tutorial.
  if (SCREENSHOT_TYPES.has("tool-converting")) {
    screenshotPaths["tool-converting"] = screenshotPaths["tool-idle"];
  }
  if (SCREENSHOT_TYPES.has("tool-done")) {
    screenshotPaths["tool-done"] = screenshotPaths["tool-idle"];
  }
}

// Render each segment's overlay text as a transparent PNG via Playwright.
// Avoids relying on ffmpeg's drawtext filter (Homebrew ffmpeg ships
// without freetype support). Bonus: full CSS typography control.
console.log("\n[2b/5] rendering text overlays as PNGs...");
const overlayPaths = [];
for (let i = 0; i < script.segments.length; i++) {
  const seg = script.segments[i];
  const html = `<!DOCTYPE html><html><head><style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@900&display=swap');
    html, body { margin: 0; padding: 0; background: transparent; font-family: 'Inter', system-ui, -apple-system, sans-serif; }
    body { width: 1920px; height: 1080px; display: flex; align-items: flex-end; justify-content: center; padding-bottom: 80px; box-sizing: border-box; }
    .overlay {
      background: linear-gradient(180deg, #E0297B 0%, #C2185B 100%);
      color: white;
      font-weight: 900;
      font-size: 88px;
      letter-spacing: -0.03em;
      padding: 28px 56px;
      border-radius: 16px;
      box-shadow: 0 30px 80px -10px rgba(224, 41, 123, 0.6);
      text-align: center;
      line-height: 1.05;
      max-width: 1700px;
      text-shadow: 0 4px 20px rgba(0,0,0,0.3);
    }
  </style></head><body>
    <div class="overlay">${seg.overlay.replace(/</g, "&lt;")}</div>
  </body></html>`;
  const overlayPage = await ctx.newPage();
  await overlayPage.setViewportSize({ width: 1920, height: 1080 });
  await overlayPage.setContent(html);
  await overlayPage.waitForTimeout(500); // let webfont load
  const overlayPath = join(WORK_DIR, `overlay-${i}.png`);
  await overlayPage.screenshot({
    path: overlayPath,
    fullPage: false,
    omitBackground: true,
  });
  overlayPaths.push(overlayPath);
  await overlayPage.close();
  console.log(`  overlay ${i}: rendered`);
}

await browser.close();

// ============================================================================
// Step 3: build per-segment video clips
// ============================================================================

console.log("\n[3/5] building per-segment clips (ffmpeg)...");
const segmentClips = [];
for (let i = 0; i < script.segments.length; i++) {
  const seg = script.segments[i];
  const audioPath = join(WORK_DIR, `audio-${i}.mp3`);
  const screenshotPath = screenshotPaths[seg.screenshot];
  const clipPath = join(WORK_DIR, `clip-${i}.mp4`);

  // Get audio duration so the video matches
  const probeOut = run("ffprobe", [
    "-i",
    audioPath,
    "-show_entries",
    "format=duration",
    "-v",
    "quiet",
    "-of",
    "csv=p=0",
  ]);
  const duration = parseFloat(probeOut.trim());
  console.log(`  segment ${i}: ${duration.toFixed(2)}s, "${seg.overlay}"`);

  const fps = 30;
  const totalFrames = Math.ceil(duration * fps);
  const overlayPath = overlayPaths[i];

  // Filter graph:
  //   [0:v] = base screenshot, scale to 1920x1080, slow Ken Burns zoom
  //   [1:v] = transparent overlay PNG
  //   composite via overlay filter
  const filterComplex = [
    `[0:v]scale=1920:1080,setsar=1,zoompan=z='min(zoom+0.0008,1.05)':d=${totalFrames}:s=1920x1080:fps=${fps}[zoomed]`,
    `[zoomed][1:v]overlay=0:0:format=auto[final]`,
  ].join(";");

  run("ffmpeg", [
    "-y",
    "-loop",
    "1",
    "-i",
    screenshotPath,
    "-i",
    overlayPath,
    "-i",
    audioPath,
    "-filter_complex",
    filterComplex,
    "-map",
    "[final]",
    "-map",
    "2:a",
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

  segmentClips.push(clipPath);
}

// ============================================================================
// Step 4: concat all segment clips
// ============================================================================

console.log("\n[4/5] concatenating segments...");
const concatList = segmentClips.map((p) => `file '${p}'`).join("\n");
const concatPath = join(WORK_DIR, "concat.txt");
writeFileSync(concatPath, concatList);

const finalPath = join(OUT_DIR, `${tool}.mp4`);
run("ffmpeg", [
  "-y",
  "-f",
  "concat",
  "-safe",
  "0",
  "-i",
  concatPath,
  "-c",
  "copy",
  finalPath,
]);
console.log(`  wrote ${finalPath}`);

// ============================================================================
// Step 5: generate Fireship-style thumbnail (Playwright + ffmpeg overlay)
// ============================================================================

console.log("\n[5/5] generating thumbnail...");
const thumbPath = join(OUT_DIR, `${tool}-thumb.png`);
const hookText = script.thumbnailHook || script.title;

// Render the thumbnail entirely in Playwright since it's just a static image.
// More typographic control than ffmpeg + no font dependency.
const thumbBrowser = await chromium.launch();
const thumbPage = await thumbBrowser.newPage({
  viewport: { width: 1280, height: 720 },
});
const baseShot = screenshotPaths.homepage || Object.values(screenshotPaths)[0];
const baseB64 = readFileSync(baseShot).toString("base64");
const thumbHtml = `<!DOCTYPE html><html><head><style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@900&display=swap');
  html, body { margin: 0; padding: 0; height: 100%; font-family: 'Inter', system-ui, sans-serif; }
  body {
    width: 1280px; height: 720px;
    background-image: linear-gradient(180deg, rgba(16,16,25,0.55), rgba(16,16,25,0.85)), url('data:image/png;base64,${baseB64}');
    background-size: cover; background-position: center;
    display: flex; align-items: center; justify-content: center;
    overflow: hidden; position: relative;
  }
  body::before {
    content: ''; position: absolute; inset: 0;
    backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
  }
  .hook {
    position: relative;
    background: linear-gradient(180deg, #E0297B 0%, #C2185B 100%);
    color: white;
    font-weight: 900;
    font-size: 128px;
    letter-spacing: -0.04em;
    line-height: 0.95;
    padding: 36px 60px;
    border-radius: 18px;
    box-shadow: 0 30px 80px -10px rgba(224, 41, 123, 0.7);
    text-align: center;
    text-shadow: 0 4px 24px rgba(0,0,0,0.35);
    transform: rotate(-2deg);
    white-space: pre-line;
  }
</style></head><body>
  <div class="hook">${hookText.replace(/</g, "&lt;")}</div>
</body></html>`;
await thumbPage.setContent(thumbHtml);
await thumbPage.waitForTimeout(800);
await thumbPage.screenshot({ path: thumbPath, fullPage: false });
await thumbBrowser.close();
console.log(`  wrote ${thumbPath}`);

console.log(`\nDone. Open with:`);
console.log(`  open ${finalPath}`);
console.log(`  open ${thumbPath}`);
