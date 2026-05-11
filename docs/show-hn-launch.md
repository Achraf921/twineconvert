# Show HN launch package

Target date: Thursday May 14, 2026
Post window: 6:30 to 7:30 AM Pacific (9:30 to 10:30 AM Eastern)

## Submission

**Title (78 chars, HN cap is 80):**

```
Show HN: Twineconvert, 300+ file converters that run entirely in your browser
```

**URL:**

```
https://twineconvert.com
```

**Submission text:** leave blank.

## First comment

Post immediately after the submission goes live, from the same account. HN ranks Show HN posts partly on early engagement and the maker's first comment is the conventional way to set the technical frame.

```
Hi HN,

I built twineconvert because I kept hitting the same wall: I'd need to convert a
file (HEIC from my phone, a BibTeX file a collaborator sent, an SVG to PNG for a
slide), and the options were always (a) sign up for a service, (b) upload to
someone's server, or (c) install a 200MB desktop app.

So I made a site where conversion happens entirely client-side via WebAssembly.
Your file never leaves your machine. No signup, no upload, no queue.

A few tools that might interest this crowd:

- /mp4-to-mp3 (FFmpeg.wasm in a Web Worker)
- /heic-to-jpg (libheif-js; handles modern iPhone profiles where the older
  heic2any chokes)
- /bibtex-to-csv and the rest of the BibTeX family (CSL-JSON, RIS, NBIB,
  EndNote XML)
- /color (HEX, RGB, HSL, OKLCH, LAB and back, round-trip tested via culori)
- /hl7-to-json (hand-written parser because MSH-1 IS the field separator and the
  off-the-shelf libs got that wrong)
- /ifc-to-json (web-ifc for civil engineering BIM files)

What's been interesting to build:

1. Round-trip bijectivity tests. For every supported pair, parse(format(x)) must
   equal x exactly, not just "produces something." 1300+ tests across the
   registry. Caught nasty bugs like OKLCH where white was round-tripping to
   black (was using formatCss instead of a real converter chain), and Papa
   Parse's default \r\n line endings making the last cell of every CSV end with
   a stray \n.

2. Memory pressure on mobile. Big inputs (250MB+ video, multipage PSDs) hit
   browser limits before the conversion logic does. I'd appreciate advice on
   chunking strategies that don't involve sending bytes to a server.

3. Funnel analytics just got wired up. Early signal is that large-file timeouts
   cause a meaningful drop-off between file_selected and convert_success, but I
   haven't fully characterized the failure modes yet.

Honest limits:

- No HEVC encode (browsers don't ship the encoder)
- ~100MB practical ceiling for video on typical desktop machines
- Mobile is worse than desktop on anything memory-heavy
- One-person project on Vercel; if HN hugs it I'll see how the static export
  holds up

Free for now. AdSense once traffic justifies an application; no upsell, no
signup wall planned.

Happy to answer questions about any specific converter, the WASM build, the
test architecture, or how a static Next.js site keeps 300 tool pages indexed
without a content farm penalty.
```

## Launch day playbook

### The night before (Wednesday May 13)

- Make sure your HN account is logged in on your main browser.
- Confirm your account has enough karma to comment immediately. New accounts can post but sometimes can't comment for a few hours, which kills the first-comment plan. Test by leaving a comment on an unrelated thread the day before.
- Re-read the title and first comment one final time. After submission you cannot edit the title.

### Submission (Thursday morning)

1. 6:30 to 7:30 AM Pacific. Open https://news.ycombinator.com/submit
2. Paste the title and URL above. Submit.
3. Immediately open your submission and paste the first comment.
4. Pin the tab. Refresh every 2 to 3 minutes for the first 30 minutes.

### First 30 minutes (the make or break window)

If you are not on the front page within 30 minutes, you usually will not be. Do not panic if rank is slow. The signal is comments and upvotes from logged-in HN users, not your friends.

- Do not ask friends or anyone to upvote. HN detects coordinated voting and silently penalizes. Just post and let it ride.
- Do not delete and resubmit if it flops. That gets flagged faster.
- Reply to every comment in this window even if it is one sentence. Velocity matters.

### First 3 hours (peak engagement)

Stay at the keyboard. The replies you write here are what people see when they land on the post.

- For technical questions: answer with specifics. File paths, function names, library versions. HN respects depth.
- For "why not just use X" comments: acknowledge the alternative, then explain the specific reason you went a different way. Defensive tone tanks threads.
- For hostile or dismissive comments: do not match the energy. "That is a fair point, here is the reasoning behind this choice" lands well.
- For praise: a short thanks is fine. Do not over-thank, it reads as needy.

