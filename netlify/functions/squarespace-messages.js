// Reads Squarespace contact-form submissions that are stored in Google Sheets
// (Squarespace: form block -> Storage -> Google Drive). Uses the same service
// account as GA4 (GOOGLE_SA_JSON), so it only needs Viewer access on each sheet.
// Add each restaurant's sheet to SHEETS once the user connects the forms and
// shares the sheet with the service-account email. spreadsheetId = the long id
// in the sheet URL (.../spreadsheets/d/<THIS>/edit).
import { getAccessToken } from '../google-auth.js'

const SCOPE = 'https://www.googleapis.com/auth/spreadsheets.readonly'
let CACHE = { at: 0, data: null }
const TTL_MS = 5 * 60 * 1000

// code -> { spreadsheetId, range }. Empty until the user creates the sheets.
const SHEETS = {
  // SA: { spreadsheetId: '1AbC...', range: 'Form Responses 1!A1:Z1000' },
}

function pick(headers, row, patterns) {
  for (let i = 0; i < headers.length; i++) {
    const h = (headers[i] || '').toLowerCase()
    if (patterns.some((p) => p.test(h)) && (row[i] || '').trim()) return row[i]
  }
  return null
}

// Squarespace sheets put the form fields as columns (Name, Email, Message, plus
// a submitted-on timestamp). Map them flexibly and fall back to joining the rest.
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
  return out.reverse() // newest first (Squarespace appends new rows at the bottom)
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

function json(statusCode, body) {
  return { statusCode, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }
}

export const handler = async () => {
  if (!process.env.GOOGLE_SA_JSON) return json(503, { ok: false, error: 'GOOGLE_SA_JSON not configured', restaurants: [] })
  const codes = Object.keys(SHEETS)
  if (!codes.length) return json(200, { ok: true, restaurants: [] })

  if (CACHE.data && Date.now() - CACHE.at < TTL_MS) return json(200, { ok: true, cached: true, ...CACHE.data })

  try {
    const token = await getAccessToken(SCOPE)
    const restaurants = await Promise.all(codes.map((c) => fetchSheet(c, SHEETS[c], token)))
    const data = { generated_at: new Date().toISOString(), restaurants }
    CACHE = { at: Date.now(), data }
    return json(200, { ok: true, cached: false, ...data })
  } catch (err) {
    return json(200, { ok: false, error: String(err?.message || err), restaurants: [] })
  }
}
