import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Star, Users, Heart, Image as ImageIcon, AlertTriangle, ArrowRight, TrendingUp, Globe, MessageSquare } from 'lucide-react'
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { LOCATIONS, locationById } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { PlatformIcon } from '../components/ui/Platform'
import { LastUpdated } from '../components/ui/LastUpdated'
import { KpiSkeleton, ChartSkeleton } from '../components/ui/Skeleton'
import { delta, DeltaTag } from '../components/ui/Delta'
import { getYelp, getLivePosts, getGa4 } from '../lib/live'

const fmtNum = (n) => (n == null ? '–' : n >= 1000 ? (n / 1000).toFixed(1).replace('.0', '') + 'k' : `${n}`)
const locByCode = (code) => LOCATIONS.find((l) => l.code === code)

export default function Dashboard() {
  const { isAdmin, scopedLocationId } = useAuth()
  const scopedCode = scopedLocationId ? locationById(scopedLocationId)?.code : null
  const navigate = useNavigate()
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

  const goToLocation = (d) => { const code = d?.name || d?.payload?.name; if (code) navigate(`/locations/${code}`) }

  const inScope = (code) => isAdmin || !scopedCode || code === scopedCode
  const yelpRows = useMemo(() => (yelp || []).filter((r) => r.rating != null && inScope(r.code)), [yelp, isAdmin, scopedCode])
  const postRows = useMemo(() => (posts || []).filter((r) => inScope(r.code)), [posts, isAdmin, scopedCode])
  const ga4Rows = useMemo(() => (ga4 || []).filter((r) => !r.error && inScope(r.code)), [ga4, isAdmin, scopedCode])

  const hasData = yelpRows.length > 0 || postRows.length > 0 || ga4Rows.length > 0

  const avgYelp = yelpRows.length ? yelpRows.reduce((s, r) => s + (r.rating || 0), 0) / yelpRows.length : 0
  const totalReviews = yelpRows.reduce((s, r) => s + (r.review_count || 0), 0)
  const totalFollowers = postRows.reduce((s, r) => s + (r.ig_followers || 0) + (r.fb_followers || 0), 0)
  const totalVisitors = ga4Rows.reduce((s, r) => s + (r.users || 0), 0)
  const prevVisitors = ga4Rows.reduce((s, r) => s + (r.prev?.users || 0), 0)
  const activeNow = ga4Rows.reduce((s, r) => s + (r.activeNow || 0), 0)
  const allPosts = postRows.flatMap((r) => (r.posts || []).map((p) => ({ ...p, code: r.code })))
  const recent = [...allPosts].sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 4)

  const yelpChart = yelpRows.map((r) => ({ name: r.code, rating: r.rating, color: locByCode(r.code)?.color })).sort((a, b) => b.rating - a.rating)
  const followerChart = postRows.map((r) => ({ name: r.code, followers: (r.ig_followers || 0) + (r.fb_followers || 0), color: locByCode(r.code)?.color })).filter((d) => d.followers > 0).sort((a, b) => b.followers - a.followers)
  const visitorChart = ga4Rows.map((r) => ({ name: r.code, visitors: r.users || 0, color: locByCode(r.code)?.color })).filter((d) => d.visitors > 0).sort((a, b) => b.visitors - a.visitors)
  const lowest = yelpChart.length > 1 ? yelpChart[yelpChart.length - 1] : null

  return (
    <div className="p-4 md:p-8 max-w-7xl">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-50">Dashboard</h1>
          <p className="text-zinc-500 mt-1">Live overview across your restaurants.</p>
        </div>
        <div className="pt-1"><LastUpdated at={updatedAt} loading={loading} onRefresh={() => setTick((t) => t + 1)} /></div>
      </div>

      {loading && !hasData ? (
        <>
          <KpiSkeleton count={4} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><ChartSkeleton /><ChartSkeleton /></div>
        </>
      ) : !hasData ? (
        <Unavailable />
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Kpi icon={Globe} label="Website Visitors" value={fmtNum(totalVisitors)} delta={delta(totalVisitors, prevVisitors)} sub={activeNow > 0 ? `${activeNow} active now` : null} live={activeNow > 0} accent />
            <Kpi icon={Star} label="Avg Yelp Rating" value={avgYelp ? avgYelp.toFixed(1) + '★' : '–'} />
            <Kpi icon={Users} label="Followers (IG+FB)" value={fmtNum(totalFollowers)} />
            <Kpi icon={MessageSquare} label="Yelp Reviews" value={fmtNum(totalReviews)} />
          </div>

          {lowest && (
            <Link to={`/locations/${lowest.name}`} className="flex items-center gap-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 p-4 mb-6 hover:bg-amber-500/15 transition-colors">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              <p className="text-sm text-amber-100 flex-1">
                <span className="font-medium">{locByCode(lowest.name)?.name}</span> has the lowest Yelp rating ({lowest.rating}★). Worth a look.
              </p>
              <ArrowRight className="w-4 h-4 text-amber-400 shrink-0" />
            </Link>
          )}

          {visitorChart.length > 0 && (
            <ChartCard title="Website visitors by restaurant" subtitle="Last 28 days, from Google Analytics" to="/traffic" className="mb-6">
              <ResponsiveContainer width="100%" height={240} minHeight={240}>
                <BarChart data={visitorChart} margin={{ left: -10, right: 0, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="name" stroke="#71717a" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#71717a" tick={{ fontSize: 10 }} width={40} tickFormatter={(v) => fmtNum(v)} />
                  <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', color: '#fafafa', fontSize: '12px' }} formatter={(v) => fmtNum(v) + ' visitors'} />
                  <Bar dataKey="visitors" radius={[8, 8, 0, 0]} cursor="pointer" onClick={goToLocation}>
                    {visitorChart.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <ChartCard title="Yelp rating by restaurant" subtitle="Live from Yelp" to="/reviews">
              {yelpChart.length ? (
                <ResponsiveContainer width="100%" height={220} minHeight={220}>
                  <BarChart data={yelpChart} margin={{ left: -20, right: 0, top: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="name" stroke="#71717a" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#71717a" tick={{ fontSize: 10 }} domain={[0, 5]} width={30} />
                    <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', color: '#fafafa', fontSize: '12px' }} formatter={(v) => v.toFixed(1) + '★'} />
                    <Bar dataKey="rating" radius={[8, 8, 0, 0]} cursor="pointer" onClick={goToLocation}>
                      {yelpChart.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : <Empty />}
            </ChartCard>

            <ChartCard title="Followers by restaurant" subtitle="Instagram + Facebook" to="/traffic">
              {followerChart.length ? (
                <ResponsiveContainer width="100%" height={220} minHeight={220}>
                  <BarChart data={followerChart} margin={{ left: -10, right: 0, top: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="name" stroke="#71717a" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#71717a" tick={{ fontSize: 10 }} width={40} tickFormatter={(v) => fmtNum(v)} />
                    <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', color: '#fafafa', fontSize: '12px' }} formatter={(v) => fmtNum(v) + ' followers'} />
                    <Bar dataKey="followers" radius={[8, 8, 0, 0]} cursor="pointer" onClick={goToLocation}>
                      {followerChart.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : <Empty />}
            </ChartCard>
          </div>

          <Link to="/trends" className="flex items-center gap-3 rounded-2xl bg-[#101012] border border-zinc-800 p-4 mb-6 hover:border-zinc-600 transition-colors">
            <TrendingUp className="w-5 h-5 text-accent-400 shrink-0" />
            <p className="text-sm text-zinc-300 flex-1">See how your ratings and followers change over time.</p>
            <ArrowRight className="w-4 h-4 text-zinc-500 shrink-0" />
          </Link>

          <section className="bg-[#101012] rounded-2xl border border-zinc-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
              <h2 className="font-semibold text-zinc-100">Recent posts</h2>
              <Link to="/social" className="text-sm text-zinc-400 hover:text-zinc-200">View all</Link>
            </div>
            <div className="p-4">
              {recent.length ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {recent.map((p) => <PostThumb key={p.id} post={p} />)}
                </div>
              ) : <Empty />}
            </div>
          </section>
        </>
      )}
    </div>
  )
}

function PostThumb({ post }) {
  const l = locByCode(post.code)
  return (
    <a href={post.permalink || '#'} target="_blank" rel="noreferrer" className="block rounded-xl overflow-hidden border border-zinc-800 bg-[#0c0c0e] hover:border-zinc-600 transition-colors">
      {post.image ? (
        <img src={post.image} alt="" loading="lazy" className="w-full aspect-square object-cover" />
      ) : (
        <div className="w-full aspect-square flex items-center justify-center bg-zinc-900 text-zinc-700"><ImageIcon className="w-6 h-6" /></div>
      )}
      <div className="p-2.5">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: l?.color }} />
          <span className="text-xs text-zinc-300 truncate flex-1">{l?.name}</span>
          <PlatformIcon platform={post.network} size="sm" />
        </div>
        <div className="flex items-center gap-3 text-xs text-zinc-500">
          {post.likes != null && <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{fmtNum(post.likes)}</span>}
          <span className="ml-auto">{post.date ? post.date.slice(0, 10) : ''}</span>
        </div>
      </div>
    </a>
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

function ChartCard({ title, subtitle, to, className = '', children }) {
  return (
    <div className={`bg-[#101012] rounded-2xl border border-zinc-800 p-4 md:p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-zinc-100 text-sm md:text-base">{title}</h3>
          {subtitle && <p className="text-xs text-zinc-500 mt-0.5">{subtitle}</p>}
        </div>
        {to && <Link to={to} className="text-xs text-zinc-500 hover:text-zinc-300">Details</Link>}
      </div>
      {children}
    </div>
  )
}

function Empty() {
  return <p className="text-sm text-zinc-600 text-center py-10">No data yet</p>
}

function Unavailable() {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 text-center">
      <Star className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
      <p className="font-medium text-zinc-200">Live data isn't available right now</p>
      <p className="text-sm text-zinc-500 mt-1">The dashboard shows real Yelp + Instagram + Facebook data on the deployed site.</p>
    </div>
  )
}
