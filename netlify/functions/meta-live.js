// Returns REAL live Facebook + Instagram stats for the 7 TRG restaurants.
// Runs server-side on Netlify: the page tokens live here as an env var and
// never reach the browser. The frontend only receives follower counts, etc.
//
// Setup to go live:
//   In Netlify > Site settings > Environment variables, add ONE variable:
//     META_CREDENTIALS_JSON = {"restaurants":[{"code":"TB","page_id":"...","page_token":"...","ig_id":"..."}, ...]}
//   (generate the value locally with:  node make-netlify-env.mjs)

const GRAPH = 'https://graph.facebook.com/v25.0'

// Small in-memory cache so we don't hit the Graph API on every page load
// (persists for as long as the warm function instance lives).
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
  if (!r.page_token) return { code: r.code, error: 'no token' }
  const [fb, ig, media] = await Promise.all([
    r.page_id ? api(r.page_id, { fields: 'fan_count,followers_count', access_token: r.page_token }) : Promise.resolve({}),
    r.ig_id ? api(r.ig_id, { fields: 'username,followers_count,media_count', access_token: r.page_token }) : Promise.resolve({}),
    r.ig_id ? api(`${r.ig_id}/media`, { fields: 'timestamp,like_count,comments_count,permalink', limit: '1', access_token: r.page_token }) : Promise.resolve({}),
  ])
  const last = media?.data?.[0] || null
  return {
    code: r.code,
    fb_followers: fb.followers_count ?? fb.fan_count ?? null,
    ig_handle: ig.username ?? null,
    ig_followers: ig.followers_count ?? null,
    ig_posts: ig.media_count ?? null,
    last_post: last
      ? { date: last.timestamp || null, likes: last.like_count ?? null, comments: last.comments_count ?? null, url: last.permalink || null }
      : null,
  }
}

function json(statusCode, body) {
  return {
    statusCode,
    headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=300' },
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
