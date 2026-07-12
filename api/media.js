// Back-compat: serve an uploaded image by id. With Vercel Blob, media-upload
// already returns a direct public CDN URL, so this just redirects id -> blob.
import { list } from "@vercel/blob";

export const config = { runtime: "edge" };

export default async function handler(req) {
  const _pt = process.env.SOCIAL_PROXY_TOKEN;
  if (_pt && req.headers.get("x-proxy-token") !== _pt) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { "content-type": "application/json" } });
  }
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return new Response("missing id", { status: 400 });
  try {
    const { blobs } = await list({ prefix: id });
    const b = blobs.find((x) => x.pathname === id) || blobs[0];
    if (!b) return new Response("not found", { status: 404 });
    return Response.redirect(b.url, 302);
  } catch (e) {
    return new Response("error: " + String(e?.message || e), { status: 500 });
  }
}
