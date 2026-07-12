// Receives an uploaded image (multipart form-data, field "file"), stores it in
// Vercel Blob, and returns its public URL (Instagram/Facebook fetch it when
// publishing). Node runtime (edge can't use @vercel/blob); multipart parsed
// with busboy.
import { put } from "@vercel/blob";
import Busboy from "busboy";
import { Readable } from "node:stream";

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  const _pt = process.env.SOCIAL_PROXY_TOKEN;
  if (_pt && req.headers["x-proxy-token"] !== _pt) return res.status(401).json({ error: "unauthorized" });
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "POST only" });
  try {
    const { buffer, mimeType } = await new Promise((resolve, reject) => {
      const bb = Busboy({ headers: req.headers });
      const parts = [];
      let mt = "image/jpeg";
      bb.on("file", (_name, stream, info) => {
        if (info?.mimeType) mt = info.mimeType;
        stream.on("data", (d) => parts.push(d));
      });
      bb.on("error", reject);
      bb.on("close", () => resolve({ buffer: Buffer.concat(parts), mimeType: mt }));
      const src = req.body && Buffer.isBuffer(req.body) ? Readable.from(req.body) : req;
      src.pipe(bb);
    });
    if (!buffer || !buffer.length) return res.status(400).json({ ok: false, error: "no file" });
    const ext = (mimeType.split("/")[1] || "jpg").replace("jpeg", "jpg");
    const id = `media/${Date.now()}-${Math.round(Math.random() * 1e6)}.${ext}`;
    const blob = await put(id, buffer, { access: "public", contentType: mimeType, addRandomSuffix: false });
    return res.status(200).json({ ok: true, url: blob.url, id });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
}
