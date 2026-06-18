// Receives an uploaded image (multipart form-data, field "file"), stores it in a
// Netlify Blob, and returns a public URL that Instagram/Facebook can fetch.
// v2 function so Netlify Blobs auto-configures.
import { getStore } from '@netlify/blobs'

export default async (req) => {
  if (req.method !== 'POST') return json({ ok: false, error: 'POST only' }, 405)
  try {
    const form = await req.formData()
    const file = form.get('file')
    if (!file || typeof file === 'string') return json({ ok: false, error: 'no file' }, 400)
    const type = file.type || 'image/jpeg'
    const ext = (type.split('/')[1] || 'jpg').replace('jpeg', 'jpg')
    const id = `${Date.now()}-${Math.round(Math.random() * 1e6)}.${ext}`
    const data = await file.arrayBuffer()
    const store = getStore('media')
    await store.set(id, data, { metadata: { contentType: type } })
    const base = (process.env.URL || 'https://trg-socialmedia.netlify.app').replace(/\/$/, '')
    return json({ ok: true, url: `${base}/.netlify/functions/media?id=${encodeURIComponent(id)}`, id })
  } catch (e) {
    return json({ ok: false, error: String(e?.message || e) }, 500)
  }
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
}
