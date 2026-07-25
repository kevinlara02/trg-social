// Shared authorization for the social functions. Two access tiers:
//   - READ: any valid TRG-OS Supabase session (or the server proxy token).
//   - WRITE: only the owner-named allowlist below (or the server token) may
//     publish posts / reply to comments and DMs.
// The Supabase URL and anon key here are PUBLIC (safe to ship in a bundle);
// they are not secrets. We only use them to validate the caller's session and
// read back its email.

const SUPABASE_URL = 'https://sfwahdvmyyrowfvjdlnl.supabase.co'
const SUPABASE_ANON = 'sb_publishable_3-LogL948oijZz5IQHLDtg_uYvUVSlK'

// Owner-named WRITE allowlist. Only these three may publish/reply. Do NOT widen.
export const WRITE_ALLOWLIST = [
  'kevin@toastrestaurantgroup.com',
  'cynthia@toastrestaurantgroup.com',
  'ginger@toastrestaurantgroup.com',
]

export function canWrite(email) {
  return WRITE_ALLOWLIST.includes((email || '').toLowerCase())
}

// authorize(getHeader) -> { ok, email, viaToken }
//   getHeader(name) reads a request header by (lowercase) name. Works for both
//   Netlify runtimes: v1 handlers pass (n) => event.headers?.[n] (keys are
//   already lowercased); v2 handlers pass (n) => req.headers.get(n).
//   - viaToken/ok true when x-proxy-token matches SOCIAL_PROXY_TOKEN (trusted
//     server/scheduled path; no email).
//   - else ok true (email set) when Authorization: Bearer <token> validates as a
//     real Supabase user.
//   - else ok false.
export async function authorize(getHeader) {
  const token = process.env.SOCIAL_PROXY_TOKEN
  const proxy = getHeader('x-proxy-token')
  if (token && proxy === token) return { ok: true, email: null, viaToken: true }

  const auth = getHeader('authorization') || getHeader('Authorization') || ''
  const match = /^Bearer\s+(.+)$/i.exec(auth)
  if (match) {
    try {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${match[1]}` },
      })
      if (res.ok) {
        const user = await res.json()
        return { ok: true, email: (user?.email || '').toLowerCase(), viaToken: false }
      }
    } catch {
      // network / parse failure falls through to unauthorized
    }
  }
  return { ok: false, email: null, viaToken: false }
}
