// Reads recent direct-message conversations for each restaurant's Facebook Page
// (and Instagram, best-effort) using the page token (needs pages_messaging).
// Reads META_CREDENTIALS_JSON from the Netlify env, like the other meta-* funcs.
const GRAPH = 'https://graph.facebook.com/v25.0'
let CACHE = { at: 0, data: null }
const TTL_MS = 3 * 60 * 1000

function restaurants() {
  try { return JSON.parse(process.env.META_CREDENTIALS_JSON).restaurants || [] } catch { return [] }
}

function shapeConvo(c, r, network) {
  const parts = c.participants?.data || []
  const cust = parts.find((p) => String(p.id) !== String(r.page_id) && String(p.id) !== String(r.ig_id)) || parts[0] || {}
  const msgs = (c.messages?.data || []).map((m) => {
    const fromUs = String(m.from?.id) === String(r.page_id) || String(m.from?.id) === String(r.ig_id)
    return { fromUs, author: fromUs ? 'You' : (m.from?.username || m.from?.name || cust.name || cust.username || 'Customer'), text: m.message || '', time: m.created_time }
  }).reverse()
  const last = msgs[msgs.length - 1]
  return {
    id: c.id, network,
    customer: cust.name || cust.username || (network === 'instagram' ? 'Instagram user' : 'Facebook user'),
    customerId: cust.id || null,
    updated: c.updated_time,
    messages: msgs,
    lastText: last?.text || '',
    lastFromUs: last?.fromUs || false,
  }
}

async function conversations(r, network) {
  const platform = network === 'instagram' ? '&platform=instagram' : ''
  const url = `${GRAPH}/${r.page_id}/conversations?fields=participants,updated_time,messages.limit(8){message,from,created_time}&limit=10${platform}&access_token=${r.page_token}`
  try {
    const d = await (await fetch(url)).json()
    if (d.error) return { list: [], error: d.error.message }
    return { list: (d.data || []).map((c) => shapeConvo(c, r, network)), error: null }
  } catch (e) {
    return { list: [], error: String(e?.message || e) }
  }
}

// Fetch with a hard timeout so one slow Graph call can't stall the function.
async function fetchJson(url, ms = 6000) {
  const ctl = new AbortController()
  const t = setTimeout(() => ctl.abort(), ms)
  try { return await (await fetch(url, { signal: ctl.signal })).json() }
  finally { clearTimeout(t) }
}

// Instagram rejects the one-shot query above ("Please reduce the amount of
// data you're asking for"), even for light queries addressed to the PAGE id.
// The variant Meta accepts is asking the IG user id for its conversations,
// then fetching each conversation's participants + messages individually.
async function igConversations(r) {
  const owner = r.ig_id || r.page_id
  const listUrl = `${GRAPH}/${owner}/conversations?platform=instagram&fields=id,updated_time&limit=5&access_token=${r.page_token}`
  try {
    const list = await fetchJson(listUrl)
    if (list.error) return { list: [], error: list.error.message }
    const convs = await Promise.all((list.data || []).map(async (c) => {
      try {
        const d = await fetchJson(`${GRAPH}/${c.id}?fields=participants,updated_time,messages.limit(6){message,from,created_time}&access_token=${r.page_token}`)
        return d.error ? null : shapeConvo(d, r, 'instagram')
      } catch { return null }
    }))
    return { list: convs.filter(Boolean), error: null }
  } catch (e) {
    return { list: [], error: String(e?.message || e) }
  }
}

export default async function handler(req, res) {
  const _pt = process.env.SOCIAL_PROXY_TOKEN;
  if (_pt && req.headers["x-proxy-token"] !== _pt) return res.status(401).json({ error: "unauthorized" });
  const json = (statusCode, body) => res.status(statusCode).json(body)
  if (!process.env.META_CREDENTIALS_JSON) return json(503, { ok: false, error: 'META_CREDENTIALS_JSON not configured', restaurants: [] })
  if (CACHE.data && Date.now() - CACHE.at < TTL_MS) return json(200, { ok: true, cached: true, ...CACHE.data })

  const rs = restaurants()
  const results = await Promise.all(rs.map(async (r) => {
    const [fb, ig] = await Promise.all([conversations(r, 'facebook'), igConversations(r)])
    const list = [...fb.list, ...ig.list].sort((a, b) => (b.updated || '').localeCompare(a.updated || ''))
    return { code: r.code, v: 3, conversations: list, fbError: fb.error, igError: ig.error }
  }))

  const data = { generated_at: new Date().toISOString(), version: 3, restaurants: results }
  CACHE = { at: Date.now(), data }
  return json(200, { ok: true, ...data })
}
