// Calls the server-side functions for REAL Facebook/Instagram/Yelp data.
// Each returns null if unavailable (e.g. local dev or before the env var is
// set), so the UI gracefully falls back / shows an empty state.

async function getJson(path, timeoutMs = 8000) {
  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), timeoutMs)
    const res = await fetch(path, { signal: ctrl.signal })
    clearTimeout(timer)
    if (!res.ok) return null
    const data = await res.json()
    if (!data?.ok || !Array.isArray(data.restaurants)) return null
    return data.restaurants
  } catch {
    return null
  }
}

// Follower counts + latest post per restaurant (Traffic page).
export function getLiveSocial() {
  return getJson('/.netlify/functions/meta-live', 8000)
}

// Recent Instagram + Facebook posts with engagement (Social page).
export function getLivePosts() {
  return getJson('/.netlify/functions/meta-posts', 12000)
}

// Recent comments on Instagram + Facebook posts (Inbox page).
export function getComments() {
  return getJson('/.netlify/functions/meta-comments', 12000)
}

// Yelp rating + review count + link per restaurant (Reviews page).
export function getYelp() {
  return getJson('/.netlify/functions/yelp-ratings', 10000)
}

// Website traffic per restaurant from Google Analytics 4 (Traffic page).
export function getGa4() {
  return getJson('/.netlify/functions/ga4-traffic', 12000)
}

// Squarespace website contact-form submissions per restaurant (Inbox).
export function getSquarespaceMessages() {
  return getJson('/.netlify/functions/squarespace-messages', 12000)
}

// Daily history of ratings + follower counts (Trends page). Returns an array
// of { date, restaurants:[{ code, rating, reviews, ig, fb }] } or null.
export async function getTrends(timeoutMs = 10000) {
  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), timeoutMs)
    const res = await fetch('/.netlify/functions/trends', { signal: ctrl.signal })
    clearTimeout(timer)
    if (!res.ok) return null
    const data = await res.json()
    return Array.isArray(data?.history) ? data.history : null
  } catch {
    return null
  }
}

// Post a reply to a comment. Returns { ok, id } or { ok:false, error }.
export async function replyToComment({ code, network, comment_id, message }) {
  try {
    const res = await fetch('/.netlify/functions/meta-comment-reply', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code, network, comment_id, message }),
    })
    return await res.json()
  } catch (err) {
    return { ok: false, error: String(err?.message || err) }
  }
}
