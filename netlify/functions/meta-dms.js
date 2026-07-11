// Reads recent direct-message conversations for each restaurant's Facebook Page
// (and Instagram, best-effort) using the page token (needs pages_messaging).
// Reads META_CREDENTIALS_JSON from the Netlify env, like the other meta-* funcs.
const GRAPH = 'https://graph.facebook.com/v25.0'
let CACHE = { at: 0, data: null }
const TTL_MS = 3 * 60 * 1000

function restaurants() {
  try { return JSON.parse(process.env.META_CREDENTIALS_JSON).restaurants || [] } catch { return [] }
}

function json(statusCode, body) {
  return { statusCode, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }
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

export const handler = async (event) => {
  const _pt = process.env.SOCIAL_PROXY_TOKEN;
  if (_pt && (!event || !event.headers || event.headers["x-proxy-token"] !== _pt)) {
    return { statusCode: 401, headers: { "content-type": "application/json" }, body: JSON.stringify({ error: "unauthorized" }) };
  }
  if (!process.env.META_CREDENTIALS_JSON) return json(503, { ok: false, error: 'META_CREDENTIALS_JSON not configured', restaurants: [] })
  if (CACHE.data && Date.now() - CACHE.at < TTL_MS) return json(200, { ok: true, cached: true, ...CACHE.data })

  const rs = restaurants()
  const results = await Promise.all(rs.map(async (r) => {
    const [fb, ig] = await Promise.all([conversations(r, 'facebook'), conversations(r, 'instagram')])
    const list = [...fb.list, ...ig.list].sort((a, b) => (b.updated || '').localeCompare(a.updated || ''))
    return { code: r.code, conversations: list, fbError: fb.error, igError: ig.error }
  }))

  const data = { generated_at: new Date().toISOString(), restaurants: results }
  CACHE = { at: Date.now(), data }
  return json(200, { ok: true, ...data })
}
