// Serves an uploaded image from the Netlify Blob store by id, publicly (so
// Instagram/Facebook can fetch it when publishing). v2 function.
import { getStore } from '@netlify/blobs'

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
