import { useEffect, useMemo, useState } from 'react'
import { Users, Heart, MessageCircle, Image as ImageIcon } from 'lucide-react'
import { LOCATIONS, locationById } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { PlatformIcon } from '../components/ui/Platform'
import { LastUpdated } from '../components/ui/LastUpdated'
import { Skeleton, KpiSkeleton } from '../components/ui/Skeleton'
import { getLivePosts } from '../lib/live'

const locByCode = (code) => LOCATIONS.find((l) => l.code === code)
const fmtNum = (n) => (n == null ? '–' : n >= 1000 ? (n / 1000).toFixed(1).replace('.0', '') + 'k' : `${n}`)
const eng = (p) => (p.likes || 0) + (p.comments || 0)
const DAY = 86400000

export default function Social() {
  const { isAdmin, scopedLocationId } = useAuth()
  const scopedCode = scopedLocationId ? locationById(scopedLocationId)?.code : null
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [sel, setSel] = useState(scopedCode || null)
  const [updatedAt, setUpdatedAt] = useState(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true)
    getLivePosts().then((rows) => { if (active) { setData(rows); setUpdatedAt(Date.now()); setLoading(false) } })
    return () => { active = false }
  }, [tick])

  const restaurants = useMemo(() => {
    if (!data) return []
    let rows = data
    if (!isAdmin && scopedCode) rows = rows.filter((r) => r.code === scopedCode)
    if (sel) rows = rows.filter((r) => r.code === sel)
    return rows
  }, [data, sel, isAdmin, scopedCode])

  const allPosts = useMemo(
    () => restaurants.flatMap((r) => (r.posts || []).map((p) => ({ ...p, code: r.code }))),
    [restaurants],
  )

  const followers = restaurants.reduce((s, r) => s + (r.ig_followers || 0) + (r.fb_followers || 0), 0)
  const igPosts = restaurants.reduce((s, r) => s + (r.ig_posts_count || 0), 0)
  const recentEng = allPosts.reduce((s, p) => s + eng(p), 0)

  const topPosts = [...allPosts].sort((a, b) => eng(b) - eng(a)).slice(0, 6)
  const feed = [...allPosts].sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 24)

  const right = (
    <>
      <LastUpdated at={updatedAt} loading={loading} onRefresh={() => setTick((t) => t + 1)} />
      {isAdmin && data && (
        <select
          value={sel || ''}
          onChange={(e) => setSel(e.target.value || null)}
          className="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-sm text-zinc-200"
        >
          <option value="">All Locations</option>
          {LOCATIONS.map((l) => <option key={l.id} value={l.code}>{l.name}</option>)}
        </select>
      )}
    </>
  )

  if (loading && !data) {
    return (
      <Shell right={right}>
        <KpiSkeleton count={3} />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="aspect-square w-full rounded-xl" />)}
        </div>
      </Shell>
    )
  }
  if (!data) {
    return (
      <Shell right={right}>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 text-center">
          <ImageIcon className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
          <p className="font-medium text-zinc-200">Live posts aren't available right now</p>
          <p className="text-sm text-zinc-500 mt-1">This page shows real Instagram &amp; Facebook posts on the deployed site.</p>
        </div>
      </Shell>
    )
  }

  return (
    <Shell right={right}>
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 mb-6 flex gap-3">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0 mt-1.5 animate-pulse" />
        <p className="text-sm text-emerald-200/80"><span className="font-medium text-emerald-100">Live from Instagram &amp; Facebook.</span> Real posts and engagement, pulled straight from your accounts.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Kpi icon={Users} label="Followers" value={fmtNum(followers)} />
        <Kpi icon={ImageIcon} label="Instagram Posts" value={fmtNum(igPosts)} />
        <Kpi icon={Heart} label="Recent Engagement" value={fmtNum(recentEng)} />
      </div>

      <Card title="Recent posts" subtitle="Latest across your accounts" className="mb-6">
        {feed.length ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {feed.map((p) => <PostCard key={p.id} post={p} />)}
          </div>
        ) : <Empty label="No posts found" />}
      </Card>

      <Card title="Account health" subtitle="When each restaurant last posted" className="mb-6">
        <div className="space-y-2">
          {restaurants.map((r) => <HealthRow key={r.code} r={r} />)}
        </div>
      </Card>

      <Card title="Top posts" subtitle="Most engagement (likes + comments)">
        {topPosts.length ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {topPosts.map((p) => <PostCard key={p.id} post={p} />)}
          </div>
        ) : <Empty label="No posts found" />}
      </Card>
    </Shell>
  )
}

