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

// Direct-message conversations (Facebook Messenger) per restaurant (Inbox).
// Each restaurant: { code, conversations:[{ id, network, customer, customerId,
// updated, messages:[{fromUs, author, text, time}], lastText, lastFromUs }] }.
export function getDms() {
  return getJson('/.netlify/functions/meta-dms', 15000)
}

// Send a reply to a Facebook DM conversation. Returns { ok } or { ok:false, error }.
export async function replyToDm({ code, customerId, text }) {
  try {
    const res = await fetch('/.netlify/functions/meta-dm-reply', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code, customerId, text }),
    })
    return await res.json()
  } catch (err) {
    return { ok: false, error: String(err?.message || err) }
  }
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

// --- Publishing (Publish page) ---

// History of posts published from the app (Netlify Blob). Returns [] on failure.
export async function getPublishedPosts(timeoutMs = 10000) {
  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), timeoutMs)
    const res = await fetch('/.netlify/functions/posts', { signal: ctrl.signal })
    clearTimeout(timer)
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data?.posts) ? data.posts : []
  } catch { return [] }
}

// Uploads an image file, returns { ok, url } (a public URL for IG/FB).
export async function uploadMedia(file) {
  try {
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/.netlify/functions/media-upload', { method: 'POST', body: fd })
    return await res.json()
  } catch (err) { return { ok: false, error: String(err?.message || err) } }
}

// Publishes a post to a restaurant's FB/IG. Returns { ok, results }.
export async function publishPost({ code, networks, caption, image_url }) {
  try {
    const res = await fetch('/.netlify/functions/meta-publish', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code, networks, caption, image_url }),
    })
    return await res.json()
  } catch (err) { return { ok: false, error: String(err?.message || err) } }
}

// Records a published post into the history (so the calendar/list shows it).
export function recordPost(record) {
  return fetch('/.netlify/functions/posts', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(record),
  }).then((r) => r.json()).catch(() => null)
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
