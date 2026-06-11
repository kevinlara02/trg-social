// Calls the server-side meta-live function for REAL Facebook/Instagram stats.
// Returns null if it is unavailable (e.g. local dev or before the Netlify env
// var is set), so the UI gracefully falls back to sample data.
export async function getLiveSocial() {
  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 8000)
    const res = await fetch('/.netlify/functions/meta-live', { signal: ctrl.signal })
    clearTimeout(timer)
    if (!res.ok) return null
    const data = await res.json()
    if (!data?.ok || !Array.isArray(data.restaurants)) return null
    return data.restaurants
  } catch {
    return null
  }
}
