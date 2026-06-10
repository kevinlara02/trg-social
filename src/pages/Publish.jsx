import { useEffect, useState } from 'react'
import { Send, Plus, CalendarClock, Image as ImageIcon, List, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval,
  addMonths, format, isSameDay, isSameMonth, isToday,
} from 'date-fns'
import { supabase, LOCATIONS, publishPlatforms, locationName, locationById } from '../lib/supabase'
import { DEMO, demoInsert, logActivity } from '../lib/demo'
import { PlatformIcon } from '../components/ui/Platform'
import { PostStatusBadge } from '../components/ui/Badge'
import { LocationDot } from '../components/ui/Location'
import { Modal } from '../components/ui/Modal'
import { fmt } from '../lib/datefmt'

const STATUS_COLOR = { scheduled: '#fbbf24', published: '#34d399', draft: '#a1a1aa', failed: '#f87171' }

// "Story Whittier" or "Story Whittier +2" for multi-location posts.
function postLocationLabel(post) {
  const ids = [...new Set((post.targets || []).map((t) => t.location_id))]
  if (ids.length === 0) return { label: '', color: '#a1a1aa' }
  const first = locationById(ids[0])
  const label = (first?.name || '') + (ids.length > 1 ? ` +${ids.length - 1}` : '')
  return { label, color: first?.color || '#a1a1aa', ids }
}

export default function Publish() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [view, setView] = useState('calendar')
  const [loc, setLoc] = useState(null)
  const [statusFilter, setStatusFilter] = useState(null)

  useEffect(() => {
    let active = true
    ;(async () => {
      setLoading(true)
      try {
        const { data } = await supabase.from('posts')
          .select('id, caption, status, scheduled_at, published_at, targets')
          .order('id', { ascending: false })
        if (active) setPosts(data || [])
      } catch { if (active) setPosts([]) }
      finally { if (active) setLoading(false) }
    })()
    return () => { active = false }
  }, [])

  const filtered = posts.filter((p) =>
    (!loc || (p.targets || []).some((t) => t.location_id === loc)) &&
    (!statusFilter || p.status === statusFilter)
  )

  function addPost(post) {
    let created = post
    if (DEMO) {
      created = demoInsert('posts', post)
      const { label } = postLocationLabel(post)
      logActivity({ action: `${post.status === 'scheduled' ? 'scheduled' : post.status === 'published' ? 'published' : 'drafted'} a post`, target: label, location_id: (post.targets || [])[0]?.location_id })
    } else {
      supabase.from('posts').insert(post)
    }
    setPosts((ps) => [created, ...ps])
    setOpen(false)
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h1 className="text-2xl font-bold text-zinc-50">Publish</h1>
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-zinc-800 overflow-hidden">
            <ViewBtn active={view === 'calendar'} onClick={() => setView('calendar')}><CalendarDays className="w-4 h-4" /> Calendar</ViewBtn>
            <ViewBtn active={view === 'list'} onClick={() => setView('list')}><List className="w-4 h-4" /> List</ViewBtn>
          </div>
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 bg-accent-500 hover:bg-accent-400 text-zinc-950 text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" /> New Post
          </button>
        </div>
      </div>

      {/* Filters: pick a restaurant + status to see its posts per network */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <select
          value={loc || ''}
          onChange={(e) => setLoc(e.target.value ? Number(e.target.value) : null)}
          className="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-sm text-zinc-200"
        >
          <option value="">All restaurants</option>
          {LOCATIONS.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
        <div className="flex items-center gap-2 flex-wrap">
          <StatusChip active={statusFilter === null} onClick={() => setStatusFilter(null)}>All</StatusChip>
          <StatusChip active={statusFilter === 'published'} onClick={() => setStatusFilter('published')}>Published</StatusChip>
          <StatusChip active={statusFilter === 'scheduled'} onClick={() => setStatusFilter('scheduled')}>Scheduled</StatusChip>
          <StatusChip active={statusFilter === 'draft'} onClick={() => setStatusFilter('draft')}>Drafts</StatusChip>
        </div>
      </div>

      {loading ? (
        <p className="text-zinc-500 text-sm py-10 text-center">Loading…</p>
      ) : view === 'calendar' ? (
        <CalendarView posts={filtered} />
      ) : filtered.length === 0 ? (
        <div className="bg-[#101012] rounded-2xl border border-zinc-800 p-10 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-zinc-800 rounded-xl mb-3">
            <ImageIcon className="w-6 h-6 text-zinc-400" />
          </div>
          <p className="text-zinc-100 font-medium">No posts here</p>
          <p className="text-zinc-500 text-sm mt-1">Try a different filter, or tap "New Post" to create one.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((p) => <PostCard key={p.id} post={p} />)}
        </div>
      )}

      <Composer open={open} onClose={() => setOpen(false)} onCreate={addPost} />
    </div>
  )
}

