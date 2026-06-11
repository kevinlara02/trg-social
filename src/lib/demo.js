// ============================================================
// DEMO MODE — the in-memory client stays on (so login works without a
// live Supabase backend), but the sample data has been emptied so the
// app shows ONLY real data. Pages with no real source yet render their
// empty states ("connect your accounts"). The only live data today is
// Instagram (Traffic page), which comes from the meta-live function,
// independent of this seed.
// ============================================================
export const DEMO = true

export const demoProfile = {
  id: 'demo-admin', full_name: 'Kevin', email: 'kevin@toastrestaurantgroup.com',
  role: 'admin', location_id: null, active: true,
}

const SEED = {
  reviews: [],
  messages: [],
  posts: [],
  profiles: [
    { id: 'p1', full_name: 'Kevin', email: 'kevin@toastrestaurantgroup.com', role: 'admin', location_id: null, active: true },
  ],
  activity: [],
  connected_accounts: [],
  ai_checks: [],
  ai_referrals: [],
  web_traffic: [],
  web_sources: [],
  social_traffic: [],
}

export { SEED }

// Persist a small change to the in-memory seed (so demo replies/posts
// stick when you navigate away and come back during a demo).
export function demoMutate(table, id, patch) {
  const row = (SEED[table] || []).find((r) => r.id === id)
  if (row) Object.assign(row, patch)
}
export function demoInsert(table, row) {
  const list = SEED[table] || (SEED[table] = [])
  const id = Math.max(0, ...list.map((r) => (typeof r.id === 'number' ? r.id : 0))) + 1
  const full = { id, ...row }
  list.unshift(full)
  return full
}

// Record an action in the activity log (demo mode).
export function logActivity({ action, target, location_id }) {
  return demoInsert('activity', {
    actor: demoProfile.full_name.split(' ')[0],
    action,
    target: target || '',
    location_id: location_id ?? null,
    at: new Date().toISOString(),
  })
}

// A tiny in-memory stand-in for the Supabase client that supports the
// query shapes the pages use: .select().eq().gt().in().order().limit() and .single().
function builder(rows) {
  let data = [...rows]
  let orderKey = null, orderAsc = true, lim = null
  const b = {
    select: () => b,
    eq: (k, v) => { data = data.filter((r) => r[k] === v); return b },
    gt: (k, v) => { data = data.filter((r) => r[k] > v); return b },
    in: (k, vs) => { data = data.filter((r) => vs.includes(r[k])); return b },
    order: (k, opts) => { orderKey = k; orderAsc = opts?.ascending !== false; return b },
    limit: (n) => { lim = n; return b },
    update: () => b, insert: () => b, delete: () => b,
    single: () => Promise.resolve({ data: data[0] || null, error: null }),
    then: (resolve) => {
      let out = [...data]
      if (orderKey) out.sort((a, z) => {
        const av = a[orderKey], zv = z[orderKey]
        return (av > zv ? 1 : av < zv ? -1 : 0) * (orderAsc ? 1 : -1)
      })
      if (lim != null) out = out.slice(0, lim)
      return resolve({ data: out, error: null })
    },
  }
  return b
}

export const demoClient = {
  from: (table) => builder(SEED[table] || []),
  auth: {
    getSession: async () => ({ data: { session: null } }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    signInWithPassword: async () => ({ error: null }),
    signOut: async () => ({ error: null }),
  },
}
