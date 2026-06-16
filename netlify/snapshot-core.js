// Shared logic for the daily Trends snapshots.
// Stores one record per day in a Netlify Blobs store ("trends"), so the
// dashboard can chart how ratings + followers change over time.
// Zero cost (Netlify free tier); reads the same env vars the other functions
// already use, so no new secret is needed.
import { getStore } from '@netlify/blobs'

const KEY = 'history.json'
const MAX_DAYS = 400

function base() {
  return (process.env.URL || process.env.DEPLOY_URL || 'https://trg-socialmedia.netlify.app').replace(/\/$/, '')
}

function today() {
  return new Date().toISOString().slice(0, 10) // YYYY-MM-DD (UTC)
}

// Pull the current numbers from the existing live functions (DRY): Yelp
// rating/reviews + Instagram/Facebook follower counts, merged by restaurant.
async function fetchCurrent() {
  const b = base()
  const grab = (path) =>
    fetch(`${b}${path}`).then((r) => (r.ok ? r.json() : null)).catch(() => null)
  const [yelpRes, metaRes] = await Promise.all([
    grab('/.netlify/functions/yelp-ratings'),
    grab('/.netlify/functions/meta-live'),
  ])
  const byCode = {}
  for (const y of yelpRes?.restaurants || []) {
    byCode[y.code] = { code: y.code, rating: y.rating ?? null, reviews: y.review_count ?? null, ig: null, fb: null }
  }
  for (const m of metaRes?.restaurants || []) {
    byCode[m.code] = byCode[m.code] || { code: m.code, rating: null, reviews: null }
    byCode[m.code].ig = m.ig_followers ?? null
    byCode[m.code].fb = m.fb_followers ?? null
  }
  return Object.values(byCode)
}

export async function getHistory() {
  try {
    const store = getStore('trends')
    return (await store.get(KEY, { type: 'json' })) || []
  } catch {
    return []
  }
}

// Append today's snapshot if it isn't recorded yet, then return the history.
export async function ensureToday() {
  const store = getStore('trends')
  let history = (await store.get(KEY, { type: 'json' })) || []
  const day = today()
  if (history.some((h) => h.date === day)) return history

  const restaurants = await fetchCurrent()
  if (!restaurants.length) return history // nothing live to record; try again later

  history = [...history, { date: day, restaurants }]
  if (history.length > MAX_DAYS) history = history.slice(-MAX_DAYS)
  await store.setJSON(KEY, history)
  return history
}
