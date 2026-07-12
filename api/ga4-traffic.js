// Rich website-traffic data from Google Analytics 4 for each restaurant's
// Squarespace site. v2 function (export default) so Netlify Blobs auto-configures
// and ../google-auth.js can read the service-account JSON from a Blob.
// Per restaurant it returns: 28-day totals + previous-28-day (for deltas),
// daily series, channel + device breakdowns, top pages + cities, new vs
// returning, engagement, and realtime active users.
import { getAccessToken } from '../lib/google-auth.js'

const SCOPE = 'https://www.googleapis.com/auth/analytics.readonly'
const DATA = 'https://analyticsdata.googleapis.com/v1beta/properties'
let CACHE = { at: 0, data: null }
const TTL_MS = 20 * 60 * 1000

const PROPERTIES = {
  SA: '541892780', // Story Anaheim
  SW: '541942787', // Story Whittier
  TB: '541915209', // The Benediction
  TD: '541931350', // Toast Downey
  BM: '541910993', // Benny and Mary's
}

const num = (v) => Number(v || 0)
const pairs = (report, m = 0) => (report?.rows || []).map((r) => ({ key: r.dimensionValues?.[0]?.value || '(other)', val: num(r.metricValues?.[m]?.value) }))

async function batchReports(propertyId, token, requests) {
  const res = await fetch(`${DATA}/${propertyId}:batchRunReports`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ requests }),
  })
  return res.json()
}

async function realtimeActive(propertyId, token) {
  try {
    const r = await fetch(`${DATA}/${propertyId}:runRealtimeReport`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ metrics: [{ name: 'activeUsers' }] }),
    })
    const d = await r.json()
    return num(d.rows?.[0]?.metricValues?.[0]?.value)
  } catch { return 0 }
}

async function fetchProperty(code, propertyId, token) {
  const cur = { startDate: '28daysAgo', endDate: 'today' }
  const reqsA = [
    { dateRanges: [cur], metrics: [{ name: 'totalUsers' }, { name: 'sessions' }, { name: 'screenPageViews' }, { name: 'engagedSessions' }, { name: 'userEngagementDuration' }, { name: 'newUsers' }] },
    { dateRanges: [{ startDate: '56daysAgo', endDate: '29daysAgo' }], metrics: [{ name: 'totalUsers' }, { name: 'sessions' }, { name: 'screenPageViews' }] },
    { dateRanges: [{ startDate: '27daysAgo', endDate: 'today' }], dimensions: [{ name: 'date' }], metrics: [{ name: 'totalUsers' }, { name: 'sessions' }, { name: 'screenPageViews' }], orderBys: [{ dimension: { dimensionName: 'date' } }], limit: 40 },
    { dateRanges: [cur], dimensions: [{ name: 'sessionDefaultChannelGroup' }], metrics: [{ name: 'sessions' }], orderBys: [{ metric: { metricName: 'sessions' }, desc: true }], limit: 8 },
    { dateRanges: [cur], dimensions: [{ name: 'deviceCategory' }], metrics: [{ name: 'sessions' }], orderBys: [{ metric: { metricName: 'sessions' }, desc: true }], limit: 5 },
  ]
  const reqsB = [
    { dateRanges: [cur], dimensions: [{ name: 'pagePath' }], metrics: [{ name: 'screenPageViews' }], orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }], limit: 8 },
    { dateRanges: [cur], dimensions: [{ name: 'city' }], metrics: [{ name: 'sessions' }], orderBys: [{ metric: { metricName: 'sessions' }, desc: true }], limit: 6 },
  ]

  const [a, b, activeNow] = await Promise.all([
    batchReports(propertyId, token, reqsA),
    batchReports(propertyId, token, reqsB),
    realtimeActive(propertyId, token),
  ])
  if (a.error) return { code, error: a.error.message || 'GA4 error' }
  const R = a.reports || []
  const R2 = b.reports || []

  const c = R[0]?.rows?.[0]?.metricValues?.map((m) => num(m.value)) || []
  const p = R[1]?.rows?.[0]?.metricValues?.map((m) => num(m.value)) || []
  const daily = (R[2]?.rows || []).map((r) => {
    const d = r.dimensionValues?.[0]?.value || ''
    const mv = r.metricValues?.map((m) => num(m.value)) || []
    return { date: d, label: d.length === 8 ? `${d.slice(4, 6)}/${d.slice(6, 8)}` : d, users: mv[0] || 0, sessions: mv[1] || 0, pageviews: mv[2] || 0 }
  })

  const users = c[0] || 0, sessions = c[1] || 0, pageviews = c[2] || 0, engaged = c[3] || 0, engDur = c[4] || 0, newUsers = c[5] || 0
  return {
    code,
    users, sessions, pageviews, newUsers,
    returningUsers: Math.max(0, users - newUsers),
    engagedSessions: engaged,
    engagementRate: sessions ? Math.round((engaged / sessions) * 100) : 0,
    avgEngagementSec: sessions ? Math.round(engDur / sessions) : 0,
    perVisitorViews: users ? Math.round((pageviews / users) * 10) / 10 : 0,
    prev: { users: p[0] || 0, sessions: p[1] || 0, pageviews: p[2] || 0 },
    daily,
    channels: pairs(R[3]).map((x) => ({ channel: x.key, sessions: x.val })),
    devices: pairs(R[4]).map((x) => ({ device: x.key, sessions: x.val })),
    topPages: pairs(R2[0]).map((x) => ({ path: x.key, views: x.val })),
    topCities: pairs(R2[1]).filter((x) => x.key && x.key !== '(not set)').map((x) => ({ city: x.key, sessions: x.val })),
    activeNow,
  }
}

export default async function handler(req, res) {
  const _pt = process.env.SOCIAL_PROXY_TOKEN;
  if (_pt && req.headers["x-proxy-token"] !== _pt) return res.status(401).json({ error: "unauthorized" });
  const json = (body, status = 200) => res.status(status).json(body)
  const codes = Object.keys(PROPERTIES)
  if (CACHE.data && Date.now() - CACHE.at < TTL_MS) return json({ ok: true, cached: true, ...CACHE.data })
  try {
    const token = await getAccessToken(SCOPE)
    const restaurants = await Promise.all(codes.map((c) => fetchProperty(c, PROPERTIES[c], token)))
    const data = { generated_at: new Date().toISOString(), restaurants }
    CACHE = { at: Date.now(), data }
    return json({ ok: true, cached: false, ...data })
  } catch (err) {
    return json({ ok: false, error: String(err?.message || err), restaurants: [] })
  }
}
