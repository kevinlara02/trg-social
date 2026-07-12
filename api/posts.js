// History of posts published from the app (Vercel Blob), so the Publish page
// calendar/list can show what's been posted.
// GET -> { ok, posts }. POST { code, networks, caption, image_url, results } -> appends.
import { readJson, writeJson } from "../lib/social-blob.js";

const KEY = "posts/history.json";
const MAX = 500;

export default async function handler(req, res) {
  const _pt = process.env.SOCIAL_PROXY_TOKEN;
  if (_pt && req.headers["x-proxy-token"] !== _pt) return res.status(401).json({ error: "unauthorized" });
  try {
    if (req.method === "GET") {
      const posts = (await readJson(KEY)) || [];
      return res.status(200).json({ ok: true, posts });
    }
    if (req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
      let posts = (await readJson(KEY)) || [];
      const rec = {
        id: `${Date.now()}-${Math.round(Math.random() * 1e5)}`,
        code: body.code || null,
        networks: body.networks || [],
        caption: body.caption || "",
        image_url: body.image_url || null,
        results: body.results || null,
        published_at: new Date().toISOString(),
      };
      posts = [rec, ...posts].slice(0, MAX);
      await writeJson(KEY, posts);
      return res.status(200).json({ ok: true, post: rec });
    }
    return res.status(405).json({ ok: false, error: "GET or POST" });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
}
