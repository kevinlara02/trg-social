import { useEffect, useMemo, useState } from 'react'
import { TrendingUp, Star, Users, MessageSquare } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { getTrends } from '../lib/live'

const TOOLTIP = { background: '#18181b', border: '1px solid #3f3f46', borderRadius: 12, color: '#e4e4e7', fontSize: 13 }
const fmtK = (n) => (n == null ? '–' : n >= 1000 ? (n / 1000).toFixed(1).replace('.0', '') + 'k' : `${n}`)
const fmtDay = (d) => { try { return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) } catch { return d } }

export default function Trends() {
  const [loading, setLoading] = useState(true)
  const [history, setHistory] = useState(null)

  useEffect(() => {
    let active = true
    getTrends().then((h) => { if (active) { setHistory(h); setLoading(false) } })
    return () => { active = false }
  }, [])

  const series = useMemo(() => {
    if (!history) return []
    return history.map((h) => {
      const rs = h.restaurants || []
      const rated = rs.filter((r) => r.rating != null)
      const avgRating = rated.length ? rated.reduce((s, r) => s + r.rating, 0) / rated.length : null
      const reviews = rs.reduce((s, r) => s + (r.reviews || 0), 0)
      const ig = rs.reduce((s, r) => s + (r.ig || 0), 0)
      const fb = rs.reduce((s, r) => s + (r.fb || 0), 0)
      return {
        date: h.date, label: fmtDay(h.date),
        avgRating: avgRating != null ? Number(avgRating.toFixed(2)) : null,
        reviews, ig, fb, followers: ig + fb,
      }
    })
  }, [history])

  const first = series[0]
  const last = series[series.length - 1]
  const delta = (key) => (first && last && first[key] != null && last[key] != null ? last[key] - first[key] : null)

  return (
    <div className="p-4 md:p-8 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-50">Trends</h1>
        <p className="text-zinc-500 mt-1">How your ratings and followers change over time.</p>
      </div>

      {loading ? (
        <p className="text-zinc-500 text-sm py-10 text-center">Loading trends…</p>
      ) : !history ? (
        <Unavailable />
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Kpi icon={Star} label="Avg Yelp Rating" value={last?.avgRating != null ? last.avgRating.toFixed(2) + '★' : '–'} delta={delta('avgRating')} fmt={(v) => v.toFixed(2)} />
            <Kpi icon={Users} label="Total Followers" value={fmtK(last?.followers)} delta={delta('followers')} fmt={fmtK} />
            <Kpi icon={MessageSquare} label="Total Reviews" value={last?.reviews != null ? last.reviews.toLocaleString('en-US') : '–'} delta={delta('reviews')} fmt={(v) => v.toLocaleString('en-US')} />
            <Kpi icon={TrendingUp} label="Days Tracked" value={`${series.length}`} />
          </div>

          {series.length < 2 ? (
            <Collecting first={first} />
          ) : (
            <div className="space-y-6">
              <ChartCard title="Followers over time">
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={series} margin={{ top: 8, right: 16, bottom: 0, left: -8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="label" stroke="#71717a" fontSize={12} />
                    <YAxis stroke="#71717a" fontSize={12} tickFormatter={fmtK} />
                    <Tooltip contentStyle={TOOLTIP} />
                    <Legend />
                    <Line type="monotone" dataKey="ig" name="Instagram" stroke="#e1306c" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="fb" name="Facebook" stroke="#1877f2" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Average Yelp rating over time">
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={series} margin={{ top: 8, right: 16, bottom: 0, left: -8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="label" stroke="#71717a" fontSize={12} />
                    <YAxis domain={[3, 5]} stroke="#71717a" fontSize={12} />
                    <Tooltip contentStyle={TOOLTIP} />
                    <Line type="monotone" dataKey="avgRating" name="Avg rating" stroke="#f59e0b" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Total reviews over time">
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={series} margin={{ top: 8, right: 16, bottom: 0, left: -8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="label" stroke="#71717a" fontSize={12} />
                    <YAxis stroke="#71717a" fontSize={12} />
                    <Tooltip contentStyle={TOOLTIP} />
                    <Line type="monotone" dataKey="reviews" name="Reviews" stroke="#10b981" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function Kpi({ icon: Icon, label, value, delta, fmt }) {
  const showDelta = delta != null && delta !== 0
  const up = delta > 0
  return (
    <div className="bg-[#101012] rounded-2xl border border-zinc-800 p-5">
      <div className="flex items-center gap-2 text-zinc-500 mb-1"><Icon className="w-4 h-4 shrink-0" /><span className="text-xs uppercase tracking-wide truncate">{label}</span></div>
      <p className="text-2xl font-bold text-zinc-50">{value}</p>
      {showDelta && <p className={`text-xs mt-1 ${up ? 'text-emerald-400' : 'text-red-400'}`}>{up ? '▲' : '▼'} {fmt ? fmt(Math.abs(delta)) : Math.abs(delta)} since tracking began</p>}
    </div>
  )
}

function ChartCard({ title, children }) {
  return (
    <section className="bg-[#101012] rounded-2xl border border-zinc-800 p-5">
      <h2 className="font-semibold text-zinc-100 mb-4">{title}</h2>
      {children}
    </section>
  )
}

function Collecting({ first }) {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 text-center">
      <TrendingUp className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
      <p className="font-medium text-zinc-200">Collecting data</p>
      <p className="text-sm text-zinc-500 mt-1">Trend charts appear once there are at least two days of history.{first ? ` First snapshot: ${fmtDay(first.date)}.` : ''} Check back tomorrow.</p>
    </div>
  )
}

function Unavailable() {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 text-center">
      <TrendingUp className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
      <p className="font-medium text-zinc-200">Trends aren't available right now</p>
      <p className="text-sm text-zinc-500 mt-1">This page records your real data daily on the deployed site.</p>
    </div>
  )
}
