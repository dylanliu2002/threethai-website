#!/usr/bin/env node
/**
 * IndexNow batch submission — submits every URL in the live sitemap to the
 * IndexNow alliance (Bing, Seznam, Yandex, Naver, etc.).
 *
 * Protocol: POST https://api.indexnow.org/IndexNow
 *   { host, key, keyLocation, urlList }   (max 10,000 URLs per request)
 *
 * Usage:
 *   node scripts/indexnow-submit.mjs [--dry-run] [--sitemap <url>] [--host <origin>]
 *
 * The key file public/<key>.txt must be reachable at keyLocation (200, direct).
 */

const KEY = "7cdcdd0e1c069300b1b153d7d7e9e672";
const DEFAULT_SITEMAP = "https://www.threethai.com/sitemap.xml";
const CANONICAL_HOST = "www.threethai.com";

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(name);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
};
const dryRun = args.includes("--dry-run");
const sitemapUrl = opt("--sitemap", DEFAULT_SITEMAP);

/** Rewrite any apex-host URL to the canonical www host (apex 308s to www). */
const normalize = (u) => u.replace("https://threethai.com", "https://www.threethai.com");

const extractUrls = (xml) => {
  const urls = new Set();
  for (const m of xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)) urls.add(normalize(m[1]));
  for (const m of xml.matchAll(/<xhtml:link[^>]*href="([^"]+)"[^>]*\/?>/g)) urls.add(normalize(m[1]));
  for (const m of xml.matchAll(/<xhtml:link[^>]*href='([^']+)'[^>]*\/?>/g)) urls.add(normalize(m[1]));
  return [...urls].sort();
};

const main = async () => {
  console.log(`Fetching sitemap: ${sitemapUrl}`);
  const res = await fetch(sitemapUrl, { headers: { "user-agent": "indexnow-submit/1.0" } });
  if (!res.ok) {
    console.error(`Sitemap fetch failed: HTTP ${res.status}`);
    process.exit(1);
  }
  const xml = await res.text();
  const urls = extractUrls(xml);

  if (urls.length === 0) {
    console.error("No URLs extracted — aborting.");
    process.exit(1);
  }

  const bad = urls.filter((u) => !u.startsWith(`https://${CANONICAL_HOST}/`));
  if (bad.length) {
    console.error(`Found ${bad.length} URL(s) off canonical host, e.g. ${bad[0]} — aborting.`);
    process.exit(1);
  }

  const payload = {
    host: CANONICAL_HOST,
    key: KEY,
    keyLocation: `https://${CANONICAL_HOST}/${KEY}.txt`,
    urlList: urls,
  };

  console.log(`URLs to submit: ${urls.length}`);
  console.log(`Key location:   ${payload.keyLocation}`);
  console.log(`First 3:        ${urls.slice(0, 3).join(", ")}`);

  if (dryRun) {
    console.log("Dry run — payload not sent.");
    return;
  }

  const post = await fetch("https://api.indexnow.org/IndexNow", {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify(payload),
  });

  console.log(`IndexNow response: HTTP ${post.status} ${post.statusText}`);
  const body = await post.text().catch(() => "");
  if (body) console.log(body.slice(0, 500));

  const meaning = {
    200: "OK — URLs submitted; key validated.",
    202: "Accepted — URLs received; key will be validated asynchronously (re-submit within 24h if key was never seen before).",
    400: "Bad request — invalid format.",
    403: "Forbidden — key file not valid (check keyLocation returns the key verbatim).",
    422: "Unprocessable — URLs belong to another host or key mismatch.",
    429: "Too many requests — slow down.",
  };
  if (meaning[post.status]) console.log(`→ ${meaning[post.status]}`);
  if (post.status >= 400) process.exit(2);
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
