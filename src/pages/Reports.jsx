import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Trophy, AlertTriangle, Users, Star } from 'lucide-react'
import { LOCATIONS, locationById } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { StarRating } from '../components/ui/Badge'
import { LastUpdated } from '../components/ui/LastUpdated'
import { Skeleton, KpiSkeleton } from '../components/ui/Skeleton'
import { getYelp, getLivePosts } from '../lib/live'

const fmtNum = (n) => (n == null ? '–' : Number(n).toLocaleString('en-US'))
const k = (n) => (n == null ? '–' : n >= 1000 ? (n / 1000).toFixed(1).replace('.0', '') + 'k' : `${n}`)

export default function Reports() {
  const { isAdmin, scopedLocationId } = useAuth()
  const scopedCode = scopedLocationId ? locationById(scopedLocationId)?.code : null
  const [loading, setLoading] = useState(true)
  const [yelp, setYelp] = useState(null)
  const [posts, setPosts] = useState(null)
  const [updatedAt, setUpdatedAt] = useState(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true)
    Promise.all([getYelp(), getLivePosts()]).then(([y, p]) => {
      if (active) { setYelp(y); setPosts(p); setUpdatedAt(Date.now()); setLoading(false) }
    })
    return () => { active = false }
  }, [tick])

  const inScope = (code) => isAdmin || !scopedCode || code === scopedCode
  const yelpBy = useMemo(() => Object.fromEntries((yelp || []).map((r) => [r.code, r])), [yelp])
  const postsBy = useMemo(() => Object.fromEntries((posts || []).map((r) => [r.code, r])), [posts])

  const rows = LOCATIONS.filter((l) => inScope(l.code)).map((l) => {
    const y = yelpBy[l.code] || {}
    const p = postsBy[l.code] || {}
    return {
      code: l.code, name: l.name, color: l.color,
      rating: y.rating ?? null, reviews: y.review_count ?? null,
      ig: p.ig_followers ?? null, fb: p.fb_followers ?? null, igPosts: p.ig_posts_count ?? null,
    }
  })

  const hasData = (yelp && yelp.length) || (posts && posts.length)
  const totReviews = rows.reduce((s, r) => s + (r.reviews || 0), 0)
  const totFollowers = rows.reduce((s, r) => s + (r.ig || 0) + (r.fb || 0), 0)
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
            <Kpi icon={Star} label="Avg Yelp Rating" value={avgRating ? avgRating.toFixed(1) + '★' : '–'} />
            <Kpi icon={Star} label="Total Reviews" value={fmtNum(totReviews)} />
            <Kpi icon={Users} label="Total Followers" value={k(totFollowers)} />
            <Kpi icon={Users} label="Restaurants" value={`${rows.length}`} />
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
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider border-b border-zinc-800">
                    <th className="py-3 px-5">Restaurant</th>
                    <th className="py-3 px-3 text-right">Yelp</th>
                    <th className="py-3 px-3 text-right">Reviews</th>
                    <th className="py-3 px-3 text-right">Instagram</th>
                    <th className="py-3 px-3 text-right">Facebook</th>
                    <th className="py-3 px-5 text-right">Posts</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.code} className="border-b border-zinc-800/60 last:border-0">
                      <td className="py-3 px-5" style={{ borderLeft: `4px solid ${r.color}` }}>
                        <Link to={`/locations/${r.code}`} className="inline-flex items-center gap-2 font-medium text-zinc-200 hover:text-accent-400">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: r.color }} />
                          {r.name}
                        </Link>
                      </td>
                      <td className="py-3 px-3 text-right">
                        {r.rating != null
                          ? <span className="inline-flex items-center gap-1.5"><span className="font-semibold text-zinc-100">{r.rating.toFixed(1)}</span><StarRating rating={Math.round(r.rating)} /></span>
                          : <span className="text-zinc-600">–</span>}
                      </td>
                      <td className="py-3 px-3 text-right text-zinc-300 tabular-nums">{fmtNum(r.reviews)}</td>
                      <td className="py-3 px-3 text-right text-zinc-300 tabular-nums">{k(r.ig)}</td>
                      <td className="py-3 px-3 text-right text-zinc-300 tabular-nums">{k(r.fb)}</td>
                      <td className="py-3 px-5 text-right text-zinc-300 tabular-nums">{fmtNum(r.igPosts)}</td>
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

function Kpi({ icon: Icon, label, value }) {
  return (
    <div className="bg-[#101012] rounded-2xl border border-zinc-800 p-5 flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-accent-500/10 text-accent-400"><Icon className="w-6 h-6" /></div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-zinc-50">{value}</p>
        <p className="text-sm text-zinc-500 truncate">{label}</p>
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