### Hours 3 to 12

- Check in every 30 to 60 minutes.
- If a thread is still active, keep engaging. Some HN posts get more comments in hours 6 to 10 than in hour 1.

### Day 2 and after

- Reply to any late comments for 48 hours. After that the thread is archived.
- Note the final score, comment count, and which tools got the most clicks (from your PostHog or analytics dashboard).

## Response templates for common HN comments

### "How does this compare to CloudConvert?"

```
CloudConvert is server-side: you upload your file, their backend converts it,
you download. That works great but means trusting their infra with whatever
you're converting. Twineconvert never uploads, the conversion runs in your
browser tab via WebAssembly. Trade-off is large files (>~100MB video) struggle
on browser memory where their server doesn't care.
```

### "Why not just use FFmpeg / ImageMagick / X locally?"

```
You absolutely can, and for power users a native tool is faster. The audience
here is "I have a file and a browser and don't want to install or sign up for
anything." Most people converting one HEIC photo do not want a CLI.
```

### "Is this open source?"

```
Not currently. Maybe down the line; right now I'm focused on getting it useful
before deciding on a license.
```

### "How are you going to make money?"

```
AdSense once traffic justifies an application (a few weeks out). Long-term path
is Mediavine then Raptive as session counts grow. No upsell, no signup wall, no
freemium gating planned. The conversion stays free.
```

### "Memory leak on big files / browser crashes"

```
Yeah, this is a known limit. The conversion runs in a Web Worker but the
browser still has to hold the input plus the output buffer plus FFmpeg's
intermediate state. ~100MB video is roughly where it gets dicey on a typical
laptop. I'd love a better strategy than "tell people to use a smaller file."
```

### "Cool, why not WASM-build [specific niche tool] too?"

```
On my list if there's a usable WASM port. Drop the format pair (input -> output)
and I'll look at it. Some asks are blocked by no WASM build existing for the
underlying decoder (RAW camera files, ProRes).
```

### "How does the SEO not get penalized as a content farm?"

```
Three things: every page has actual working functionality (not just generated
text), each tool page has a unique 200-400 word "why convert" section written
manually, and the blog posts answer real questions ("what is a HEIC file" etc).
Google's spam policy is about thin or duplicate content; the converter pages
each do a different unique job. Time will tell if that holds.
```

### "I tried converting X and it failed"

```
Sorry about that. Two ways I can debug: (1) the PostHog convert_error event
should have captured the error class, I'll grep my dashboard. (2) If you're
willing, paste the file extension and approximate size and I'll try to
reproduce.
```

## Things to NOT do

- Do not ask people to upvote, anywhere. Not Twitter, not Discord, not friends. HN catches it.
- Do not edit the title after submission. You can't, but more importantly, don't try.
- Do not delete the post if it flops. Just leave it. A flop post is invisible; a deleted-then-resubmitted post gets flagged.
- Do not respond to dang (the HN moderator) defensively if he reaches out. He's almost always being helpful.
- Do not call it a "launch" in the comment. HN dislikes that framing for Show HN. Just describe what it is.
- Do not include screenshots or emoji in the first comment. Plain text only.

## Honest expectations

The realistic range for a well-prepared Show HN post:

| Outcome | Score | What it looks like |
|---|---|---|
| Front page hit | 100-500+ | Sustained traffic for 3-7 days, lasting backlink, ranks in Google for "twineconvert" instantly |
| Modest interest | 20-99 | A few hundred visits, some genuinely useful comments, no viral moment |
| Buried | <20 | Tens of visits, mostly from HN power users, no front page |

Most Show HN posts are in the second category. The first comment quality is the biggest controllable variable. The format of the post (technical, honest, specific) is set up to maximize the chance of category 1 but most do not get there.

If it flops on Thursday, **do not** resubmit a different angle a week later. HN remembers. If it really flops, wait 6 months and post again only if there's a substantive new version.

## After the launch

- Capture the submission URL.
- Note the peak rank reached (1-30 = great, 31-90 = good, off-page = flop).
- Note final score and comment count.
- Compare traffic in PostHog: HN visitor patterns are spiky (most in hour 1-6), Twitter visitors are sustained.
- Friday morning, do a brief retrospective in this file: what worked, what to do differently if a v2 ever launches.
