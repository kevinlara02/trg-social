// Mints a Google OAuth access token from a service-account key, used by the GA4
// traffic + Sheets messages functions. Pure Node crypto (no extra deps).
//
// The service-account JSON is too big to keep as a per-function env var (Netlify
// caps the combined env size at 4 KB per function). So we store it once in a
// Netlify Blob (store "config", key "google_sa") and read it at runtime. An env
// var GOOGLE_SA_JSON still works as a fallback if it ever fits.
// NOTE: callers must be v2 functions (export default) so Netlify Blobs
// auto-configures; v1 handlers can't read Blobs.
import crypto from 'crypto'
import { getStore } from '@netlify/blobs'

let TOKEN = { at: 0, value: null, scope: null }
let SA_RAW = null

function b64url(input) {
  return Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function serviceAccountRaw() {
  if (SA_RAW) return SA_RAW
  if (process.env.GOOGLE_SA_JSON) { SA_RAW = process.env.GOOGLE_SA_JSON; return SA_RAW }
  try {
    const store = getStore('config')
    const v = await store.get('google_sa')
    if (v) { SA_RAW = v; return SA_RAW }
  } catch { /* fall through to error */ }
  throw new Error('Google service account not configured')
}

export async function getAccessToken(scope) {
  if (TOKEN.value && TOKEN.scope === scope && Date.now() - TOKEN.at < 50 * 60 * 1000) return TOKEN.value

  const sa = JSON.parse(await serviceAccountRaw())
  const now = Math.floor(Date.now() / 1000)
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const claim = b64url(JSON.stringify({
    iss: sa.client_email,
    scope,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }))
  const signer = crypto.createSign('RSA-SHA256')
  signer.update(`${header}.${claim}`)
  const signature = b64url(signer.sign(sa.private_key))
  const jwt = `${header}.${claim}.${signature}`

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }),
  })
  const data = await res.json()
  if (!data.access_token) throw new Error('token exchange failed: ' + JSON.stringify(data).slice(0, 200))

  TOKEN = { at: Date.now(), value: data.access_token, scope }
  return data.access_token
}
