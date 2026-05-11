/**
 * Daily cron route. Vercel fires this once per day (per vercel.json
 * `crons` config, currently 00:05 UTC) and we use it to trigger a
 * fresh production rebuild so newly-arrived scheduled blog posts go
 * live on their publishDate.
 *
 * Implementation: fetch the project's Deploy Hook URL stored in the
 * VERCEL_DEPLOY_HOOK_URL env var. The Deploy Hook is set up in the
 * Vercel dashboard (Project → Settings → Git → Deploy Hooks → Create
 * Hook). The URL is sensitive (anyone with it can trigger builds) so
 * it lives in env vars only, never in the repo.
 *
 * If the env var isn't set, the cron does nothing and returns 204
 * (rather than 500) so the cron history doesn't fill with errors
 * during pre-launch setup.
 */

export const dynamic = "force-dynamic";

export async function GET() {
  const hookUrl = process.env.VERCEL_DEPLOY_HOOK_URL;

  if (!hookUrl) {
    return new Response(
      "VERCEL_DEPLOY_HOOK_URL not set; cron is wired but inactive",
      { status: 204 },
    );
  }

  try {
    const res = await fetch(hookUrl, { method: "POST" });
    return new Response(`Deploy hook fired: ${res.status}`, { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(`Deploy hook failed: ${msg}`, { status: 500 });
  }
}
