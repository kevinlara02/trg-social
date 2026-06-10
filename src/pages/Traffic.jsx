import { useEffect, useState } from 'react'
import { Globe, Eye, MousePointerClick, Users, ArrowUp, ArrowDown, Info } from 'lucide-react'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { supabase, LOCATIONS, locationById } from '../lib/supabase'
import { PlatformIcon } from '../components/ui/Platform'

const SOURCE_COLOR = { Search: '#4285F4', Direct: '#a1a1aa', Social: '#E4405F', AI: '#C2A35E' }

function k(n) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + 'k'
  return `${n}`
}

export default function Traffic() {
  const [loading, setLoading] = useState(true)
  const [web, setWeb] = useState([])
  const [sources, setSources] = useState([])
  const [social, setSocial] = useState([])

  useEffect(() => {
    let active = true
    ;(async () => {
      setLoading(true)
      try {
        const [w, s, so] = await Promise.all([
          supabase.from('web_traffic').select('id, location_id, visits, prev'),
          supabase.from('web_sources').select('id, source, visits'),
          supabase.from('social_traffic').select('id, location_id, platform, profile_visits, reach, followers'),
        ])
        if (!active) return
        setWeb(w.data || [])
        setSources(s.data || [])
        setSocial(so.data || [])
      } catch { if (active) { setWeb([]); setSources([]); setSocial([]) } }
      finally { if (active) setLoading(false) }
    })()
    return () => { active = false }
  }, [])

  const webVisits = web.reduce((s, r) => s + r.visits, 0)
  const reach = social.reduce((s, r) => s + r.reach, 0)
  const profileVisits = social.reduce((s, r) => s + r.profile_visits, 0)
  const followers = social.reduce((s, r) => s + r.followers, 0)
  const maxWeb = Math.max(1, ...web.map((r) => r.visits))
  const maxSource = Math.max(1, ...sources.map((r) => r.visits))

  if (loading) return <div className="p-4 md:p-8 max-w-5xl"><h1 className="text-2xl font-bold text-zinc-50 mb-6">Traffic</h1><p className="text-zinc-500 text-sm">Loading…</p></div>

  return (
    <div className="p-4 md:p-8 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-50">Traffic</h1>
        <p className="text-zinc-500 mt-1">Visits to your websites and social profiles.</p>
      </div>

      <div className="bg-sky-500/10 border border-sky-500/20 rounded-2xl p-4 mb-6 flex gap-3">
        <Info className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium text-sky-100">Where this comes from.</p>
          <p className="text-sky-200/70 mt-0.5">Website visits come from your Squarespace / Google analytics; social reach and profile visits come from each restaurant's Facebook and Instagram insights. Sample data shown until those are connected.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Kpi icon={Globe} label="Website Visits" value={k(webVisits)} />
        <Kpi icon={Eye} label="Social Reach" value={k(reach)} />
        <Kpi icon={MousePointerClick} label="Profile Visits" value={k(profileVisits)} />
        <Kpi icon={Users} label="Followers" value={k(followers)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Website visits by restaurant" subtitle="This month">
          <ResponsiveContainer width="100%" height={220} minHeight={220}>
            <BarChart data={web.map((r) => ({ name: locationById(r.location_id)?.name || 'Unknown', visits: r.visits, prev: r.prev }))} margin={{ left: -20, right: 0, top: 5, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="name" stroke="#71717a" style={{ fontSize: '10px' }} angle={-45} textAnchor="end" height={70} tick={{ fontSize: 9 }} />
              <YAxis stroke="#71717a" style={{ fontSize: '11px' }} tick={{ fontSize: 10 }} width={30} />
              <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', color: '#fafafa', fontSize: '11px' }} formatter={(value) => k(value)} />
              <Bar dataKey="visits" fill="#71717a" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Website traffic sources" subtitle="All restaurants">
          <ResponsiveContainer width="100%" height={220} minHeight={220}>
            <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <Pie data={sources.map((s) => ({ name: s.source === 'AI' ? 'AI' : s.source, value: s.visits, fill: SOURCE_COLOR[s.source] || '#a1a1aa' }))} cx="50%" cy="50%" labelLine={false} label={(entry) => `${k(entry.value)}`} outerRadius={65} dataKey="value">
                {sources.map((s, index) => (
                  <Cell key={`cell-${index}`} fill={SOURCE_COLOR[s.source] || '#a1a1aa'} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', color: '#fafafa', fontSize: '11px' }} formatter={(value) => k(value)} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card title="Social profile activity by restaurant" subtitle="Reach and profile visits, this month" className="mt-4">
        <div className="space-y-2">
          {LOCATIONS.map((l) => {
            const fb = social.find((s) => s.location_id === l.id && s.platform === 'facebook')
            const ig = social.find((s) => s.location_id === l.id && s.platform === 'instagram')
            return (
              <div key={l.id} className="flex items-center gap-3 flex-wrap rounded-xl border border-zinc-800 bg-[#0c0c0e] px-3 py-2.5">
                <span className="text-sm text-zinc-200 flex items-center gap-2 w-44 shrink-0">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: l.color }} />{l.name}
                </span>
                <SocialChip platform="facebook" data={fb} />
                <SocialChip platform="instagram" data={ig} />
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}

function SocialChip({ platform, data }) {
  if (!data) return <span className="inline-flex items-center gap-1.5 text-xs text-zinc-600"><PlatformIcon platform={platform} size="sm" /> not connected</span>
  return (
    <span className="inline-flex items-center gap-2 text-xs text-zinc-400">
      <PlatformIcon platform={platform} size="sm" />
      <span><span className="text-zinc-200 font-medium">{k(data.reach)}</span> reach</span>
      <span className="text-zinc-600">·</span>
      <span><span className="text-zinc-200 font-medium">{k(data.profile_visits)}</span> visits</span>
    </span>
  )
}

function Kpi({ icon: Icon, label, value }) {
  return (
    <div className="bg-[#101012] rounded-2xl border border-zinc-800 p-5 flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-accent-500/10 text-accent-400">
        <Icon className="w-6 h-6" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-zinc-50">{value}</p>
        <p className="text-sm text-zinc-500 truncate">{label}</p>
      </div>
    </div>
  )
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
