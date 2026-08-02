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
    r.ig_id ? api(r.ig_id, { fields: 'username,followers_count,media_count,profile_picture_url', access_token: r.page_token }) : Promise.resolve({}),
    r.ig_id ? api(`${r.ig_id}/media`, { fields: 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count', limit: '12', access_token: r.page_token }) : Promise.resolve({}),
    r.page_id ? api(`${r.page_id}/posts`, { fields: 'id,message,full_picture,permalink_url,created_time', limit: '6', access_token: r.page_token }) : Promise.resolve({}),
    r.page_id ? api(r.page_id, { fields: 'followers_count,fan_count', access_token: r.page_token }) : Promise.resolve({}),
  ])

  const igPosts = (igMedia.data || []).map((m) => ({
    id: m.id,
    network: 'instagram',
    image: m.media_type === 'VIDEO' ? (m.thumbnail_url || null) : (m.media_url || null),
    // Passed through so a consumer can mark a video without guessing. The
    // restaurant websites draw a play triangle on video tiles, and inferring it
    // from a /reel/ permalink misses a plain VIDEO post that is not a reel.
    media_type: m.media_type || null,
    // THE MP4 ITSELF, for a video. Graph returns the playable file in media_url
    // for VIDEO media, which is exactly why `image` above reaches for
    // thumbnail_url instead. It was then thrown away, so the only way a consumer
    // could show a reel was Instagram's embed, and that embed never plays the
    // video: it shows a poster and sends the visitor to instagram.com. With the
    // file here, a site can play it in place.
    video_url: m.media_type === 'VIDEO' ? (m.media_url || null) : null,
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
    // The real avatar, so a consumer does not have to draw a letter in a
    // circle and pretend it is the profile picture.
    ig_avatar: acct.profile_picture_url || null,
    ig_followers: acct.followers_count ?? null,
    ig_posts_count: acct.media_count ?? null,
    fb_followers: fbInfo.followers_count ?? fbInfo.fan_count ?? null,
    posts: [...igPosts, ...fbP],
  }
}

export default async function handler(req, res) {
  const _pt = process.env.SOCIAL_PROXY_TOKEN;
  if (_pt && req.headers["x-proxy-token"] !== _pt) return res.status(401).json({ error: "unauthorized" });
  const json = (statusCode, body) => {
    res.setHeader('cache-control', 'public, max-age=300')
    return res.status(statusCode).json(body)
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
