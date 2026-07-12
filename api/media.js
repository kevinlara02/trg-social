// Back-compat: serve an uploaded image by id. With Vercel Blob, media-upload
// already returns a direct public CDN URL, so this just redirects id -> blob.
// Node runtime (edge can't use @vercel/blob).
import { list } from "@vercel/blob";

export default async function handler(req, res) {
  const _pt = process.env.SOCIAL_PROXY_TOKEN;
  if (_pt && req.headers["x-proxy-token"] !== _pt) return res.status(401).json({ error: "unauthorized" });
  const id = req.query.id;
  if (!id) return res.status(400).send("missing id");
  try {
    const { blobs } = await list({ prefix: id });
    const b = blobs.find((x) => x.pathname === id) || blobs[0];
    if (!b) return res.status(404).send("not found");
    return res.redirect(302, b.url);
  } catch (e) {
    return res.status(500).send("error: " + String(e?.message || e));
  }
}
