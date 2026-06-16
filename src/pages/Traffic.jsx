import { useEffect, useState } from 'react'
import { Users, Image, AtSign, ThumbsUp } from 'lucide-react'
import { LOCATIONS } from '../lib/supabase'
import { PlatformIcon } from '../components/ui/Platform'
import { LastUpdated } from '../components/ui/LastUpdated'
import { KpiSkeleton, ListSkeleton } from '../components/ui/Skeleton'
import { getLiveSocial } from '../lib/live'

function k(n) {
  if (n == null) return '–'
  if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + 'k'
  return `${n}`
}

export default function Traffic() {
  const [loading, setLoading] = useState(true)
  const [live, setLive] = useState(null) // real Instagram data, or null
  const [updatedAt, setUpdatedAt] = useState(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true)
    getLiveSocial().then((rows) => { if (active) { setLive(rows); setUpdatedAt(Date.now()); setLoading(false) } })
    return () => { active = false }
  }, [tick])

  const liveByCode = live ? Object.fromEntries(live.map((r) => [r.code, r])) : null
  const totalFollowers = live ? live.reduce((s, r) => s + (r.ig_followers || 0), 0) : 0
  const totalFbFollowers = live ? live.reduce((s, r) => s + (r.fb_followers || 0), 0) : 0
  const accountsConnected = live ? live.filter((r) => r.ig_handle).length : 0

  return (
    <div className="p-4 md:p-8 max-w-5xl">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-50">Traffic</h1>
          <p className="text-zinc-500 mt-1">Live social profile stats from your Instagram accounts.</p>
        </div>
        <div className="pt-1"><LastUpdated at={updatedAt} loading={loading} onRefresh={() => setTick((t) => t + 1)} /></div>
      </div>

      {loading && !live ? (
        <><KpiSkeleton count={3} /><ListSkeleton rows={7} /></>
      ) : !live ? (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 text-center">
          <Image className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
          <p className="font-medium text-zinc-200">Live data isn't available right now</p>
          <p className="text-sm text-zinc-500 mt-1 max-w-md mx-auto">Instagram stats show here on the live site. Website traffic and reach will appear once Google Analytics is connected.</p>
        </div>
      ) : (
        <>
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 mb-6 flex gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0 mt-1.5 animate-pulse" />
            <div className="text-sm">
              <p className="font-medium text-emerald-100">Live from your Instagram & Facebook accounts.</p>
              <p className="text-emerald-200/70 mt-0.5">Follower counts come straight from each restaurant's Instagram and Facebook. Website traffic and reach will appear here once Google Analytics is connected.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <Kpi icon={Users} label="Instagram Followers" value={k(totalFollowers)} />
            <Kpi icon={ThumbsUp} label="Facebook Followers" value={k(totalFbFollowers)} />
            <Kpi icon={AtSign} label="Accounts Connected" value={`${accountsConnected}`} />
          </div>

          <Card title="Followers by restaurant" subtitle="Live from your Instagram & Facebook accounts" badge="LIVE">
            <div className="space-y-2">
              {LOCATIONS.map((l) => {
                const lv = liveByCode ? liveByCode[l.code] : null
                return (
                  <div key={l.id} className="flex items-center gap-3 flex-wrap rounded-xl border border-zinc-800 bg-[#0c0c0e] px-3 py-2.5" style={{ borderLeftWidth: '4px', borderLeftColor: l.color }}>
                    <span className="text-sm font-medium text-zinc-100 flex items-center gap-2 w-44 shrink-0">
                      <span className="w-3 h-3 rounded-full" style={{ background: l.color }} />{l.name}
                    </span>
                    {lv ? (
                      <span className="inline-flex items-center gap-2 text-xs text-zinc-400 flex-wrap">
                        <PlatformIcon platform="instagram" size="sm" />
                        {lv.ig_handle && <span className="text-zinc-300">@{lv.ig_handle}</span>}
                        <span><span className="text-zinc-50 font-semibold">{k(lv.ig_followers)}</span> followers</span>
                        <span className="text-zinc-600">·</span>
                        <span><span className="text-zinc-200 font-medium">{lv.ig_posts ?? '–'}</span> posts</span>
                        {lv.last_post?.date && (<><span className="text-zinc-600">·</span><span>last post {lv.last_post.date.slice(0, 10)}</span></>)}
                        {lv.fb_followers != null && (<><span className="text-zinc-600">·</span><PlatformIcon platform="facebook" size="sm" /><span><span className="text-zinc-200 font-medium">{k(lv.fb_followers)}</span> FB</span></>)}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs text-zinc-600"><PlatformIcon platform="instagram" size="sm" /> not connected</span>
                    )}
                  </div>
                )
              })}
            </div>
          </Card>
        </>
      )}
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
        <p className="text-2xl font-bold text-zinc-50 flex items-center gap-2">
          {value}
          <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-400 bg-emerald-500/10 rounded px-1.5 py-0.5">Live</span>
        </p>
        <p className="text-sm text-zinc-500 truncate">{label}</p>
      </div>
    </div>
  )
}

function Card({ title, subtitle, children, className = '', badge = null }) {
  return (
    <section className={`bg-[#101012] rounded-2xl border border-zinc-800 overflow-hidden ${className}`}>
      <div className="px-5 py-4 border-b border-zinc-800 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-zinc-100">{title}</h2>
          {subtitle && <p className="text-xs text-zinc-500 mt-0.5">{subtitle}</p>}
        </div>
        {badge && <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-400 bg-emerald-500/10 rounded px-2 py-1 shrink-0">{badge}</span>}
      </div>
      <div className="p-5">{children}</div>
    </section>
  )
}
