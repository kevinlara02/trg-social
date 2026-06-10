import { useEffect, useState } from 'react'
import { Star, MessageSquare, TrendingUp, CheckCheck, Globe, Users, Sparkles, ArrowUp, ArrowDown } from 'lucide-react'
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { supabase, LOCATIONS, reviewPlatforms, inboxPlatforms, platformByKey, locationById, locationName } from '../lib/supabase'
import { PlatformIcon } from '../components/ui/Platform'
import { StarRating, ReviewStatusBadge } from '../components/ui/Badge'
import { LocationDot } from '../components/ui/Location'
import { fmt } from '../lib/datefmt'

const GOLD = '#71717a'
const ENGINE_COLOR = { ChatGPT: '#10A37F', Claude: '#CC785C', Gemini: '#4285F4', Perplexity: '#20808D' }
const k = (n) => (n >= 1000 ? (n / 1000).toFixed(1).replace('.0', '') + 'k' : `${n}`)
const avgOf = (rs) => { const r = rs.filter((x) => x.rating); return r.length ? r.reduce((s, x) => s + Number(x.rating), 0) / r.length : 0 }

export default function Reports() {
  const [loc, setLoc] = useState(null)
  const [loading, setLoading] = useState(true)
  const [reviews, setReviews] = useState([])
  const [messages, setMessages] = useState([])
  const [web, setWeb] = useState([])
  const [social, setSocial] = useState([])
  const [aiChecks, setAiChecks] = useState([])

  useEffect(() => {
    let active = true
    ;(async () => {
      setLoading(true)
      try {
        const [r, m, w, s, a] = await Promise.all([
          supabase.from('reviews').select('id, location_id, platform, rating, status, author_name, body, review_date'),
          supabase.from('messages').select('id, location_id, platform, status'),
          supabase.from('web_traffic').select('id, location_id, visits, prev'),
          supabase.from('social_traffic').select('id, location_id, platform, profile_visits, reach, followers'),
          supabase.from('ai_checks').select('id, prompt, results'),
        ])
        if (!active) return
        setReviews(r.data || []); setMessages(m.data || []); setWeb(w.data || []); setSocial(s.data || []); setAiChecks(a.data || [])
      } catch { if (active) { setReviews([]); setMessages([]); setWeb([]); setSocial([]); setAiChecks([]) } }
      finally { if (active) setLoading(false) }
    })()
    return () => { active = false }
  }, [])

  if (loading) return <div className="p-4 md:p-8 max-w-5xl"><h1 className="text-2xl font-bold text-zinc-50 mb-6">Reports</h1><p className="text-zinc-500 text-sm">Loading…</p></div>

  const selected = loc ? locationById(loc) : null

  return (
    <div className="p-4 md:p-8 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-zinc-50">Reports</h1>
          {selected && (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-300 bg-zinc-800 px-2.5 py-0.5 rounded-full">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: selected.color }} />{selected.name}
            </span>
          )}
        </div>
        <select
          value={loc || ''}
          onChange={(e) => setLoc(e.target.value ? Number(e.target.value) : null)}
          className="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-sm text-zinc-200"
        >
          <option value="">All restaurants</option>
          {LOCATIONS.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
      </div>

      {loc
        ? <Individual loc={loc} reviews={reviews} messages={messages} web={web} social={social} aiChecks={aiChecks} />
        : <Rollup reviews={reviews} messages={messages} />}
    </div>
  )
}

// ---------- All restaurants (rollup) ----------
function Rollup({ reviews, messages }) {
  const rated = reviews.filter((r) => r.rating)
  const avgAll = avgOf(reviews)
  const responseRate = reviews.length ? Math.round((reviews.filter((r) => r.status === 'replied').length / reviews.length) * 100) : 0
  const unread = reviews.filter((r) => r.status === 'new').length + messages.filter((m) => m.status === 'new').length

  const ratingByLoc = LOCATIONS.map((l) => {
    const rs = rated.filter((r) => r.location_id === l.id)
    return { name: l.name, avg: avgOf(rs), count: rs.length }
  }).filter((l) => l.count > 0).sort((a, b) => b.avg - a.avg)

  const sentiment = { positive: rated.filter((r) => r.rating >= 4).length, neutral: rated.filter((r) => r.rating === 3).length, negative: rated.filter((r) => r.rating <= 2).length }
  const sentimentData = [
    { name: 'Positive (4-5*)', value: sentiment.positive, fill: '#22c55e' },
    { name: 'Neutral (3*)', value: sentiment.neutral, fill: '#eab308' },
    { name: 'Negative (1-2*)', value: sentiment.negative, fill: '#ef4444' },
  ].filter((d) => d.value > 0)

  const platformCounts = {}
  reviews.forEach((r) => { platformCounts[r.platform] = (platformCounts[r.platform] || 0) + 1 })
  const platformData = Object.entries(platformCounts).map(([p, c]) => ({ platform: p.charAt(0).toUpperCase() + p.slice(1), count: c }))

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Kpi icon={TrendingUp} label="Avg Rating" value={avgAll ? avgAll.toFixed(1) : 'n/a'} />
        <Kpi icon={Star} label="Total Reviews" value={reviews.length} />
        <Kpi icon={CheckCheck} label="Response Rate" value={`${responseRate}%`} />
        <Kpi icon={MessageSquare} label="Unread" value={unread} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <Card title="Average rating by location">
          <ResponsiveContainer width="100%" height={220} minHeight={220}>
            <BarChart data={ratingByLoc} margin={{ left: -20, right: 0, top: 5, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="name" stroke="#71717a" style={{ fontSize: '10px' }} angle={-45} textAnchor="end" height={70} tick={{ fontSize: 9 }} />
              <YAxis stroke="#71717a" style={{ fontSize: '10px' }} domain={[0, 5]} width={30} tick={{ fontSize: 9 }} />
              <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', color: '#fafafa', fontSize: '11px' }} formatter={(value) => value.toFixed(1)} />
              <Bar dataKey="avg" fill="#71717a" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Guest sentiment">
          <ResponsiveContainer width="100%" height={220} minHeight={220}>
            <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <Pie data={sentimentData} cx="50%" cy="50%" labelLine={false} label={(entry) => `${entry.value}`} outerRadius={65} dataKey="value">
                {sentimentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', color: '#fafafa', fontSize: '11px' }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="bg-[#101012] rounded-2xl border border-zinc-800 p-4 md:p-6 mb-4">
        <h3 className="font-semibold text-zinc-100 mb-4 text-sm md:text-base">Reviews by Platform</h3>
        <ResponsiveContainer width="100%" height={200} minHeight={200}>
          <BarChart data={platformData} margin={{ left: -20, right: 0, top: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis dataKey="platform" stroke="#71717a" style={{ fontSize: '11px' }} tick={{ fontSize: 10 }} />
            <YAxis stroke="#71717a" style={{ fontSize: '11px' }} tick={{ fontSize: 10 }} width={30} />
            <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', color: '#fafafa', fontSize: '12px' }} />
            <Bar dataKey="count" fill="#71717a" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <ChannelCard messages={messages} className="mt-4" />
    </>
  )
}

// ---------- Individual restaurant report ----------
function Individual({ loc, reviews, messages, web, social, aiChecks }) {
  const rev = reviews.filter((r) => r.location_id === loc)
  const msg = messages.filter((m) => m.location_id === loc)
  const avg = avgOf(rev)
  const responseRate = rev.length ? Math.round((rev.filter((r) => r.status === 'replied').length / rev.length) * 100) : 0
  const followers = social.filter((s) => s.location_id === loc).reduce((s, x) => s + x.followers, 0)
  const w = web.find((x) => x.location_id === loc)
  const change = w && w.prev ? Math.round(((w.visits - w.prev) / w.prev) * 100) : 0
  const fb = social.find((s) => s.location_id === loc && s.platform === 'facebook')
  const ig = social.find((s) => s.location_id === loc && s.platform === 'instagram')

  const aiHits = aiChecks
    .map((c) => ({ prompt: c.prompt, engines: (c.results || []).filter((r) => r.mentioned && r.location_id === loc).map((r) => r.engine) }))
    .filter((c) => c.engines.length > 0)
  const recent = [...rev].sort((a, b) => (a.review_date < b.review_date ? 1 : -1)).slice(0, 5)

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Kpi icon={TrendingUp} label="Avg Rating" value={avg ? avg.toFixed(1) : 'n/a'} />
        <Kpi icon={Star} label="Reviews" value={rev.length} />
        <Kpi icon={CheckCheck} label="Response Rate" value={`${responseRate}%`} />
        <Kpi icon={Users} label="Followers" value={k(followers)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[#101012] rounded-2xl border border-zinc-800 p-4 md:p-6">
          <h3 className="font-semibold text-zinc-100 mb-4 text-sm md:text-base">Reviews by Platform</h3>
          <ResponsiveContainer width="100%" height={220} minHeight={220}>
            <BarChart data={getPlatformData(rev)} margin={{ left: -20, right: 0, top: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="platform" stroke="#71717a" style={{ fontSize: '11px' }} tick={{ fontSize: 10 }} />
              <YAxis stroke="#71717a" style={{ fontSize: '11px' }} tick={{ fontSize: 10 }} width={30} />
              <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', color: '#fafafa', fontSize: '11px' }} />
              <Bar dataKey="count" fill="#71717a" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-[#101012] rounded-2xl border border-zinc-800 p-4 md:p-6">
          <h3 className="font-semibold text-zinc-100 mb-4 text-sm md:text-base">Guest Sentiment</h3>
          <ResponsiveContainer width="100%" height={220} minHeight={220}>
            <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <Pie data={getSentimentData(rev)} cx="50%" cy="50%" labelLine={false} label={(entry) => `${entry.value}`} outerRadius={65} dataKey="value">
                {getSentimentData(rev).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', color: '#fafafa', fontSize: '11px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <Card title="Website & social" subtitle="This month">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-300 flex items-center gap-2"><Globe className="w-4 h-4 text-accent-400" /> Website visits</span>
              <span className="flex items-center gap-2">
                <span className="text-zinc-100 font-semibold tabular-nums">{w ? k(w.visits) : 'n/a'}</span>
                {w && <span className={`inline-flex items-center text-xs ${change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{change >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}{Math.abs(change)}%</span>}
              </span>
            </div>
            {[fb, ig].filter(Boolean).map((s) => (
              <div key={s.id} className="flex items-center justify-between">
                <span className="text-sm text-zinc-300 flex items-center gap-2"><PlatformIcon platform={s.platform} size="sm" /> {platformByKey(s.platform)?.name}</span>
                <span className="text-xs text-zinc-400"><span className="text-zinc-100 font-medium">{k(s.reach)}</span> reach · <span className="text-zinc-100 font-medium">{k(s.profile_visits)}</span> visits · <span className="text-zinc-100 font-medium">{k(s.followers)}</span> followers</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="AI visibility" subtitle={`Recommended in ${aiHits.length} of ${aiChecks.length} test questions`}>
          {aiHits.length === 0 ? (
            <p className="text-sm text-zinc-500">Not yet surfacing in the AI questions we track.</p>
          ) : (
            <div className="space-y-2">
              {aiHits.map((h) => (
                <div key={h.prompt} className="text-sm">
                  <p className="text-zinc-300">"{h.prompt}"</p>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {h.engines.map((e) => (
                      <span key={e} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs" style={{ background: `${ENGINE_COLOR[e] || '#a1a1aa'}1a`, color: '#e4e4e7' }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: ENGINE_COLOR[e] || '#a1a1aa' }} />{e}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card title="Recent reviews" className="mt-4">
        {recent.length === 0 ? (
          <p className="text-sm text-zinc-500">No reviews yet.</p>
        ) : (
          <div className="divide-y divide-zinc-800/70 -my-2">
            {recent.map((r) => (
              <div key={r.id} className="py-3 flex items-start gap-3">
                <PlatformIcon platform={r.platform} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-zinc-100">{r.author_name || 'Guest'}</span>
                    <StarRating rating={r.rating} />
                    <span className="ml-auto"><ReviewStatusBadge status={r.status} /></span>
                  </div>
                  {r.body && <p className="text-sm text-zinc-400 mt-1 line-clamp-2">{r.body}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  )
}

// ---------- shared section cards ----------
function SentimentCard({ reviews }) {
  const rated = reviews.filter((r) => r.rating)
  const s = { positive: rated.filter((r) => r.rating >= 4).length, neutral: rated.filter((r) => r.rating === 3).length, negative: rated.filter((r) => r.rating <= 2).length }
  const total = Math.max(1, s.positive + s.neutral + s.negative)
  return (
    <Card title="Guest sentiment">
      <div className="h-3 rounded-full overflow-hidden flex bg-zinc-800 mb-4">
        <div style={{ width: `${(s.positive / total) * 100}%`, background: '#34d399' }} />
        <div style={{ width: `${(s.neutral / total) * 100}%`, background: '#71717a' }} />
        <div style={{ width: `${(s.negative / total) * 100}%`, background: '#f87171' }} />
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <Sent label="Positive" value={s.positive} color="#34d399" />
        <Sent label="Neutral" value={s.neutral} color="#a1a1aa" />
        <Sent label="Negative" value={s.negative} color="#f87171" />
      </div>
    </Card>
  )
}

function PlatformCard({ reviews }) {
  const rows = reviewPlatforms().map((p) => ({ p, n: reviews.filter((r) => r.platform === p.key).length }))
  const max = Math.max(1, ...rows.map((x) => x.n))
  return (
    <Card title="Reviews by platform">
      <div className="space-y-3">
        {rows.map(({ p, n }) => (
          <div key={p.key}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-zinc-300 flex items-center gap-2"><PlatformIcon platform={p.key} size="sm" /> {p.name}</span>
              <span className="text-zinc-400 tabular-nums">{n}</span>
            </div>
            <Track pct={(n / max) * 100} color={p.color} />
          </div>
        ))}
      </div>
    </Card>
  )
}

function ChannelCard({ messages, className = '' }) {
  const rows = inboxPlatforms().map((p) => ({ p, n: messages.filter((m) => m.platform === p.key).length }))
  return (
    <Card title="Messages by channel" className={className}>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {rows.map(({ p, n }) => (
          <div key={p.key} className="rounded-xl border border-zinc-800 bg-[#0c0c0e] p-4 flex items-center gap-3">
            <PlatformIcon platform={p.key} />
            <div><p className="text-xl font-bold text-zinc-50 leading-none">{n}</p><p className="text-xs text-zinc-500 mt-1">{p.name}</p></div>
          </div>
        ))}
      </div>
    </Card>
  )
}

function Kpi({ icon: Icon, label, value }) {
  return (
    <div className="bg-[#101012] rounded-2xl border border-zinc-800 p-5 flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-accent-500/10 text-accent-400"><Icon className="w-6 h-6" /></div>
      <div className="min-w-0"><p className="text-2xl font-bold text-zinc-50">{value}</p><p className="text-sm text-zinc-500 truncate">{label}</p></div>
    </div>
  )
}

function getPlatformData(reviews) {
  const counts = {}
  reviews.forEach((r) => { counts[r.platform] = (counts[r.platform] || 0) + 1 })
  return Object.entries(counts).map(([p, c]) => ({ platform: p.charAt(0).toUpperCase() + p.slice(1), count: c }))
}

function getSentimentData(reviews) {
  const rated = reviews.filter((r) => r.rating)
  const s = { positive: rated.filter((r) => r.rating >= 4).length, neutral: rated.filter((r) => r.rating === 3).length, negative: rated.filter((r) => r.rating <= 2).length }
  return [
    { name: 'Positive (4-5*)', value: s.positive, fill: '#22c55e' },
    { name: 'Neutral (3*)', value: s.neutral, fill: '#eab308' },
    { name: 'Negative (1-2*)', value: s.negative, fill: '#ef4444' },
  ].filter((d) => d.value > 0)
}

function Card({ title, subtitle, children, className = '' }) {
  return (
    <section className={`bg-[#101012] rounded-2xl border border-zinc-800 overflow-hidden ${className}`}>
      <div className="px-5 py-4 border-b border-zinc-800">
        <h2 className="font-semibold text-zinc-100">{title}</h2>
        {subtitle && <p className="text-xs text-zinc-500 mt-0.5">{subtitle}</p>}
      </div>
      <div className="p-5">{children}</div>
    </section>
  )
}

function Track({ pct, color }) {
  return <div className="h-2 rounded-full bg-zinc-800 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} /></div>
}

function Sent({ label, value, color }) {
  return <div className="rounded-xl border border-zinc-800 bg-[#0c0c0e] py-3"><p className="text-xl font-bold" style={{ color }}>{value}</p><p className="text-xs text-zinc-500 mt-0.5">{label}</p></div>
}
