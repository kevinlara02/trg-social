import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Trophy, AlertTriangle, Users, Star, Globe, MessageSquare } from 'lucide-react'
import { LOCATIONS, locationById } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { StarRating } from '../components/ui/Badge'
import { LastUpdated } from '../components/ui/LastUpdated'
import { Skeleton, KpiSkeleton } from '../components/ui/Skeleton'
import { delta, DeltaTag } from '../components/ui/Delta'
import { getYelp, getLivePosts, getGa4 } from '../lib/live'

const fmtNum = (n) => (n == null ? '–' : Number(n).toLocaleString('en-US'))
const k = (n) => (n == null ? '–' : n >= 1000 ? (n / 1000).toFixed(1).replace('.0', '') + 'k' : `${n}`)

export default function Reports() {
  const { isAdmin, scopedLocationId } = useAuth()
  const scopedCode = scopedLocationId ? locationById(scopedLocationId)?.code : null
  const [loading, setLoading] = useState(true)
  const [yelp, setYelp] = useState(null)
  const [posts, setPosts] = useState(null)
  const [ga4, setGa4] = useState(null)
  const [updatedAt, setUpdatedAt] = useState(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true)
    Promise.all([getYelp(), getLivePosts(), getGa4()]).then(([y, p, g]) => {
      if (active) { setYelp(y); setPosts(p); setGa4(g); setUpdatedAt(Date.now()); setLoading(false) }
    })
    return () => { active = false }
  }, [tick])

  const inScope = (code) => isAdmin || !scopedCode || code === scopedCode
  const yelpBy = useMemo(() => Object.fromEntries((yelp || []).map((r) => [r.code, r])), [yelp])
  const postsBy = useMemo(() => Object.fromEntries((posts || []).map((r) => [r.code, r])), [posts])
  const ga4By = useMemo(() => Object.fromEntries((ga4 || []).filter((r) => !r.error).map((r) => [r.code, r])), [ga4])

  const rows = LOCATIONS.filter((l) => inScope(l.code)).map((l) => {
    const y = yelpBy[l.code] || {}
    const p = postsBy[l.code] || {}
    const g = ga4By[l.code] || {}
    return {
      code: l.code, name: l.name, color: l.color,
      rating: y.rating ?? null, reviews: y.review_count ?? null,
      ig: p.ig_followers ?? null, fb: p.fb_followers ?? null,
      visitors: g.users ?? null, activeNow: g.activeNow ?? 0,
    }
  }).sort((a, b) => (b.visitors || 0) - (a.visitors || 0))

  const hasData = (yelp && yelp.length) || (posts && posts.length) || (ga4 && ga4.length)
  const totReviews = rows.reduce((s, r) => s + (r.reviews || 0), 0)
  const totFollowers = rows.reduce((s, r) => s + (r.ig || 0) + (r.fb || 0), 0)
  const totVisitors = rows.reduce((s, r) => s + (r.visitors || 0), 0)
  const prevVisitors = (ga4 || []).reduce((s, r) => s + (r.prev?.users || 0), 0)
  const totActive = rows.reduce((s, r) => s + (r.activeNow || 0), 0)
  const rated = rows.filter((r) => r.rating != null)
  const avgRating = rated.length ? rated.reduce((s, r) => s + r.rating, 0) / rated.length : 0
  const best = rated.length ? [...rated].sort((a, b) => b.rating - a.rating)[0] : null
  const worst = rated.length > 1 ? [...rated].sort((a, b) => a.rating - b.rating)[0] : null

  return (
    <div className="p-4 md:p-8 max-w-5xl">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-50">Reports</h1>
          <p className="text-zinc-500 mt-1">All your restaurants, side by side.</p>
        </div>
        <div className="pt-1"><LastUpdated at={updatedAt} loading={loading} onRefresh={() => setTick((t) => t + 1)} /></div>
      </div>

      {loading && !hasData ? (
        <>
          <KpiSkeleton count={4} />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </>
      ) : !hasData ? (
        <Unavailable />
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Kpi icon={Globe} label="Website Visitors" value={fmtNum(totVisitors)} delta={delta(totVisitors, prevVisitors)} sub={totActive > 0 ? `${totActive} active now` : null} live={totActive > 0} accent />
            <Kpi icon={Star} label="Avg Yelp Rating" value={avgRating ? avgRating.toFixed(1) + '★' : '–'} />
            <Kpi icon={MessageSquare} label="Total Reviews" value={fmtNum(totReviews)} />
            <Kpi icon={Users} label="Total Followers" value={k(totFollowers)} />
          </div>

          {(best || worst) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {best && (
                <div className="flex items-center gap-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4">
                  <Trophy className="w-5 h-5 text-emerald-400 shrink-0" />
                  <p className="text-sm text-emerald-100"><span className="font-medium">{best.name}</span> is your top rated — {best.rating}★</p>
                </div>
              )}
              {worst && (
                <div className="flex items-center gap-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 p-4">
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                  <p className="text-sm text-amber-100"><span className="font-medium">{worst.name}</span> needs attention — {worst.rating}★</p>
                </div>
              )}
            </div>
          )}

          <section className="bg-[#101012] rounded-2xl border border-zinc-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
              <h2 className="font-semibold text-zinc-100">All locations</h2>
              <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-400 bg-emerald-500/10 rounded px-2 py-1">Live</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[680px]">
                <thead>
                  <tr className="text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider border-b border-zinc-800">
                    <th className="py-3 px-5">Restaurant</th>
                    <th className="py-3 px-3 text-right">Visitors</th>
                    <th className="py-3 px-3 text-right">Live</th>
                    <th className="py-3 px-3 text-right">Yelp</th>
                    <th className="py-3 px-3 text-right">Reviews</th>
                    <th className="py-3 px-3 text-right">Instagram</th>
                    <th className="py-3 px-5 text-right">Facebook</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.code} className="border-b border-zinc-800/60 last:border-0 hover:bg-zinc-900/40">
                      <td className="py-3 px-5" style={{ borderLeft: `4px solid ${r.color}` }}>
                        <Link to={`/locations/${r.code}`} className="inline-flex items-center gap-2 font-medium text-zinc-200 hover:text-accent-400">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: r.color }} />
                          {r.name}
                        </Link>
                      </td>
                      <td className="py-3 px-3 text-right font-semibold text-zinc-100 tabular-nums">{r.visitors != null ? fmtNum(r.visitors) : <span className="text-zinc-600 font-normal">–</span>}</td>
                      <td className="py-3 px-3 text-right">{r.activeNow > 0 ? <span className="inline-flex items-center gap-1 text-emerald-400 text-xs"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />{r.activeNow}</span> : <span className="text-zinc-600">0</span>}</td>
                      <td className="py-3 px-3 text-right">
                        {r.rating != null
                          ? <span className="inline-flex items-center gap-1.5"><span className="font-semibold text-zinc-100">{r.rating.toFixed(1)}</span><StarRating rating={Math.round(r.rating)} /></span>
                          : <span className="text-zinc-600">–</span>}
                      </td>
                      <td className="py-3 px-3 text-right text-zinc-300 tabular-nums">{fmtNum(r.reviews)}</td>
                      <td className="py-3 px-3 text-right text-zinc-300 tabular-nums">{k(r.ig)}</td>
                      <td className="py-3 px-5 text-right text-zinc-300 tabular-nums">{k(r.fb)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  )
}

function Kpi({ icon: Icon, label, value, delta: d, sub, live, accent }) {
  return (
    <div className={`bg-[#101012] rounded-2xl border p-5 ${accent ? 'border-accent-500/30' : 'border-zinc-800'}`}>
      <div className="flex items-center gap-2 text-zinc-500 mb-2">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${accent ? 'bg-accent-500/15 text-accent-400' : 'bg-zinc-800/70 text-zinc-400'}`}><Icon className="w-5 h-5" /></div>
        <span className="text-xs uppercase tracking-wide truncate">{label}</span>
        {live && <span className="ml-auto w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
      </div>
      <p className="text-2xl md:text-3xl font-bold text-zinc-50">{value}</p>
      <div className="flex items-center gap-2 mt-1 min-h-[18px]">
        {d && <DeltaTag d={d} />}
        {sub && <span className="text-xs text-zinc-500 truncate">{sub}</span>}
      </div>
    </div>
  )
}

function Unavailable() {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 text-center">
      <Star className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
      <p className="font-medium text-zinc-200">Report data isn't available right now</p>
      <p className="text-sm text-zinc-500 mt-1">This page shows your real Yelp + Instagram + Facebook data on the deployed site.</p>
    </div>
  )
}
