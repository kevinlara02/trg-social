// GET: returns the daily Trends history (lazily records today's snapshot the
// first time it's read each day). Vercel Node function; storage via Vercel Blob.
import { ensureToday } from "../lib/social-blob.js";

export default async function handler(req, res) {
  const _pt = process.env.SOCIAL_PROXY_TOKEN;
  if (_pt && req.headers["x-proxy-token"] !== _pt) return res.status(401).json({ error: "unauthorized" });
  try {
    const history = await ensureToday();
    return res.status(200).json({ ok: true, history });
  } catch (err) {
    return res.status(200).json({ ok: false, error: String(err?.message || err), history: [] });
  }
}
