// Records one Trends snapshot. Runs daily via Vercel Cron (see vercel.json).
// Vercel Node function; storage via Vercel Blob.
import { ensureToday } from "../lib/social-blob.js";

export default async function handler(req, res) {
  // Cron calls this with GET; also allow the proxy-token gate for manual calls.
  const _pt = process.env.SOCIAL_PROXY_TOKEN;
  const isCron = !!req.headers["x-vercel-cron"];
  if (!isCron && _pt && req.headers["x-proxy-token"] !== _pt) return res.status(401).json({ error: "unauthorized" });
  try {
    const history = await ensureToday();
    return res.status(200).json({ ok: true, days: history.length });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err?.message || err) });
  }
}
