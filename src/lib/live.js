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
