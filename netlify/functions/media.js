// Serves an uploaded image from the Netlify Blob store by id, publicly (so
// Instagram/Facebook can fetch it when publishing). v2 function.
import { getStore } from '@netlify/blobs'

// PUBLIC ON PURPOSE: this endpoint serves an opaque random-id image that the app
// is about to post publicly. It must stay open because the consumers cannot send
// an Authorization header: Instagram/Facebook fetch this image_url server-side
// and anonymously when publishing, and a plain <img> tag has no way to attach a
// bearer token. Gating it would break image publishing and history thumbnails.
export default async (req) => {
  const id = new URL(req.url).searchParams.get('id')
  if (!id) return new Response('missing id', { status: 400 })
  try {
    const store = getStore('media')
    const blob = await store.getWithMetadata(id, { type: 'arrayBuffer' })
    if (!blob || !blob.data) return new Response('not found', { status: 404 })
    return new Response(Buffer.from(blob.data), {
      status: 200,
      headers: {
        'content-type': blob.metadata?.contentType || 'image/jpeg',
        'cache-control': 'public, max-age=86400',
      },
    })
  } catch (e) {
    return new Response('error: ' + String(e?.message || e), { status: 500 })
  }
}
