// Returns recent Instagram + Facebook posts (with engagement) for the 7 TRG
// restaurants. Powers the Social page (feed, top posts, account health,
// per-restaurant detail). Read-only. Tokens stay server-side.
//
// Reads credentials from the META_CREDENTIALS_JSON env var (same as meta-live).

const GRAPH = 'https://graph.facebook.com/v25.0'

let CACHE = { at: 0, data: null }
const TTL_MS = 10 * 60 * 1000 // 10 minutes

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
  if (!r.page_token) return { code: r.code, posts: [] }
  const [acct, igMedia, fbPosts, fbInfo] = await Promise.all([
    r.ig_id ? api(r.ig_id, { fields: 'username,followers_count,media_count', access_token: r.page_token }) : Promise.resolve({}),
    r.ig_id ? api(`${r.ig_id}/media`, { fields: 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count', limit: '8', access_token: r.page_token }) : Promise.resolve({}),
    r.page_id ? api(`${r.page_id}/posts`, { fields: 'id,message,full_picture,permalink_url,created_time,likes.summary(true),comments.summary(true)', limit: '6', access_token: r.page_token }) : Promise.resolve({}),
    r.page_id ? api(r.page_id, { fields: 'followers_count,fan_count', access_token: r.page_token }) : Promise.resolve({}),
  ])

  const igPosts = (igMedia.data || []).map((m) => ({
    id: m.id,
    network: 'instagram',
    image: m.media_type === 'VIDEO' ? (m.thumbnail_url || null) : (m.media_url || null),
    caption: m.caption || '',
    permalink: m.permalink || null,
    date: m.timestamp || null,
    likes: m.like_count ?? null,
    comments: m.comments_count ?? null,
  }))
  const fbP = (fbPosts.data || []).map((p) => ({
    id: p.id,
    network: 'facebook',
    image: p.full_picture || null,
    caption: p.message || '',
    permalink: p.permalink_url || null,
    date: p.created_time || null,
    likes: p.likes?.summary?.total_count ?? null,
    comments: p.comments?.summary?.total_count ?? null,
  }))

  return {
    code: r.code,
    ig_handle: acct.username || null,
    ig_followers: acct.followers_count ?? null,
    ig_posts_count: acct.media_count ?? null,
    fb_followers: fbInfo.followers_count ?? fbInfo.fan_count ?? null,
    posts: [...igPosts, ...fbP],
  }
}

function json(statusCode, body) {
  return {
    statusCode,
    headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=300' },
    body: JSON.stringify(body),
  }
}

export const handler = async () => {
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
