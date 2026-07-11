// Posts a reply to an Instagram or Facebook comment, on behalf of the page.
// Needs the token to have: instagram_manage_comments (IG) and
// pages_manage_engagement (FB). Reads creds from META_CREDENTIALS_JSON.
//
// POST body: { code, network, comment_id, message }

const GRAPH = 'https://graph.facebook.com/v25.0'

function json(statusCode, body) {
  return {
    statusCode,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }
}

export const handler = async (event) => {
  const _pt = process.env.SOCIAL_PROXY_TOKEN;
  if (_pt && (!event || !event.headers || event.headers["x-proxy-token"] !== _pt)) {
    return { statusCode: 401, headers: { "content-type": "application/json" }, body: JSON.stringify({ error: "unauthorized" }) };
  }
  if (event.httpMethod !== 'POST') return json(405, { ok: false, error: 'Method not allowed' })

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
    body = JSON.parse(event.body || '{}')
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
    const res = await fetch(`${GRAPH}/${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ message: message.trim(), access_token: r.page_token }),
    })
    const data = await res.json()
    if (data.error) return json(200, { ok: false, error: data.error.message })
    return json(200, { ok: true, id: data.id || null })
  } catch (err) {
    return json(500, { ok: false, error: String(err?.message || err) })
  }
}
