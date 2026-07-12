// Shared storage + trends logic for the Vercel port. Replaces the Netlify
// Blobs helper (netlify/snapshot-core.js) with Vercel Blob. Reads/writes small
// JSON documents by a stable pathname; auto-uses BLOB_READ_WRITE_TOKEN from the
// Vercel Blob store env. Zero new secrets beyond linking a Blob store.
import { list, put } from "@vercel/blob";

const MAX_DAYS = 400;

// Base URL of THIS deployment (to call sibling functions). Vercel injects
// VERCEL_PROJECT_PRODUCTION_URL / VERCEL_URL (host only, no protocol).
function base() {
  const host = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  return host ? `https://${host}` : "https://trg-social.vercel.app";
}

export function today() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
}

// Read a JSON doc stored at `key` (Vercel Blob). Returns null if missing.
export async function readJson(key) {
  try {
    const { blobs } = await list({ prefix: key });
    const b = blobs.find((x) => x.pathname === key) || blobs[0];
    if (!b) return null;
    const r = await fetch(b.url, { cache: "no-store" });
    return r.ok ? await r.json() : null;
  } catch {
    return null;
  }
}

// Write a JSON doc at `key` (overwrites in place, stable pathname).
export async function writeJson(key, data) {
  await put(key, JSON.stringify(data), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

// Pull current numbers from the sibling live functions (Yelp + Meta), merged
// by restaurant. Includes the proxy token so it works with the gate on.
async function fetchCurrent() {
  const b = base();
  const token = process.env.SOCIAL_PROXY_TOKEN;
  const headers = token ? { "x-proxy-token": token } : {};
  const grab = (path) =>
    fetch(`${b}${path}`, { headers }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
  const [yelpRes, metaRes] = await Promise.all([
    grab("/api/yelp-ratings"),
    grab("/api/meta-live"),
  ]);
  const byCode = {};
  for (const y of yelpRes?.restaurants || []) {
    byCode[y.code] = { code: y.code, rating: y.rating ?? null, reviews: y.review_count ?? null, ig: null, fb: null };
  }
  for (const m of metaRes?.restaurants || []) {
    byCode[m.code] = byCode[m.code] || { code: m.code, rating: null, reviews: null };
    byCode[m.code].ig = m.ig_followers ?? null;
    byCode[m.code].fb = m.fb_followers ?? null;
  }
  return Object.values(byCode);
}

export async function getHistory() {
  return (await readJson("trends/history.json")) || [];
}

// Append today's snapshot if not recorded yet, then return the history.
export async function ensureToday() {
  let history = (await readJson("trends/history.json")) || [];
  const day = today();
  if (history.some((h) => h.date === day)) return history;
  const restaurants = await fetchCurrent();
  if (!restaurants.length) return history; // nothing live yet; try again later
  history = [...history, { date: day, restaurants }];
  if (history.length > MAX_DAYS) history = history.slice(-MAX_DAYS);
  await writeJson("trends/history.json", history);
  return history;
}
