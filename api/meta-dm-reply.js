// Sends a reply to a Facebook Messenger OR Instagram DM conversation.
// POST { code, customerId, text, network } -> posts to /{page_id}/messages as
// the Page. For Instagram the same endpoint routes by the IG-scoped user id
// (needs instagram_manage_messages on the page token); Meta only allows
// replies within its messaging window, and returns an error we surface if the
// window has closed.
const GRAPH = 'https://graph.facebook.com/v25.0'

function restaurants() {
  try { return JSON.parse(process.env.META_CREDENTIALS_JSON).restaurants || [] } catch { return [] }
}

export default async function handler(req, res) {
  const _pt = process.env.SOCIAL_PROXY_TOKEN;
  if (_pt && req.headers["x-proxy-token"] !== _pt) return res.status(401).json({ error: "unauthorized" });
  const json = (statusCode, body) => res.status(statusCode).json(body)
  if (req.method !== 'POST') return json(405, { ok: false, error: 'POST only' })
  if (!process.env.META_CREDENTIALS_JSON) return json(503, { ok: false, error: 'META_CREDENTIALS_JSON not configured' })

  let body
  try { body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {}) } catch { return json(400, { ok: false, error: 'invalid JSON' }) }
  const { code, customerId, text, network } = body
  if (!code || !customerId || !text) return json(400, { ok: false, error: 'code, customerId and text are required' })

  const r = restaurants().find((x) => x.code === code)
  if (!r) return json(404, { ok: false, error: `unknown restaurant ${code}` })

  const url = `${GRAPH}/${r.page_id}/messages`
  const payload = {
    recipient: { id: customerId },
    message: { text },
    access_token: r.page_token,
  }
  // messaging_type applies to Messenger; the IG messaging API doesn't use it.
  if (network !== 'instagram') payload.messaging_type = 'RESPONSE'
  try {
    const res2 = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res2.json()
    if (data.error) return json(400, { ok: false, error: data.error.message })
    return json(200, { ok: true, message_id: data.message_id || null, recipient_id: data.recipient_id || null })
  } catch (e) {
    return json(500, { ok: false, error: String(e?.message || e) })
  }
}