function Shell({ children, right }) {
  return (
    <div className="p-4 md:p-8 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-50">Social</h1>
          <p className="text-zinc-500 mt-1">Live posts and engagement from Instagram &amp; Facebook.</p>
        </div>
        {right && <div className="flex items-center gap-3">{right}</div>}
      </div>
      {children}
    </div>
  )
}

function HealthRow({ r }) {
  const loc = locByCode(r.code)
  const dates = (r.posts || []).map((p) => p.date).filter(Boolean).sort().reverse()
  const last = dates[0]
  const days = last ? Math.floor((Date.now() - new Date(last).getTime()) / DAY) : null
  const last30 = dates.filter((d) => Date.now() - new Date(d).getTime() < 30 * DAY).length
  const st = days == null
    ? { label: 'No data', cls: 'text-zinc-400 bg-zinc-800' }
    : days <= 7 ? { label: 'Active', cls: 'text-emerald-400 bg-emerald-500/10' }
      : days <= 21 ? { label: 'Going quiet', cls: 'text-amber-400 bg-amber-500/10' }
        : { label: 'Dormant', cls: 'text-red-400 bg-red-500/10' }
  return (
    <div className="flex items-center gap-3 flex-wrap rounded-xl border border-zinc-800 bg-[#0c0c0e] px-3 py-2.5" style={{ borderLeftWidth: '4px', borderLeftColor: loc?.color }}>
      <span className="text-sm font-medium text-zinc-100 flex items-center gap-2 w-40 shrink-0">
        <span className="w-3 h-3 rounded-full" style={{ background: loc?.color }} />{loc?.name}
      </span>
      <span className={`text-[11px] font-semibold uppercase tracking-wide rounded px-2 py-0.5 ${st.cls}`}>{st.label}</span>
      <span className="text-xs text-zinc-400">
        {last ? <>last post {last.slice(0, 10)} {days != null && <span className="text-zinc-600">({days === 0 ? 'today' : days + 'd ago'})</span>}</> : 'no recent posts'}
      </span>
      <span className="text-xs text-zinc-500 ml-auto">{last30} in last 30d</span>
    </div>
  )
}

function PostCard({ post }) {
  const loc = locByCode(post.code)
  return (
    <a href={post.permalink || '#'} target="_blank" rel="noreferrer" className="block rounded-xl overflow-hidden border border-zinc-800 bg-[#0c0c0e] hover:border-zinc-600 transition-colors">
      {post.image ? (
        <img src={post.image} alt="" loading="lazy" className="w-full aspect-square object-cover" />
      ) : (
        <div className="w-full aspect-square flex items-center justify-center bg-zinc-900 text-zinc-700"><ImageIcon className="w-7 h-7" /></div>
      )}
      <div className="p-3">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: loc?.color }} />
          <span className="text-xs font-medium text-zinc-200 truncate flex-1">{loc?.name}</span>
          <PlatformIcon platform={post.network} size="sm" />
        </div>
        {post.caption && <p className="text-xs text-zinc-400 line-clamp-2 mb-2">{post.caption}</p>}
        <div className="flex items-center gap-3 text-xs text-zinc-500">
          {post.likes != null && <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" />{fmtNum(post.likes)}</span>}
          {post.comments != null && <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" />{fmtNum(post.comments)}</span>}
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

function Card({ title, subtitle, children, className = '' }) {
  return (
    <section className={`bg-[#101012] rounded-2xl border border-zinc-800 overflow-hidden ${className}`}>
      <div className="px-5 py-4 border-b border-zinc-800 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-zinc-100">{title}</h2>
          {subtitle && <p className="text-xs text-zinc-500 mt-0.5">{subtitle}</p>}
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-400 bg-emerald-500/10 rounded px-2 py-1 shrink-0">Live</span>
      </div>
      <div className="p-5">{children}</div>
    </section>
  )
}

function Empty({ label }) {
  return <p className="text-sm text-zinc-500 text-center py-6">{label}</p>
}
