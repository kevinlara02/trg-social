// Publishes a post to a restaurant's Facebook page and/or Instagram account
// using its permanent page token (reads META_CREDENTIALS_JSON from the Netlify
// env, same as the other meta-* functions).
// POST body: { code, networks:['facebook','instagram'], caption, image_url, test }
// - Facebook: posts a photo (if image_url) or a text/link post. test:true creates
//   it UNPUBLISHED (a safe draft that doesn't appear on the page).
// - Instagram: requires image_url (IG can't post text-only); 2-step create+publish.
const GRAPH = 'https://graph.facebook.com/v25.0' // token now includes pages_manage_posts

function restaurants() {
  try { return JSON.parse(process.env.META_CREDENTIALS_JSON).restaurants || [] } catch { return [] }
}

function json(statusCode, body) {
  return { statusCode, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }
}

async function post(url, params) {
  const res = await fetch(url, { method: 'POST', body: new URLSearchParams(params) })
  return res.json()
}

async function publishFacebook(r, caption, imageUrl, test) {
  const base = { access_token: r.page_token }
  if (test) base.published = 'false'
  let d
  if (imageUrl) d = await post(`${GRAPH}/${r.page_id}/photos`, { ...base, url: imageUrl, caption: caption || '' })
  else d = await post(`${GRAPH}/${r.page_id}/feed`, { ...base, message: caption || '' })
  if (d.error) return { ok: false, error: d.error.message || 'Facebook error' }
  return { ok: true, id: d.post_id || d.id }
}

async function publishInstagram(r, caption, imageUrl) {
  if (!imageUrl) return { ok: false, error: 'Instagram requires a photo (image URL).' }
  const container = await post(`${GRAPH}/${r.ig_id}/media`, { access_token: r.page_token, image_url: imageUrl, caption: caption || '' })
  if (container.error || !container.id) return { ok: false, error: container.error?.message || 'IG container failed' }
  const pub = await post(`${GRAPH}/${r.ig_id}/media_publish`, { access_token: r.page_token, creation_id: container.id })
  if (pub.error) return { ok: false, error: pub.error.message || 'IG publish failed' }
  return { ok: true, id: pub.id }
}

export const handler = async (event) => {
  const _pt = process.env.SOCIAL_PROXY_TOKEN;
  if (_pt && (!event || !event.headers || event.headers["x-proxy-token"] !== _pt)) {
    return { statusCode: 401, headers: { "content-type": "application/json" }, body: JSON.stringify({ error: "unauthorized" }) };
  }
  if (event.httpMethod !== 'POST') return json(405, { ok: false, error: 'POST only' })
  if (!process.env.META_CREDENTIALS_JSON) return json(503, { ok: false, error: 'META_CREDENTIALS_JSON not configured' })
  let body
  try { body = JSON.parse(event.body || '{}') } catch { return json(400, { ok: false, error: 'bad JSON' }) }
  const { code, networks = ['facebook'], caption = '', image_url = '', test = false } = body

  const r = restaurants().find((x) => x.code === code)
  if (!r) return json(404, { ok: false, error: `restaurant ${code} not found` })

  const results = {}
  if (networks.includes('facebook')) results.facebook = await publishFacebook(r, caption, image_url, test)
  if (networks.includes('instagram')) results.instagram = await publishInstagram(r, caption, image_url)

  return json(200, { ok: Object.values(results).some((x) => x.ok), results })
}
