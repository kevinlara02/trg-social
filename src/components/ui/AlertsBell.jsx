import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, AlertTriangle } from 'lucide-react'
import { supabase, locationName } from '../../lib/supabase'
import { StarRating } from './Badge'
import { Modal } from './Modal'

const EMAIL_KEY = 'trg_alert_email'
const ENABLED_KEY = 'trg_alert_enabled'

// Bell + dropdown that flags unanswered 1 to 2 star reviews, plus an email-only
// alert setting. Lives in the sidebar header.
export function AlertsBell() {
  const [open, setOpen] = useState(false)
  const [alerts, setAlerts] = useState([])
  const [enabled, setEnabled] = useState(() => localStorage.getItem(ENABLED_KEY) !== 'false')
  const [email, setEmail] = useState(() => localStorage.getItem(EMAIL_KEY) || 'kevin@toastrestaurantgroup.com')

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const { data } = await supabase.from('reviews')
          .select('id, location_id, platform, author_name, rating, body, status, review_date')
          .order('review_date', { ascending: false })
        if (active) setAlerts((data || []).filter((r) => r.rating && r.rating <= 2 && r.status === 'new'))
      } catch { if (active) setAlerts([]) }
    })()
    return () => { active = false }
  }, [])

  function saveEmail(v) { setEmail(v); localStorage.setItem(EMAIL_KEY, v) }
  function toggle() { const v = !enabled; setEnabled(v); localStorage.setItem(ENABLED_KEY, String(v)) }

  return (
    <>
      <button onClick={() => setOpen(true)} className="relative p-2 rounded-lg text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100 transition-colors" title="Alerts">
        <Bell className="w-5 h-5" />
        {alerts.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">{alerts.length}</span>
        )}
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Alerts">
        <div className="space-y-4">
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 flex gap-2.5">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-red-200">{alerts.length} negative review{alerts.length === 1 ? '' : 's'} {alerts.length === 1 ? 'needs' : 'need'} attention</p>
              <p className="text-red-200/70 mt-0.5 text-xs">1 or 2 star reviews that haven't been answered yet.</p>
            </div>
          </div>

          {alerts.length === 0 ? (
            <p className="text-sm text-zinc-500 text-center py-2">Nothing urgent right now. 🎉</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {alerts.map((a) => (
                <div key={a.id} className="rounded-xl border border-zinc-800 bg-[#0c0c0e] p-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-zinc-100">{a.author_name || 'Guest'}</span>
                    <StarRating rating={a.rating} />
                    <span className="text-xs text-zinc-500">{locationName(a.location_id)}</span>
                  </div>
                  {a.body && <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{a.body}</p>}
                </div>
              ))}
            </div>
          )}

          <Link to="/reviews" onClick={() => setOpen(false)} className="block text-center bg-accent-500 hover:bg-accent-400 text-zinc-950 text-sm font-semibold py-2.5 rounded-xl transition-colors">
            Review and reply
          </Link>

          <div className="border-t border-zinc-800 pt-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-zinc-200">Email me about 1 to 2 star reviews</span>
              <button type="button" onClick={toggle} aria-pressed={enabled} className={`w-10 h-6 rounded-full transition-colors relative shrink-0 ${enabled ? 'bg-accent-500' : 'bg-zinc-700'}`}>
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${enabled ? 'left-[18px]' : 'left-0.5'}`} />
              </button>
            </div>
            <input value={email} onChange={(e) => saveEmail(e.target.value)} disabled={!enabled} placeholder="you@email.com"
              className="mt-2 w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder-zinc-600 text-sm disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-accent-500/40" />
            <p className="text-xs text-zinc-600 mt-1.5">Email only, no text messages. Sent the moment a low review arrives.</p>
          </div>
        </div>
      </Modal>
    </>
  )
}
