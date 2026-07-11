// Returns recent comments on Instagram + Facebook posts for the 7 TRG
// restaurants, so they can be read (and replied to) from the Inbox.
// Needs the token to have: instagram_manage_comments (IG) and
// pages_read_user_content (FB). Reads creds from META_CREDENTIALS_JSON.

const GRAPH = 'https://graph.facebook.com/v25.0'

let CACHE = { at: 0, data: null }
const TTL_MS = 5 * 60 * 1000 // 5 minutes (comments change often)

async function api(path, params) {
  const url = new URL(`${GRAPH}/${path}`)
  for (const [key, val] of Object.entries(params)) url.searchParams.set(key, val)
  try {
    const res = await fetch(url)
    const data = await res.json()
    if (data.error) return { _error: data.error.message }
    return data
  } catch (err) {
    return { _error: String(err?.message || err) }
  }
}

async function fetchRestaurant(r) {
  if (!r.page_token) return { code: r.code, comments: [] }
  const [igMedia, fbPosts] = await Promise.all([
    r.ig_id ? api(`${r.ig_id}/media`, { fields: 'id,caption,permalink,comments.limit(15){id,text,username,timestamp}', limit: '6', access_token: r.page_token }) : Promise.resolve({}),
    r.page_id ? api(`${r.page_id}/posts`, { fields: 'id,message,permalink_url,comments.limit(15){id,message,from{name},created_time}', limit: '6', access_token: r.page_token }) : Promise.resolve({}),
  ])

  const comments = []
  for (const m of (igMedia.data || [])) {
    for (const c of (m.comments?.data || [])) {
      comments.push({
        id: c.id, network: 'instagram',
        author: c.username || 'Instagram user',
        text: c.text || '', date: c.timestamp || null,
        post_caption: m.caption || '', post_permalink: m.permalink || null,
      })
    }
  }
  for (const p of (fbPosts.data || [])) {
    for (const c of (p.comments?.data || [])) {
      comments.push({
        id: c.id, network: 'facebook',
        author: c.from?.name || 'Facebook user',
        text: c.message || '', date: c.created_time || null,
        post_caption: p.message || '', post_permalink: p.permalink_url || null,
      })
    }
  }
  return { code: r.code, comments }
}

function json(statusCode, body) {
  return {
    statusCode,
    headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=120' },
    body: JSON.stringify(body),
  }
}

export const handler = async (event) => {
  const _pt = process.env.SOCIAL_PROXY_TOKEN;
  if (_pt && (!event || !event.headers || event.headers["x-proxy-token"] !== _pt)) {
    return { statusCode: 401, headers: { "content-type": "application/json" }, body: JSON.stringify({ error: "unauthorized" }) };
  }
  const raw = process.env.META_CREDENTIALS_JSON
  if (!raw) return json(503, { ok: false, error: 'META_CREDENTIALS_JSON not configured' })
  let creds
  try {
    creds = JSON.parse(raw)
  } catch {
    return json(500, { ok: false, error: 'META_CREDENTIALS_JSON is not valid JSON' })
  }
  const list = Array.isArray(creds) ? creds : creds.restaurants
  if (!Array.isArray(list)) return json(500, { ok: false, error: 'no restaurants in META_CREDENTIALS_JSON' })

  if (CACHE.data && Date.now() - CACHE.at < TTL_MS) {
    return json(200, { ok: true, cached: true, ...CACHE.data })
  }

  const restaurants = await Promise.all(list.map(fetchRestaurant))
  const data = { generated_at: new Date().toISOString(), restaurants }
  CACHE = { at: Date.now(), data }
  return json(200, { ok: true, cached: false, ...data })
}
