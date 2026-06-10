import { useEffect, useState } from 'react'
import { UserPlus } from 'lucide-react'
import { supabase, LOCATIONS, ROLES, locationName } from '../lib/supabase'
import { Pill } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'

const ROLE_COLOR = { admin: 'purple', manager: 'blue', staff: 'gray' }
const ROLE_LABEL = { admin: 'Administrator', manager: 'Manager', staff: 'Staff' }

function initials(name = '') {
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
}

export default function Users() {
  const [loading, setLoading] = useState(true)
  const [members, setMembers] = useState([])
  const [inviteOpen, setInviteOpen] = useState(false)

  useEffect(() => {
    let active = true
    ;(async () => {
      setLoading(true)
      try {
        const { data } = await supabase.from('profiles').select('id, full_name, email, role, location_id, active')
        if (active) setMembers(data || [])
      } catch { if (active) setMembers([]) }
      finally { if (active) setLoading(false) }
    })()
    return () => { active = false }
  }, [])

  return (
    <div className="p-4 md:p-8 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-50">Users</h1>
          <p className="text-zinc-500 mt-1">Your team and who can access each restaurant.</p>
        </div>
        <button
          onClick={() => setInviteOpen(true)}
          className="inline-flex items-center gap-2 bg-accent-500 hover:bg-accent-400 text-zinc-950 text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
        >
          <UserPlus className="w-4 h-4" /> Invite user
        </button>
      </div>

      {loading ? (
        <p className="text-zinc-500 text-sm py-10 text-center">Loading…</p>
      ) : (
        <div className="bg-[#101012] rounded-2xl border border-zinc-800 divide-y divide-zinc-800/70">
          {members.map((m) => (
            <div key={m.id} className="flex items-center gap-3 px-4 sm:px-5 py-3">
              <div className="w-9 h-9 rounded-full bg-zinc-800 text-zinc-300 flex items-center justify-center text-xs font-bold shrink-0">
                {initials(m.full_name)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-zinc-100 truncate">{m.full_name}</p>
                <p className="text-xs text-zinc-500 truncate">{m.email}</p>
              </div>
              <div className="hidden sm:block text-sm text-zinc-400 w-40 truncate">
                {m.location_id ? locationName(m.location_id) : 'All locations'}
              </div>
              <Pill color={ROLE_COLOR[m.role] || 'gray'}>{ROLE_LABEL[m.role] || m.role}</Pill>
              <span className="ml-2 inline-flex items-center gap-1.5 text-xs text-zinc-500 w-16 justify-end">
                <span className={`w-2 h-2 rounded-full ${m.active ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
                {m.active ? 'Active' : 'Off'}
              </span>
            </div>
          ))}
        </div>
      )}

      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite a user">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Email</label>
            <input type="email" placeholder="name@trg.com" className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder-zinc-600 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500/40" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Role</label>
              <select className="w-full px-3 py-3 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-200 text-sm">
                {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Location</label>
              <select className="w-full px-3 py-3 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-200 text-sm">
                <option value="">All locations</option>
                {LOCATIONS.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
          </div>
          <button onClick={() => setInviteOpen(false)} className="w-full bg-accent-500 hover:bg-accent-400 text-zinc-950 font-semibold py-3 rounded-xl text-sm">
            Send invite
          </button>
        </div>
      </Modal>
    </div>
  )
}
