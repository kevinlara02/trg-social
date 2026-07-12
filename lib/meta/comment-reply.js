// Posts a reply to an Instagram or Facebook comment, on behalf of the page.
// Needs the token to have: instagram_manage_comments (IG) and
// pages_manage_engagement (FB). Reads creds from META_CREDENTIALS_JSON.
//
// POST body: { code, network, comment_id, message }

const GRAPH = 'https://graph.facebook.com/v25.0'

export default async function handler(req, res) {
  const _pt = process.env.SOCIAL_PROXY_TOKEN;
  if (_pt && req.headers["x-proxy-token"] !== _pt) return res.status(401).json({ error: "unauthorized" });
  const json = (statusCode, body) => res.status(statusCode).json(body)
  if (req.method !== 'POST') return json(405, { ok: false, error: 'Method not allowed' })

  const raw = process.env.META_CREDENTIALS_JSON
  if (!raw) return json(503, { ok: false, error: 'META_CREDENTIALS_JSON not configured' })
  let creds
  try {
    creds = JSON.parse(raw)
  } catch {
    return json(500, { ok: false, error: 'META_CREDENTIALS_JSON is not valid JSON' })
  }
  const list = Array.isArray(creds) ? creds : creds.restaurants

  let body
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {})
  } catch {
    return json(400, { ok: false, error: 'bad request body' })
  }
  const { code, network, comment_id, message } = body
  if (!code || !comment_id || !message?.trim()) {
    return json(400, { ok: false, error: 'missing code, comment_id, or message' })
  }

  const r = (list || []).find((x) => x.code === code)
  if (!r?.page_token) return json(404, { ok: false, error: `no token for ${code}` })

  // Instagram: reply via /{comment-id}/replies ; Facebook: via /{comment-id}/comments
  const path = network === 'instagram' ? `${comment_id}/replies` : `${comment_id}/comments`

  try {
    const res2 = await fetch(`${GRAPH}/${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ message: message.trim(), access_token: r.page_token }),
    })
    const data = await res2.json()
    if (data.error) return json(200, { ok: false, error: data.error.message })
    return json(200, { ok: true, id: data.id || null })
  } catch (err) {
    return json(500, { ok: false, error: String(err?.message || err) })
  }
}
