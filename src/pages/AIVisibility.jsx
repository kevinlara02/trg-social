import { useEffect, useState } from 'react'
import { Sparkles, TrendingUp, MousePointerClick, Bot, Check, Info } from 'lucide-react'
import { supabase, locationName } from '../lib/supabase'
import { LocationDot } from '../components/ui/Location'

const ENGINE_COLOR = { ChatGPT: '#10A37F', Claude: '#CC785C', Gemini: '#4285F4', Perplexity: '#20808D', Copilot: '#0078D4' }
const color = (engine) => ENGINE_COLOR[engine] || '#a1a1aa'

export default function AIVisibility() {
  const [loading, setLoading] = useState(true)
  const [checks, setChecks] = useState([])
  const [referrals, setReferrals] = useState([])

  useEffect(() => {
    let active = true
    ;(async () => {
      setLoading(true)
      try {
        const [c, r] = await Promise.all([
          supabase.from('ai_checks').select('id, prompt, results'),
          supabase.from('ai_referrals').select('id, source, visits'),
        ])
        if (!active) return
        setChecks(c.data || [])
        setReferrals(r.data || [])
      } catch { if (active) { setChecks([]); setReferrals([]) } }
      finally { if (active) setLoading(false) }
    })()
    return () => { active = false }
  }, [])

  const cells = checks.flatMap((c) => c.results || [])
  const mentioned = cells.filter((r) => r.mentioned).length
  const shareOfVoice = cells.length ? Math.round((mentioned / cells.length) * 100) : 0
  const visits = referrals.reduce((s, r) => s + (r.visits || 0), 0)
  const enginesTracked = new Set(cells.map((r) => r.engine)).size
  const maxVisits = Math.max(1, ...referrals.map((r) => r.visits || 0))

  if (loading) return <div className="p-4 md:p-8 max-w-5xl"><h1 className="text-2xl font-bold text-zinc-50 mb-6">AI Visibility</h1><p className="text-zinc-500 text-sm">Loading…</p></div>

  return (
    <div className="p-4 md:p-8 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-50">AI Visibility</h1>
        <p className="text-zinc-500 mt-1">How often AI assistants find and recommend your restaurants.</p>
      </div>

      <div className="bg-sky-500/10 border border-sky-500/20 rounded-2xl p-4 mb-6 flex gap-3">
        <Info className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium text-sky-100">AI assistants don't publish official stats, so we measure this two ways.</p>
          <p className="text-sky-200/70 mt-0.5">1) Visits to your website that came from AI tools (real, from your Squarespace / Google analytics). 2) We ask the assistants common local questions and check whether you come up (powered by Claude). Sample data shown.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Kpi icon={Sparkles} label="AI Mentions" value={mentioned} />
        <Kpi icon={TrendingUp} label="Share of Voice" value={`${shareOfVoice}%`} />
        <Kpi icon={MousePointerClick} label="Visits from AI" value={visits} />
        <Kpi icon={Bot} label="Assistants Tracked" value={enginesTracked} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <section className="lg:col-span-2 bg-[#101012] rounded-2xl border border-zinc-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-800">
            <h2 className="font-semibold text-zinc-100">Are AI assistants recommending you?</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Common things people ask, and which assistant named one of your restaurants.</p>
          </div>
          <div className="p-4 space-y-3">
            {checks.map((c) => (
              <div key={c.id} className="rounded-xl border border-zinc-800 bg-[#0c0c0e] p-3">
                <p className="text-sm font-medium text-zinc-200 mb-2">"{c.prompt}"</p>
                <div className="flex flex-wrap gap-2">
                  {(c.results || []).map((r) => (
                    <span
                      key={r.engine}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border"
                      style={{ borderColor: r.mentioned ? `${color(r.engine)}66` : '#27272a', background: r.mentioned ? `${color(r.engine)}1a` : 'transparent' }}
                    >
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color(r.engine) }} />
                      <span className="text-zinc-300">{r.engine}</span>
                      {r.mentioned ? (
                        <span className="inline-flex items-center gap-1 text-accent-400 font-medium">
                          <Check className="w-3 h-3" /> {locationName(r.location_id)}
                        </span>
                      ) : (
                        <span className="text-zinc-600">not shown</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-[#101012] rounded-2xl border border-zinc-800 overflow-hidden h-fit">
          <div className="px-5 py-4 border-b border-zinc-800">
            <h2 className="font-semibold text-zinc-100">Visits from AI tools</h2>
            <p className="text-xs text-zinc-500 mt-0.5">This month</p>
          </div>
          <div className="p-5 space-y-3">
            {referrals.map((r) => (
              <div key={r.id}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-zinc-300 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: color(r.source) }} />{r.source}
                  </span>
                  <span className="text-zinc-200 font-medium tabular-nums">{r.visits}</span>
                </div>
                <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${(r.visits / maxVisits) * 100}%`, background: color(r.source) }} />
                </div>
              </div>
            ))}
            <p className="text-xs text-zinc-600 pt-1">AI-referred visitors often convert higher than regular search.</p>
          </div>
        </section>
      </div>
    </div>
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
