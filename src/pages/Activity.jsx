import { useEffect, useState } from 'react'
import { supabase, locationName } from '../lib/supabase'
import { LocationDot } from '../components/ui/Location'
import { fmt } from '../lib/datefmt'

function initials(name = '') {
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
}

export default function Activity() {
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState([])

  useEffect(() => {
    let active = true
    ;(async () => {
      setLoading(true)
      try {
        const { data } = await supabase.from('activity')
          .select('id, actor, action, target, location_id, at')
          .order('at', { ascending: false })
        if (active) setItems(data || [])
      } catch { if (active) setItems([]) }
      finally { if (active) setLoading(false) }
    })()
    return () => { active = false }
  }, [])

  return (
    <div className="p-4 md:p-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-50">Activity</h1>
        <p className="text-zinc-500 mt-1">Who replied to what, and when.</p>
      </div>

      {loading ? (
        <p className="text-zinc-500 text-sm py-10 text-center">Loading…</p>
      ) : items.length === 0 ? (
        <div className="bg-[#101012] rounded-2xl border border-zinc-800 p-10 text-center text-zinc-500 text-sm">No activity yet.</div>
      ) : (
        <div className="bg-[#101012] rounded-2xl border border-zinc-800 divide-y divide-zinc-800/70">
          {items.map((a) => (
            <div key={a.id} className="flex items-center gap-3 px-4 sm:px-5 py-3">
              <div className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-300 flex items-center justify-center text-xs font-bold shrink-0">{initials(a.actor)}</div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-zinc-200">
                  <span className="font-medium text-zinc-100">{a.actor}</span> {a.action}
                  {a.target ? <span className="text-zinc-400"> · {a.target}</span> : null}
                </p>
                {a.location_id ? (
                  <p className="text-xs text-zinc-500 flex items-center gap-1.5 mt-0.5"><LocationDot id={a.location_id} />{locationName(a.location_id)}</p>
                ) : null}
              </div>
              <span className="text-xs text-zinc-600 shrink-0">{fmt(a.at)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
