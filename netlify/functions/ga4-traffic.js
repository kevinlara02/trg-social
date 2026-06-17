// Reads website traffic from Google Analytics 4 (GA4 Data API) for each
// restaurant's Squarespace site. v2 function (export default) so Netlify Blobs
// auto-configures: ../google-auth.js reads the service-account JSON from a Blob
// (the key is too big to keep as a per-function env var under Netlify's 4 KB cap).
// GA4 uses the numeric PROPERTY ID, not the "G-XXXX" measurement ID.
import { getAccessToken } from '../google-auth.js'

const SCOPE = 'https://www.googleapis.com/auth/analytics.readonly'
let CACHE = { at: 0, data: null }
const TTL_MS = 30 * 60 * 1000

// Restaurant code -> GA4 numeric property ID (not secret). Add TW + SB later.
const PROPERTIES = {
  SA: '541892780', // Story Anaheim
  SW: '541942787', // Story Whittier
  TB: '541915209', // The Benediction
  TD: '541931350', // Toast Downey
  BM: '541910993', // Benny and Mary's
}

async function reportFor(code, propertyId, token) {
  const res = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      dateRanges: [{ startDate: '28daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'sessionDefaultChannelGroup' }],
      metrics: [{ name: 'sessions' }, { name: 'totalUsers' }, { name: 'screenPageViews' }],
      limit: 25,
    }),
  })
  const d = await res.json()
  if (d.error) return { code, error: d.error.message || 'GA4 error' }
  let users = 0, sessions = 0, pageviews = 0
  const sources = []
  for (const row of d.rows || []) {
    const channel = row.dimensionValues?.[0]?.value || 'Other'
    const s = Number(row.metricValues?.[0]?.value || 0)
    const u = Number(row.metricValues?.[1]?.value || 0)
    const pv = Number(row.metricValues?.[2]?.value || 0)
    sessions += s; users += u; pageviews += pv
    sources.push({ channel, sessions: s })
  }
  sources.sort((a, b) => b.sessions - a.sessions)
  return { code, users, sessions, pageviews, sources }
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
}

export default async () => {
  const codes = Object.keys(PROPERTIES)
  if (CACHE.data && Date.now() - CACHE.at < TTL_MS) return json({ ok: true, cached: true, ...CACHE.data })
  try {
    const token = await getAccessToken(SCOPE)
    const restaurants = await Promise.all(codes.map((c) => reportFor(c, PROPERTIES[c], token)))
    const data = { generated_at: new Date().toISOString(), restaurants }
    CACHE = { at: Date.now(), data }
    return json({ ok: true, cached: false, ...data })
  } catch (err) {
    return json({ ok: false, error: String(err?.message || err), restaurants: [] })
  }
}
