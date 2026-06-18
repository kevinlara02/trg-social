import { useEffect, useMemo, useState } from 'react'
import { Users, Eye, MousePointerClick, Clock, Activity, TrendingUp, TrendingDown, Globe, Smartphone, Monitor, Tablet, MapPin, FileText, UserPlus } from 'lucide-react'
import { AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { LOCATIONS } from '../lib/supabase'
import { PlatformIcon } from '../components/ui/Platform'
import { LastUpdated } from '../components/ui/LastUpdated'
import { KpiSkeleton, ChartSkeleton } from '../components/ui/Skeleton'
import { getLiveSocial, getGa4 } from '../lib/live'

const fmt = (n) => (n == null ? '–' : Number(n).toLocaleString('en-US'))
const k = (n) => (n == null ? '–' : n >= 1000 ? (n / 1000).toFixed(1).replace('.0', '') + 'k' : `${n}`)
const locByCode = (c) => LOCATIONS.find((l) => l.code === c)
const TOOLTIP = { background: '#18181b', border: '1px solid #3f3f46', borderRadius: 12, color: '#e4e4e7', fontSize: 12 }
const CHANNEL_COLORS = ['#C2A35E', '#5b8def', '#e1306c', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#14b8a6']

function engLabel(s) {
  if (!s) return '0s'
  const m = Math.floor(s / 60), r = s % 60
  return m ? `${m}m ${r}s` : `${r}s`
}
function delta(cur, prev) {
  if (prev == null || prev === 0) return cur > 0 ? { pct: null, up: true, isNew: true } : null
  const d = ((cur - prev) / prev) * 100
  return { pct: Math.abs(d) < 0.05 ? 0 : Math.round(d), up: d >= 0, isNew: false }
}

function mergePairs(rows, listKey, keyName, valName) {
  const m = {}
  for (const r of rows) for (const x of r[listKey] || []) m[x[keyName]] = (m[x[keyName]] || 0) + (x[valName] || 0)
  return Object.entries(m).map(([key, val]) => ({ [keyName]: key, [valName]: val })).sort((a, b) => b[valName] - a[valName])
}

function buildView(rows) {
  if (!rows.length) return null
  const sum = (f) => rows.reduce((s, r) => s + (f(r) || 0), 0)
  const sessions = sum((r) => r.sessions)
  const engaged = sum((r) => r.engagedSessions)
  const durTotal = rows.reduce((s, r) => s + (r.avgEngagementSec || 0) * (r.sessions || 0), 0)
  const users = sum((r) => r.users)
  const dayMap = {}
  for (const r of rows) for (const d of r.daily || []) {
    const e = (dayMap[d.date] = dayMap[d.date] || { date: d.date, label: d.label, users: 0, sessions: 0, pageviews: 0 })
    e.users += d.users; e.sessions += d.sessions; e.pageviews += d.pageviews
  }
  return {
    users,
    sessions,
    pageviews: sum((r) => r.pageviews),
    newUsers: sum((r) => r.newUsers),
    returningUsers: sum((r) => r.returningUsers),
    engagedSessions: engaged,
    engagementRate: sessions ? Math.round((engaged / sessions) * 100) : 0,
    avgEngagementSec: sessions ? Math.round(durTotal / sessions) : 0,
    activeNow: sum((r) => r.activeNow),
    prev: { users: sum((r) => r.prev?.users), sessions: sum((r) => r.prev?.sessions), pageviews: sum((r) => r.prev?.pageviews) },
    daily: Object.values(dayMap).sort((a, b) => a.date.localeCompare(b.date)),
    channels: mergePairs(rows, 'channels', 'channel', 'sessions'),
    devices: mergePairs(rows, 'devices', 'device', 'sessions'),
    topPages: rows.length === 1 ? (rows[0].topPages || []) : [],
    topCities: mergePairs(rows, 'topCities', 'city', 'sessions').slice(0, 6),
  }
}

export default function Traffic() {
  const [loading, setLoading] = useState(true)
  const [ga4, setGa4] = useState(null)
  const [live, setLive] = useState(null)
  const [updatedAt, setUpdatedAt] = useState(null)
  const [tick, setTick] = useState(0)
  const [sel, setSel] = useState('all')

  useEffect(() => {
    let active = true
    setLoading(true)
    Promise.all([getGa4(), getLiveSocial()]).then(([g, l]) => {
      if (active) { setGa4(g); setLive(l); setUpdatedAt(Date.now()); setLoading(false) }
    })
    return () => { active = false }
  }, [tick])

  const rows = useMemo(() => (ga4 || []).filter((r) => !r.error), [ga4])
  const view = useMemo(() => buildView(sel === 'all' ? rows : rows.filter((r) => r.code === sel)), [rows, sel])
  const hasData = rows.length > 0

  return (
    <div className="p-4 md:p-8 max-w-6xl">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-50">Website Traffic</h1>
          <p className="text-zinc-500 mt-1">Live from Google Analytics, last 28 days. {sel === 'all' ? 'All restaurants combined.' : locByCode(sel)?.name}</p>
        </div>
        <LastUpdated at={updatedAt} loading={loading} onRefresh={() => setTick((t) => t + 1)} />
      </div>

      {loading && !hasData ? (
        <><KpiSkeleton count={4} /><ChartSkeleton height={300} /></>
      ) : !hasData ? (
        <Unavailable />
      ) : (
        <>
          {/* Restaurant selector */}
          <div className="flex items-center gap-2 mb-6 flex-wrap">
            <Pill active={sel === 'all'} onClick={() => setSel('all')}>All restaurants</Pill>
            {rows.map((r) => (
              <Pill key={r.code} active={sel === r.code} color={locByCode(r.code)?.color} onClick={() => setSel(r.code)}>{locByCode(r.code)?.name || r.code}</Pill>
            ))}
          </div>

          {/* Hero KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <Kpi icon={Users} label="Visitors" value={fmt(view.users)} delta={delta(view.users, view.prev.users)} accent />
            <Kpi icon={MousePointerClick} label="Sessions" value={fmt(view.sessions)} delta={delta(view.sessions, view.prev.sessions)} />
            <Kpi icon={Eye} label="Page Views" value={fmt(view.pageviews)} delta={delta(view.pageviews, view.prev.pageviews)} />
            <Kpi icon={Activity} label="Active Now" value={fmt(view.activeNow)} live />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Kpi icon={Clock} label="Avg. Engagement" value={engLabel(view.avgEngagementSec)} small />
            <Kpi icon={TrendingUp} label="Engagement Rate" value={`${view.engagementRate}%`} small />
            <Kpi icon={UserPlus} label="New Visitors" value={fmt(view.newUsers)} small />
            <Kpi icon={Users} label="Returning" value={fmt(view.returningUsers)} small />
          </div>

          {/* Trend */}
          <Card title="Visitors & sessions over time" subtitle="Daily, last 28 days">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={view.daily} margin={{ top: 8, right: 12, bottom: 0, left: -10 }}>
                <defs>
                  <linearGradient id="gUsers" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#C2A35E" stopOpacity={0.5} /><stop offset="100%" stopColor="#C2A35E" stopOpacity={0} /></linearGradient>
                  <linearGradient id="gSess" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#5b8def" stopOpacity={0.35} /><stop offset="100%" stopColor="#5b8def" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="label" stroke="#71717a" fontSize={11} interval="preserveStartEnd" minTickGap={24} />
                <YAxis stroke="#71717a" fontSize={11} width={36} tickFormatter={k} />
                <Tooltip contentStyle={TOOLTIP} />
                <Area type="monotone" dataKey="users" name="Visitors" stroke="#C2A35E" strokeWidth={2} fill="url(#gUsers)" />
                <Area type="monotone" dataKey="sessions" name="Sessions" stroke="#5b8def" strokeWidth={2} fill="url(#gSess)" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          {/* Channels + Devices */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <Card title="Where visitors come from" subtitle="Sessions by channel">
              {view.channels.length ? (
                <div className="flex items-center gap-4">
                  <ResponsiveContainer width="50%" height={200}>
                    <PieChart>
                      <Pie data={view.channels} dataKey="sessions" nameKey="channel" cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={2}>
                        {view.channels.map((e, i) => <Cell key={i} fill={CHANNEL_COLORS[i % CHANNEL_COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={TOOLTIP} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-1.5">
                    {view.channels.slice(0, 6).map((c, i) => (
                      <div key={c.channel} className="flex items-center gap-2 text-sm">
                        <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: CHANNEL_COLORS[i % CHANNEL_COLORS.length] }} />
                        <span className="text-zinc-300 truncate flex-1">{c.channel}</span>
                        <span className="text-zinc-500 tabular-nums">{fmt(c.sessions)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : <Empty />}
            </Card>

            <Card title="Devices" subtitle="Sessions by device type">
              {view.devices.length ? (
                <div className="space-y-3 py-2">
                  {view.devices.map((d) => {
                    const total = view.devices.reduce((s, x) => s + x.sessions, 0) || 1
                    const pctv = Math.round((d.sessions / total) * 100)
                    const Icon = d.device === 'mobile' ? Smartphone : d.device === 'tablet' ? Tablet : Monitor
                    return (
                      <div key={d.device}>
                        <div className="flex items-center gap-2 text-sm mb-1">
                          <Icon className="w-4 h-4 text-zinc-400" />
                          <span className="text-zinc-300 capitalize flex-1">{d.device}</span>
                          <span className="text-zinc-400 tabular-nums">{fmt(d.sessions)} · {pctv}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-zinc-800 overflow-hidden"><div className="h-full rounded-full bg-accent-500" style={{ width: `${pctv}%` }} /></div>
                      </div>
                    )
                  })}
                </div>
              ) : <Empty />}
            </Card>
          </div>

          {/* Top pages + cities */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <Card title="Top cities" subtitle="Sessions by visitor city" icon={MapPin}>
              <RankList items={view.topCities} labelKey="city" valKey="sessions" />
            </Card>
            <Card title="Top pages" subtitle={sel === 'all' ? 'Select a restaurant to see its pages' : 'Most viewed pages'} icon={FileText}>
              {sel === 'all' ? <p className="text-sm text-zinc-600 py-8 text-center">Select a restaurant above to see its top pages.</p> : <RankList items={view.topPages} labelKey="path" valKey="views" />}
            </Card>
          </div>

          {/* Per-restaurant breakdown */}
          {sel === 'all' && (
            <Card title="By restaurant" subtitle="Tap a restaurant for its full detail" className="mt-6">
              <div className="overflow-x-auto -mx-2">
                <table className="w-full text-sm min-w-[640px]">
                  <thead>
                    <tr className="text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider border-b border-zinc-800">
                      <th className="py-2.5 px-2">Restaurant</th>
                      <th className="py-2.5 px-2 text-right">Visitors</th>
                      <th className="py-2.5 px-2 text-right">vs prev</th>
                      <th className="py-2.5 px-2 text-right">Sessions</th>
                      <th className="py-2.5 px-2 text-right">Views</th>
                      <th className="py-2.5 px-2 text-right">Eng.</th>
                      <th className="py-2.5 px-2 text-right">Live</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...rows].sort((a, b) => b.users - a.users).map((r) => {
                      const d = delta(r.users, r.prev?.users)
                      return (
                        <tr key={r.code} className="border-b border-zinc-800/60 last:border-0 hover:bg-zinc-900/40 cursor-pointer" onClick={() => setSel(r.code)}>
                          <td className="py-2.5 px-2" style={{ borderLeft: `3px solid ${locByCode(r.code)?.color}` }}>
                            <span className="font-medium text-zinc-200 pl-1.5">{locByCode(r.code)?.name || r.code}</span>
                          </td>
                          <td className="py-2.5 px-2 text-right font-semibold text-zinc-100 tabular-nums">{fmt(r.users)}</td>
                          <td className="py-2.5 px-2 text-right"><DeltaTag d={d} /></td>
                          <td className="py-2.5 px-2 text-right text-zinc-300 tabular-nums">{fmt(r.sessions)}</td>
                          <td className="py-2.5 px-2 text-right text-zinc-300 tabular-nums">{fmt(r.pageviews)}</td>
                          <td className="py-2.5 px-2 text-right text-zinc-400 tabular-nums">{r.engagementRate}%</td>
                          <td className="py-2.5 px-2 text-right">{r.activeNow > 0 ? <span className="inline-flex items-center gap-1 text-emerald-400"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />{r.activeNow}</span> : <span className="text-zinc-600">0</span>}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Social audience */}
          {live && live.length > 0 && (
            <Card title="Social audience" subtitle="Instagram + Facebook followers" className="mt-6" badge="LIVE">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {live.map((l) => {
                  const loc = locByCode(l.code)
                  return (
                    <div key={l.code} className="rounded-xl border border-zinc-800 bg-[#0c0c0e] p-3" style={{ borderLeftWidth: 3, borderLeftColor: loc?.color }}>
                      <p className="text-xs text-zinc-400 truncate mb-1">{loc?.name || l.code}</p>
                      <div className="flex items-center gap-2 text-xs">
                        <PlatformIcon platform="instagram" size="sm" /><span className="text-zinc-200 font-semibold">{k(l.ig_followers)}</span>
                        <PlatformIcon platform="facebook" size="sm" /><span className="text-zinc-200 font-semibold">{k(l.fb_followers)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  )
}

function Kpi({ icon: Icon, label, value, delta: d, accent, live, small }) {
  return (
    <div className={`bg-[#101012] rounded-2xl border p-4 md:p-5 ${accent ? 'border-accent-500/30' : 'border-zinc-800'}`}>
      <div className="flex items-center gap-2 text-zinc-500 mb-2">
        <Icon className={`w-4 h-4 ${accent ? 'text-accent-400' : ''}`} />
        <span className="text-xs uppercase tracking-wide truncate">{label}</span>
        {live && <span className="ml-auto w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
      </div>
      <p className={`font-bold text-zinc-50 ${small ? 'text-xl' : 'text-2xl md:text-3xl'}`}>{value}</p>
      {d && <div className="mt-1"><DeltaTag d={d} /></div>}
    </div>
  )
}

function DeltaTag({ d }) {
  if (!d) return <span className="text-xs text-zinc-600">–</span>
  if (d.isNew) return <span className="text-xs font-medium text-emerald-400">new</span>
  if (d.pct === 0) return <span className="text-xs text-zinc-500">0%</span>
  const Icon = d.up ? TrendingUp : TrendingDown
  return <span className={`inline-flex items-center gap-1 text-xs font-medium ${d.up ? 'text-emerald-400' : 'text-red-400'}`}><Icon className="w-3 h-3" />{Math.abs(d.pct)}%</span>
}

function RankList({ items, labelKey, valKey }) {
  if (!items || !items.length) return <Empty />
  const max = Math.max(...items.map((i) => i[valKey])) || 1
  return (
    <div className="space-y-2 py-1">
      {items.slice(0, 6).map((it, i) => (
        <div key={i}>
          <div className="flex items-center gap-2 text-sm mb-0.5">
            <span className="text-zinc-300 truncate flex-1" title={it[labelKey]}>{it[labelKey] || '(other)'}</span>
            <span className="text-zinc-500 tabular-nums shrink-0">{fmt(it[valKey])}</span>
          </div>
          <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden"><div className="h-full rounded-full bg-accent-500/70" style={{ width: `${Math.round((it[valKey] / max) * 100)}%` }} /></div>
        </div>
      ))}
    </div>
  )
}

function Pill({ active, color, onClick, children }) {
  return (
    <button onClick={onClick} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${active ? 'bg-accent-500 text-zinc-950 border-accent-500' : 'bg-[#101012] text-zinc-300 border-zinc-800 hover:bg-zinc-900'}`}>
      {color && <span className="w-2 h-2 rounded-full" style={{ background: color }} />}
      {children}
    </button>
  )
}

function Card({ title, subtitle, icon: Icon, badge, className = '', children }) {
  return (
    <section className={`bg-[#101012] rounded-2xl border border-zinc-800 p-4 md:p-5 ${className}`}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-zinc-500" />}
          <div>
            <h2 className="font-semibold text-zinc-100">{title}</h2>
            {subtitle && <p className="text-xs text-zinc-500 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {badge && <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-400 bg-emerald-500/10 rounded px-2 py-1 shrink-0">{badge}</span>}
      </div>
      {children}
    </section>
  )
}

function Empty() {
  return <p className="text-sm text-zinc-600 text-center py-8">No data yet</p>
}

function Unavailable() {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 text-center">
      <Globe className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
      <p className="font-medium text-zinc-200">Website traffic isn't available yet</p>
      <p className="text-sm text-zinc-500 mt-1">Once Google Analytics has data for your sites, this dashboard fills in automatically.</p>
    </div>
  )
}
