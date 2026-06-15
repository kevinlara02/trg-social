// Calls the server-side meta-* functions for REAL Facebook/Instagram data.
// Each returns null if unavailable (e.g. local dev or before the Netlify env
// var is set), so the UI gracefully falls back / shows an empty state.

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
