// Stores a history of posts published from the app (in a Netlify Blob) so the
// Publish page calendar/list can show what's been posted. v2 function.
// GET -> { ok, posts }. POST { code, networks, caption, image_url, results } -> appends.
import { getStore } from '@netlify/blobs'

const KEY = 'history.json'
const MAX = 500

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
}

export default async (req) => {
  const _pt = process.env.SOCIAL_PROXY_TOKEN;
  if (_pt && req.headers.get("x-proxy-token") !== _pt) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { "content-type": "application/json" } });
  }
  const store = getStore('posts')
  try {
    if (req.method === 'GET') {
      const posts = (await store.get(KEY, { type: 'json' })) || []
      return json({ ok: true, posts })
    }
    if (req.method === 'POST') {
      const body = await req.json()
      let posts = (await store.get(KEY, { type: 'json' })) || []
      const rec = {
        id: `${Date.now()}-${Math.round(Math.random() * 1e5)}`,
        code: body.code || null,
        networks: body.networks || [],
        caption: body.caption || '',
        image_url: body.image_url || null,
        results: body.results || null,
        published_at: new Date().toISOString(),
      }
      posts = [rec, ...posts].slice(0, MAX)
      await store.setJSON(KEY, posts)
      return json({ ok: true, post: rec })
    }
    return json({ ok: false, error: 'GET or POST' }, 405)
  } catch (e) {
    return json({ ok: false, error: String(e?.message || e) }, 500)
  }
}
