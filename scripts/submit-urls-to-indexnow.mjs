/**
 * Bulk-submit every URL on twineconvert.com to IndexNow.
 *
 * IndexNow is an open standard that signals fresh URLs to Bing, Yandex,
 * Naver, and Seznam in one shot — they all consume the same submission.
 * Google does NOT participate (use submit-urls-to-google.mjs for that).
 *
 * Auth: a key file hosted at the site root proves you own the domain.
 * No service account, no OAuth, no quota concerns — just a POST.
 *
 * Usage:  node scripts/submit-urls-to-indexnow.mjs
 *
 * The key file must be live at:
 *   https://twineconvert.com/c46c7be89c7448a3abb66805a8bc5609.txt
 * (the deploy includes it via public/ so this is automatic)
 */

const KEY = "c46c7be89c7448a3abb66805a8bc5609";
const HOST = "twineconvert.com";
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;
const ENDPOINT = "https://api.indexnow.org/IndexNow";
const BATCH_SIZE = 10000; // IndexNow's max per request

async function fetchSitemapUrls() {
  const res = await fetch(`https://${HOST}/sitemap.xml`);
  if (!res.ok) throw new Error(`sitemap fetch failed: ${res.status}`);
  const xml = await res.text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
}

const urls = await fetchSitemapUrls();
console.log(`sitemap: ${urls.length} URLs`);

// IndexNow's bulk endpoint — one POST submits the whole list to every
// participating engine simultaneously.
for (let i = 0; i < urls.length; i += BATCH_SIZE) {
  const batch = urls.slice(i, i + BATCH_SIZE);
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host: HOST,
      key: KEY,
      keyLocation: KEY_LOCATION,
      urlList: batch,
    }),
  });

  if (res.status === 200 || res.status === 202) {
    console.log(`  batch ${i / BATCH_SIZE + 1}: ${batch.length} URLs accepted (${res.status})`);
  } else {
    const body = await res.text();
    console.error(`  batch ${i / BATCH_SIZE + 1}: FAILED  status=${res.status}  body=${body.slice(0, 200)}`);
  }
}

console.log("\ndone. Bing / Yandex / Naver / Seznam will crawl over the next hours.");
