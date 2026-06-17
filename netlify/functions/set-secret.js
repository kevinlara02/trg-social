// ONE-TIME bootstrap: stores a large secret in a Netlify Blob (store "config")
// so it doesn't count toward the 4 KB per-function env-var limit. Protected by a
// single-use token in the query string. This function is removed right after the
// secret is loaded. v2 function so Netlify Blobs auto-configures.
import { getStore } from '@netlify/blobs'

const SETUP_TOKEN = 'trg-setup-9f3a2c7e1b8d4056-2026xz'

export default async (req) => {
  const url = new URL(req.url)
  if (url.searchParams.get('token') !== SETUP_TOKEN) return new Response('forbidden', { status: 403 })
  if (req.method !== 'POST') return new Response('use POST', { status: 405 })
  const key = url.searchParams.get('key') || 'google_sa'
  const body = await req.text()
  if (!body || body.length < 10) return new Response('empty body', { status: 400 })
  try {
    const store = getStore('config')
    await store.set(key, body)
    const check = await store.get(key)
    return new Response(JSON.stringify({ ok: true, key, bytes: body.length, stored: (check || '').length }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e?.message || e) }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    })
  }
}
