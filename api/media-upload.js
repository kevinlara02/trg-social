// Receives an uploaded image (multipart form-data, field "file"), stores it in
// Vercel Blob, and returns its public URL (Instagram/Facebook fetch it when
// publishing). Edge runtime so Request.formData() works natively.
import { put } from "@vercel/blob";

export const config = { runtime: "edge" };

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

export default async function handler(req) {
  const _pt = process.env.SOCIAL_PROXY_TOKEN;
  if (_pt && req.headers.get("x-proxy-token") !== _pt) {
    return json({ error: "unauthorized" }, 401);
  }
  if (req.method !== "POST") return json({ ok: false, error: "POST only" }, 405);
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!file || typeof file === "string") return json({ ok: false, error: "no file" }, 400);
    const type = file.type || "image/jpeg";
    const ext = (type.split("/")[1] || "jpg").replace("jpeg", "jpg");
    const id = `media/${Date.now()}-${Math.round(Math.random() * 1e6)}.${ext}`;
    const blob = await put(id, file, { access: "public", contentType: type, addRandomSuffix: false });
    return json({ ok: true, url: blob.url, id });
  } catch (e) {
    return json({ ok: false, error: String(e?.message || e) }, 500);
  }
}
