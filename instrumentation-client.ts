/**
 * PostHog initialization (Next.js 15.3+ client instrumentation hook).
 *
 * This file runs ONCE in the browser on the first page load, before any
 * React components mount. It registers PostHog so `posthog.capture()`
 * calls anywhere in the app go to our project.
 *
 * The `defaults: '2026-01-30'` preset enables PostHog's recommended
 * settings as of that date — autocapture (clicks/inputs/scrolls),
 * session replay, web vitals, and exception tracking. If we ever need
 * to disable specific captures (e.g. for EU GDPR compliance), we'd swap
 * the defaults string for explicit config flags.
 *
 * Why `instrumentation-client.ts` and not a React provider component:
 * Next.js 15.3+ ships a lightweight client-instrumentation hook that
 * runs earlier in the page lifecycle than any provider could, so we
 * don't lose events fired during initial hydration.
 */

import posthog from "posthog-js";

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN!, {
  api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  defaults: "2026-01-30",
});
