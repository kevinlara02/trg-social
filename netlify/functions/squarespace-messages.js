// Reads Squarespace contact-form submissions stored in Google Sheets. v2
// function (export default) so Netlify Blobs auto-configures and ../google-auth.js
// can read the service-account JSON from a Blob. Add each restaurant's sheet to
// SHEETS once the user connects the forms and shares the sheet with the
// service-account email. spreadsheetId = the long id in the sheet URL.
import { getAccessToken } from '../google-auth.js'

const SCOPE = 'https://www.googleapis.com/auth/spreadsheets.readonly'
let CACHE = { at: 0, data: null }
const TTL_MS = 5 * 60 * 1000

// code -> { spreadsheetId, range }. Add each restaurant's form sheet here once
// it's connected in Squarespace and shared with the service-account email.
const SHEETS = {
  BM: { spreadsheetId: '1aD4qu_y1WUKfaukedixYIat94WgGwVjJv2g3bVk3yJI', range: 'Sheet1!A1:Z1000' }, // Benny and Mary's
}

function pick(headers, row, patterns) {
  for (let i = 0; i < headers.length; i++) {
    const h = (headers[i] || '').toLowerCase()
    if (patterns.some((p) => p.test(h)) && (row[i] || '').trim()) return row[i]
  }
  return null
}

function normalize(code, rows) {
  if (!rows || rows.length < 2) return []
  const headers = rows[0] || []
  const out = []
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r] || []
    if (!row.some((c) => (c || '').trim())) continue
    const author = pick(headers, row, [/name/]) || 'Website visitor'
    const email = pick(headers, row, [/e-?mail/])
    const date = pick(headers, row, [/submitted|timestamp|date|time/])
    let text = pick(headers, row, [/message|comment|inquiry|notes|detail|question|request/])
    if (!text) {
      const parts = []
      for (let i = 0; i < headers.length; i++) {
        const h = (headers[i] || '').toLowerCase()
        if (/name|e-?mail|submitted|timestamp|date|time/.test(h)) continue
        if ((row[i] || '').trim()) parts.push(`${headers[i]}: ${row[i]}`)
      }
      text = parts.join('  ·  ')
    }
    out.push({ id: `${code}-${r}`, code, author, email: email || null, text: text || '(no message)', date: date || null })
  }
  return out.reverse()
}

async function fetchSheet(code, cfg, token) {
  const range = encodeURIComponent(cfg.range || 'A1:Z1000')
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${cfg.spreadsheetId}/values/${range}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const d = await res.json()
  if (d.error) return { code, error: d.error.message || 'Sheets error', messages: [] }
  return { code, messages: normalize(code, d.values || []) }
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
}

export default async (req) => {
  const _pt = process.env.SOCIAL_PROXY_TOKEN;
  if (_pt && req.headers.get("x-proxy-token") !== _pt) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { "content-type": "application/json" } });
  }
  const codes = Object.keys(SHEETS)
  if (!codes.length) return json({ ok: true, restaurants: [] })
  if (CACHE.data && Date.now() - CACHE.at < TTL_MS) return json({ ok: true, cached: true, ...CACHE.data })
  try {
    const token = await getAccessToken(SCOPE)
    const restaurants = await Promise.all(codes.map((c) => fetchSheet(c, SHEETS[c], token)))
    const data = { generated_at: new Date().toISOString(), restaurants }
    CACHE = { at: Date.now(), data }
    return json({ ok: true, cached: false, ...data })
  } catch (err) {
    return json({ ok: false, error: String(err?.message || err), restaurants: [] })
  }
}
