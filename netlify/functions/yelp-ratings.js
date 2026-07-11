// Returns each TRG restaurant's Yelp rating + review count + link.
// Yelp's API doesn't expose review TEXT on the standard plan (the /reviews
// endpoint returns NOT_FOUND), but business details (rating, count, price,
// url) work fine. Reads YELP_API_KEY from the Netlify env (stays server-side).

const YELP = 'https://api.yelp.com/v3'

let CACHE = { at: 0, data: null }
const TTL_MS = 30 * 60 * 1000 // 30 minutes (ratings change slowly)

// Confirmed Yelp business IDs for the 7 restaurants (stable).
const BIZ = [
  { code: 'TB', id: '9PuUxaDOIoU6jefU36GJtQ' }, // The Benediction by Toast
  { code: 'TW', id: 'bzLfR98CLaQmXozHihMeUw' }, // Toast on First (Toast Whittier)
  { code: 'SW', id: 'M98NIJAN2G0a9Fzg0QW4qA' }, // Story (Whittier)
  { code: 'SA', id: 'h9cHPvG-SUvfWIU4BmmKLQ' }, // Story (Anaheim)
  { code: 'SB', id: '17Jqi0azp05pI2fVfsPbAg' }, // Toast Kitchen & Bar (Story Brea)
  { code: 'BM', id: 'ty0Co6l06CtKx2qEFoUGcg' }, // Benny and Mary's
  { code: 'TD', id: 'VUhI0E-EpKQe7MNgsWeqnA' }, // Toast Downey
]

async function fetchBiz(b, key) {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(`${YELP}/businesses/${b.id}`, { headers: { Authorization: `Bearer ${key}` } })
      const d = await res.json()
      if (d.error) { if (attempt === 0) continue; return { code: b.code, error: d.error.code } }
      return {
        code: b.code,
        yelp_name: d.name || null,
        rating: d.rating ?? null,
        review_count: d.review_count ?? null,
        price: d.price || null,
        categories: (d.categories || []).map((c) => c.title).slice(0, 3),
        photos: (d.photos || []).slice(0, 3),
        image_url: d.image_url || null,
        is_open_now: d.hours?.[0]?.is_open_now ?? null,
        hours: d.hours?.[0]?.open || null,
        is_claimed: d.is_claimed ?? null,
        coordinates: d.coordinates || null,
        messaging_url: d.messaging?.url || null,
        online_reservation: d.online_reservation ?? null,
        phone: d.display_phone || null,
        address: (d.location?.display_address || []).join(', '),
        transactions: d.transactions || [],
        url: d.url ? d.url.split('?')[0] : null,
      }
    } catch (err) {
      if (attempt === 0) continue
      return { code: b.code, error: String(err?.message || err) }
    }
  }
}

function json(statusCode, body) {
  return {
    statusCode,
    headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=900' },
    body: JSON.stringify(body),
  }
}

export const handler = async (event) => {
  const _pt = process.env.SOCIAL_PROXY_TOKEN;
  if (_pt && (!event || !event.headers || event.headers["x-proxy-token"] !== _pt)) {
    return { statusCode: 401, headers: { "content-type": "application/json" }, body: JSON.stringify({ error: "unauthorized" }) };
  }
  const key = process.env.YELP_API_KEY
  if (!key) return json(503, { ok: false, error: 'YELP_API_KEY not configured' })

  if (CACHE.data && Date.now() - CACHE.at < (CACHE.complete ? TTL_MS : 60 * 1000)) {
    return json(200, { ok: true, cached: true, ...CACHE.data })
  }

  const restaurants = await Promise.all(BIZ.map((b) => fetchBiz(b, key)))
  const data = { generated_at: new Date().toISOString(), restaurants }
  // Cache complete results for the full TTL; cache partial results only briefly
  // so a transient miss self-heals fast without re-hitting Yelp on every call.
  const complete = restaurants.every((r) => r.rating != null)
  CACHE = { at: Date.now(), data, complete }
  return json(200, { ok: true, cached: false, ...data })
}