function ViewBtn({ active, onClick, children }) {
  return (
    <button onClick={onClick} className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${active ? 'bg-zinc-800 text-zinc-50' : 'bg-[#101012] text-zinc-400 hover:bg-zinc-900'}`}>
      {children}
    </button>
  )
}

function StatusChip({ active, onClick, children }) {
  return (
    <button onClick={onClick} className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${active ? 'bg-accent-500 text-zinc-950 border-accent-500' : 'bg-[#101012] text-zinc-400 border-zinc-800 hover:bg-zinc-900'}`}>
      {children}
    </button>
  )
}

function CalendarView({ posts }) {
  const dated = posts.filter((p) => p.scheduled_at || p.published_at)
  const [cursor, setCursor] = useState(() => {
    const sched = posts.filter((p) => p.scheduled_at).map((p) => new Date(p.scheduled_at)).sort((a, b) => a - b)
    return startOfMonth(sched[0] || new Date())
  })

  const days = eachDayOfInterval({ start: startOfWeek(startOfMonth(cursor)), end: endOfWeek(endOfMonth(cursor)) })
  const postsOn = (day) => dated.filter((p) => isSameDay(new Date(p.scheduled_at || p.published_at), day))
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="bg-[#101012] rounded-2xl border border-zinc-800 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <h2 className="font-semibold text-zinc-100">{format(cursor, 'MMMM yyyy')}</h2>
        <div className="flex items-center gap-1">
          <button onClick={() => setCursor(addMonths(cursor, -1))} className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-800"><ChevronLeft className="w-4 h-4" /></button>
          <button onClick={() => setCursor(startOfMonth(new Date()))} className="px-2.5 py-1 rounded-lg text-xs font-medium text-zinc-300 hover:bg-zinc-800">Today</button>
          <button onClick={() => setCursor(addMonths(cursor, 1))} className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-800"><ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-zinc-800">
        {weekdays.map((d) => (
          <div key={d} className="px-2 py-2 text-center text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const inMonth = isSameMonth(day, cursor)
          const dayPosts = postsOn(day)
          return (
            <div key={i} className={`min-h-[96px] border-b border-r border-zinc-800/70 p-1.5 ${inMonth ? '' : 'bg-zinc-950/40'}`}>
              <div className={`text-xs mb-1 inline-flex items-center justify-center w-6 h-6 rounded-full ${isToday(day) ? 'bg-accent-500 text-zinc-950 font-bold' : inMonth ? 'text-zinc-400' : 'text-zinc-700'}`}>
                {format(day, 'd')}
              </div>
              <div className="space-y-1">
                {dayPosts.slice(0, 3).map((p) => {
                  const sc = STATUS_COLOR[p.status] || '#a1a1aa'
                  const { label, color } = postLocationLabel(p)
                  return (
                    <div
                      key={p.id}
                      title={`${label} — ${p.caption} (${p.status})`}
                      className="text-[10px] leading-tight rounded px-1.5 py-1 truncate"
                      style={{ background: `${sc}22`, borderLeft: `2px solid ${sc}` }}
                    >
                      <span className="font-semibold" style={{ color }}>{label}</span>
                      {p.caption ? <span className="text-zinc-400"> {p.caption}</span> : null}
                    </div>
                  )
                })}
                {dayPosts.length > 3 && <div className="text-[10px] text-zinc-500 px-1">+{dayPosts.length - 3} more</div>}
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex items-center gap-4 px-4 py-3 text-xs text-zinc-500">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: STATUS_COLOR.scheduled }} /> Scheduled</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: STATUS_COLOR.published }} /> Published</span>
        <span className="text-zinc-600">Each entry shows the restaurant it's for.</span>
      </div>
    </div>
  )
}

function PostCard({ post }) {
  const ids = [...new Set((post.targets || []).map((t) => t.location_id))]
  const plats = [...new Set((post.targets || []).map((t) => t.platform))]
  const when = post.status === 'scheduled' ? post.scheduled_at : post.published_at
  const names = ids.map((id) => locationName(id))
  const locLabel = names.length <= 2 ? names.join(', ') : `${names[0]}, ${names[1]} +${names.length - 2}`

  return (
    <div className="bg-[#101012] rounded-2xl border border-zinc-800 p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-zinc-200 flex-1">{post.caption}</p>
        <PostStatusBadge status={post.status} />
      </div>
      <div className="flex items-center justify-between gap-3 mt-3 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs text-zinc-300 flex items-center gap-1.5">
            <LocationDot id={ids[0]} /> {locLabel}
          </span>
          <span className="flex items-center gap-1">{plats.map((k) => <PlatformIcon key={k} platform={k} size="sm" />)}</span>
        </div>
        {when && (
          <span className="text-xs text-zinc-500 flex items-center gap-1.5">
            <CalendarClock className="w-3.5 h-3.5" />
            {post.status === 'scheduled' ? 'Scheduled ' : 'Published '}{fmt(when)}
          </span>
        )}
      </div>
    </div>
  )
}

function Composer({ open, onClose, onCreate }) {
  const [caption, setCaption] = useState('')
  const [locs, setLocs] = useState([])
  const [plats, setPlats] = useState([])
  const [when, setWhen] = useState('')

  function reset() { setCaption(''); setLocs([]); setPlats([]); setWhen('') }
  function toggle(list, setList, v) {
    setList(list.includes(v) ? list.filter((x) => x !== v) : [...list, v])
  }

  const valid = caption.trim() && locs.length && plats.length

  function submit(forceDraft) {
    if (!valid) return
    const targets = locs.flatMap((l) => plats.map((p) => ({ location_id: l, platform: p })))
    const status = forceDraft ? 'draft' : (when ? 'scheduled' : 'published')
    const post = {
      caption: caption.trim(),
      status,
      scheduled_at: status === 'scheduled' && when ? new Date(when).toISOString() : null,
      published_at: status === 'published' ? new Date().toISOString() : null,
      targets,
    }
    onCreate(post)
    reset()
  }

  return (
    <Modal open={open} onClose={() => { onClose(); reset() }} title="New Post" size="lg">
      <div className="space-y-5">
        <div>
          <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Caption</label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={3}
            placeholder="What do you want to share?"
            className="w-full rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder-zinc-600 text-sm p-3 focus:outline-none focus:ring-2 focus:ring-accent-500/40 focus:border-accent-500/50"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Post to</label>
          <div className="flex flex-wrap gap-2">
            {LOCATIONS.map((l) => {
              const on = locs.includes(l.id)
              return (
                <button key={l.id} onClick={() => toggle(locs, setLocs, l.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    on ? 'bg-zinc-800 text-zinc-50 border-zinc-600' : 'bg-[#101012] text-zinc-400 border-zinc-800 hover:bg-zinc-900'
                  }`}>
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: l.color }} />
                  {l.name}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Platforms</label>
          <div className="flex flex-wrap gap-2">
            {publishPlatforms().map((p) => {
              const on = plats.includes(p.key)
              return (
                <button key={p.key} onClick={() => toggle(plats, setPlats, p.key)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    on ? 'bg-zinc-800 text-zinc-50 border-zinc-600' : 'bg-[#101012] text-zinc-400 border-zinc-800 hover:bg-zinc-900'
                  }`}>
                  <PlatformIcon platform={p.key} size="sm" /> {p.name}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Schedule for (optional)</label>
          <input
            type="datetime-local"
            value={when}
            onChange={(e) => setWhen(e.target.value)}
            className="rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-100 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-500/40"
          />
          <p className="text-xs text-zinc-600 mt-1">Leave empty to publish right away.</p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
          <button onClick={() => submit(true)} disabled={!valid}
            className="text-sm font-medium text-zinc-300 hover:bg-zinc-800 disabled:opacity-40 px-4 py-2 rounded-lg">
            Save draft
          </button>
          <button onClick={() => submit(false)} disabled={!valid}
            className="inline-flex items-center gap-1.5 bg-accent-500 hover:bg-accent-400 disabled:opacity-40 text-zinc-950 text-sm font-semibold px-4 py-2 rounded-lg">
            <Send className="w-4 h-4" /> {when ? 'Schedule' : 'Publish now'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
