import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Star, Users, Heart, Image as ImageIcon, AlertTriangle, ArrowRight } from 'lucide-react'
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { LOCATIONS, locationById } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { PlatformIcon } from '../components/ui/Platform'
import { getYelp, getLivePosts } from '../lib/live'

const fmtNum = (n) => (n == null ? '–' : n >= 1000 ? (n / 1000).toFixed(1).replace('.0', '') + 'k' : `${n}`)
const locByCode = (code) => LOCATIONS.find((l) => l.code === code)

export default function Dashboard() {
  const { isAdmin, scopedLocationId } = useAuth()
  const scopedCode = scopedLocationId ? locationById(scopedLocationId)?.code : null
  const [loading, setLoading] = useState(true)
  const [yelp, setYelp] = useState(null)
  const [posts, setPosts] = useState(null)

  useEffect(() => {
    let active = true
    Promise.all([getYelp(), getLivePosts()]).then(([y, p]) => {
      if (active) { setYelp(y); setPosts(p); setLoading(false) }
    })
    return () => { active = false }
  }, [])

  const inScope = (code) => isAdmin || !scopedCode || code === scopedCode
  const yelpRows = useMemo(() => (yelp || []).filter((r) => r.rating != null && inScope(r.code)), [yelp, isAdmin, scopedCode])
  const postRows = useMemo(() => (posts || []).filter((r) => inScope(r.code)), [posts, isAdmin, scopedCode])

  const hasData = yelpRows.length > 0 || postRows.length > 0

  const avgYelp = yelpRows.length ? yelpRows.reduce((s, r) => s + (r.rating || 0), 0) / yelpRows.length : 0
  const totalReviews = yelpRows.reduce((s, r) => s + (r.review_count || 0), 0)
  const totalFollowers = postRows.reduce((s, r) => s + (r.ig_followers || 0) + (r.fb_followers || 0), 0)
  const allPosts = postRows.flatMap((r) => (r.posts || []).map((p) => ({ ...p, code: r.code })))
  const recentEng = allPosts.reduce((s, p) => s + (p.likes || 0) + (p.comments || 0), 0)
  const recent = [...allPosts].sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 4)

  const yelpChart = yelpRows.map((r) => ({ name: r.code, rating: r.rating, color: locByCode(r.code)?.color })).sort((a, b) => b.rating - a.rating)
  const followerChart = postRows.map((r) => ({ name: r.code, followers: (r.ig_followers || 0) + (r.fb_followers || 0), color: locByCode(r.code)?.color })).filter((d) => d.followers > 0).sort((a, b) => b.followers - a.followers)
  const lowest = yelpChart.length > 1 ? yelpChart[yelpChart.length - 1] : null

  return (
    <div className="p-4 md:p-8 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-50">Dashboard</h1>
        <p className="text-zinc-500 mt-1">Live overview across your restaurants.</p>
      </div>

      {loading ? (
        <p className="text-zinc-500 text-sm py-10 text-center">Loading live data…</p>
      ) : !hasData ? (
        <Unavailable />
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Kpi icon={Star} label="Avg Yelp Rating" value={avgYelp ? avgYelp.toFixed(1) + '★' : '–'} />
            <Kpi icon={Users} label="Followers (IG+FB)" value={fmtNum(totalFollowers)} />
            <Kpi icon={Star} label="Yelp Reviews" value={fmtNum(totalReviews)} />
            <Kpi icon={Heart} label="Recent Engagement" value={fmtNum(recentEng)} />
          </div>

          {lowest && (
            <Link to="/reviews" className="flex items-center gap-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 p-4 mb-6 hover:bg-amber-500/15 transition-colors">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              <p className="text-sm text-amber-100 flex-1">
                <span className="font-medium">{locByCode(lowest.name)?.name}</span> has the lowest Yelp rating ({lowest.rating}★). Worth a look.
              </p>
              <ArrowRight className="w-4 h-4 text-amber-400 shrink-0" />
            </Link>
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
                    <Bar dataKey="rating" radius={[8, 8, 0, 0]}>
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
                    <Bar dataKey="followers" radius={[8, 8, 0, 0]}>
                      {followerChart.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : <Empty />}
            </ChartCard>
          </div>

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

function Kpi({ icon: Icon, label, value }) {
  return (
    <div className="bg-[#101012] rounded-2xl border border-zinc-800 p-5 flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-accent-500/10 text-accent-400"><Icon className="w-6 h-6" /></div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-zinc-50 flex items-center gap-2">{value}<span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-400 bg-emerald-500/10 rounded px-1.5 py-0.5">Live</span></p>
        <p className="text-sm text-zinc-500 truncate">{label}</p>
      </div>
    </div>
  )
}

function ChartCard({ title, subtitle, to, children }) {
  return (
    <div className="bg-[#101012] rounded-2xl border border-zinc-800 p-4 md:p-6">
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
