import { useEffect, useState } from 'react'
import { Send, Plus, Image as ImageIcon, List, CalendarDays, ChevronLeft, ChevronRight, Loader2, Check } from 'lucide-react'
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval,
  addMonths, format, isSameDay, isSameMonth, isToday,
} from 'date-fns'
import { LOCATIONS } from '../lib/supabase'
import { PlatformIcon } from '../components/ui/Platform'
import { Modal } from '../components/ui/Modal'
import { LastUpdated } from '../components/ui/LastUpdated'
import { fmt } from '../lib/datefmt'
import { getPublishedPosts, uploadMedia, publishPost, recordPost } from '../lib/live'

const locByCode = (code) => LOCATIONS.find((l) => l.code === code)
const NETWORKS = [{ key: 'instagram', name: 'Instagram' }, { key: 'facebook', name: 'Facebook' }]

export default function Publish() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [view, setView] = useState('list')
  const [updatedAt, setUpdatedAt] = useState(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true)
    getPublishedPosts().then((p) => { if (active) { setPosts(p || []); setUpdatedAt(Date.now()); setLoading(false) } })
    return () => { active = false }
  }, [tick])

  const refresh = () => setTick((t) => t + 1)

  return (
    <div className="p-4 md:p-8 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-50">Publish</h1>
          <p className="text-zinc-500 mt-1">Post to Instagram &amp; Facebook across your restaurants.</p>
        </div>
        <div className="flex items-center gap-2">
          <LastUpdated at={updatedAt} loading={loading} onRefresh={refresh} />
          <div className="flex rounded-xl border border-zinc-800 overflow-hidden">
            <ViewBtn active={view === 'list'} onClick={() => setView('list')}><List className="w-4 h-4" /> List</ViewBtn>
            <ViewBtn active={view === 'calendar'} onClick={() => setView('calendar')}><CalendarDays className="w-4 h-4" /> Calendar</ViewBtn>
          </div>
          <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 bg-accent-500 hover:bg-accent-400 text-zinc-950 text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
            <Plus className="w-4 h-4" /> New Post
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-zinc-500 text-sm py-10 text-center">Loading…</p>
      ) : view === 'calendar' ? (
        <CalendarView posts={posts} />
      ) : posts.length === 0 ? (
        <Empty onNew={() => setOpen(true)} />
      ) : (
        <div className="space-y-3">{posts.map((p) => <PostCard key={p.id} post={p} />)}</div>
      )}

      <Composer open={open} onClose={() => setOpen(false)} onPublished={refresh} />
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

function Empty({ onNew }) {
  return (
    <div className="bg-[#101012] rounded-2xl border border-zinc-800 p-10 text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 bg-zinc-800 rounded-xl mb-3"><ImageIcon className="w-6 h-6 text-zinc-400" /></div>
      <p className="text-zinc-100 font-medium">No posts yet</p>
      <p className="text-zinc-500 text-sm mt-1 mb-4">Create your first post to Instagram &amp; Facebook.</p>
      <button onClick={onNew} className="inline-flex items-center gap-2 bg-accent-500 hover:bg-accent-400 text-zinc-950 text-sm font-semibold px-4 py-2 rounded-xl"><Plus className="w-4 h-4" /> New Post</button>
    </div>
  )
}

function PostCard({ post }) {
  const loc = locByCode(post.code)
  return (
    <div className="bg-[#101012] rounded-2xl border border-zinc-800 p-4 flex gap-4">
      {post.image_url
        ? <img src={post.image_url} alt="" loading="lazy" className="w-16 h-16 rounded-xl object-cover shrink-0" />
        : <div className="w-16 h-16 rounded-xl bg-zinc-900 flex items-center justify-center shrink-0"><ImageIcon className="w-6 h-6 text-zinc-700" /></div>}
      <div className="min-w-0 flex-1">
        <p className="text-sm text-zinc-200">{post.caption || <span className="text-zinc-600 italic">(no caption)</span>}</p>
        <div className="flex items-center gap-3 mt-2 flex-wrap text-xs">
          <span className="flex items-center gap-1.5 text-zinc-300"><span className="w-2 h-2 rounded-full" style={{ background: loc?.color }} />{loc?.name || post.code}</span>
          <span className="flex items-center gap-1">{(post.networks || []).map((n) => <PlatformIcon key={n} platform={n} size="sm" />)}</span>
          <span className="text-zinc-500 flex items-center gap-1 ml-auto"><Check className="w-3.5 h-3.5 text-emerald-400" /> {fmt(post.published_at)}</span>
        </div>
      </div>
    </div>
  )
}

function CalendarView({ posts }) {
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()))
  const days = eachDayOfInterval({ start: startOfWeek(startOfMonth(cursor)), end: endOfWeek(endOfMonth(cursor)) })
  const postsOn = (day) => posts.filter((p) => p.published_at && isSameDay(new Date(p.published_at), day))
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
        {weekdays.map((d) => <div key={d} className="px-2 py-2 text-center text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">{d}</div>)}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const inMonth = isSameMonth(day, cursor)
          const dayPosts = postsOn(day)
          return (
            <div key={i} className={`min-h-[96px] border-b border-r border-zinc-800/70 p-1.5 ${inMonth ? '' : 'bg-zinc-950/40'}`}>
              <div className={`text-xs mb-1 inline-flex items-center justify-center w-6 h-6 rounded-full ${isToday(day) ? 'bg-accent-500 text-zinc-950 font-bold' : inMonth ? 'text-zinc-400' : 'text-zinc-700'}`}>{format(day, 'd')}</div>
              <div className="space-y-1">
                {dayPosts.slice(0, 3).map((p) => {
                  const loc = locByCode(p.code)
                  return (
                    <div key={p.id} title={`${loc?.name || p.code}: ${p.caption}`} className="text-[10px] leading-tight rounded px-1.5 py-1 truncate" style={{ background: '#34d39922', borderLeft: `2px solid ${loc?.color || '#34d399'}` }}>
                      <span className="font-semibold" style={{ color: loc?.color }}>{loc?.name || p.code}</span>
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
    </div>
  )
}

function Composer({ open, onClose, onPublished }) {
  const [caption, setCaption] = useState('')
  const [codes, setCodes] = useState([])
  const [nets, setNets] = useState(['facebook'])
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(null)

  function reset() { setCaption(''); setCodes([]); setNets(['facebook']); setFile(null); setPreview(null); setBusy(false); setDone(null) }
  const toggle = (list, set, v) => set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v])
  const needsImage = nets.includes('instagram')
  const valid = codes.length && nets.length && (caption.trim() || file) && (!needsImage || file)

  function pickFile(e) {
    const f = e.target.files?.[0]
    if (f) { setFile(f); setPreview(URL.createObjectURL(f)) }
  }

  async function publish() {
    if (!valid || busy) return
    setBusy(true); setDone(null)
    let imageUrl = null
    if (file) {
      const up = await uploadMedia(file)
      if (!up?.ok || !up.url) { setBusy(false); setDone({ error: 'Could not upload the photo. Please try again.' }); return }
      imageUrl = up.url
    }
    const results = []
    for (const code of codes) {
      const r = await publishPost({ code, networks: nets, caption: caption.trim(), image_url: imageUrl })
      results.push({ code, r })
      if (r?.ok) await recordPost({ code, networks: nets, caption: caption.trim(), image_url: imageUrl, results: r.results })
    }
    setBusy(false)
    setDone({ results })
    onPublished()
  }

  return (
    <Modal open={open} onClose={() => { onClose(); reset() }} title="New Post" size="lg">
      {done ? (
        <Results done={done} onClose={() => { onClose(); reset() }} onAnother={reset} />
      ) : (
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Caption</label>
            <textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={3} placeholder="What do you want to share?" className="w-full rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder-zinc-600 text-sm p-3 focus:outline-none focus:ring-2 focus:ring-accent-500/40 focus:border-accent-500/50" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Photo {needsImage && <span className="text-accent-400 normal-case">(required for Instagram)</span>}</label>
            {preview ? (
              <div className="flex items-center gap-3">
                <img src={preview} alt="" className="w-20 h-20 rounded-xl object-cover" />
                <button onClick={() => { setFile(null); setPreview(null) }} className="text-sm text-zinc-400 hover:text-zinc-200">Remove</button>
              </div>
            ) : (
              <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-zinc-700 text-sm text-zinc-300 hover:bg-zinc-900 cursor-pointer">
                <ImageIcon className="w-4 h-4" /> Choose a photo
                <input type="file" accept="image/*" onChange={pickFile} className="hidden" />
              </label>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Post to</label>
            <div className="flex flex-wrap gap-2">
              {LOCATIONS.map((l) => {
                const on = codes.includes(l.code)
                return (
                  <button key={l.code} onClick={() => toggle(codes, setCodes, l.code)} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${on ? 'bg-zinc-800 text-zinc-50 border-zinc-600' : 'bg-[#101012] text-zinc-400 border-zinc-800 hover:bg-zinc-900'}`}>
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: l.color }} />{l.name}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Networks</label>
            <div className="flex flex-wrap gap-2">
              {NETWORKS.map((p) => {
                const on = nets.includes(p.key)
                return (
                  <button key={p.key} onClick={() => toggle(nets, setNets, p.key)} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${on ? 'bg-zinc-800 text-zinc-50 border-zinc-600' : 'bg-[#101012] text-zinc-400 border-zinc-800 hover:bg-zinc-900'}`}>
                    <PlatformIcon platform={p.key} size="sm" /> {p.name}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
            <button onClick={() => { onClose(); reset() }} className="text-sm font-medium text-zinc-300 hover:bg-zinc-800 px-4 py-2 rounded-lg">Cancel</button>
            <button onClick={publish} disabled={!valid || busy} className="inline-flex items-center gap-1.5 bg-accent-500 hover:bg-accent-400 disabled:opacity-40 text-zinc-950 text-sm font-semibold px-4 py-2 rounded-lg">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} {busy ? 'Publishing…' : 'Publish now'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}

function Results({ done, onClose, onAnother }) {
  if (done.error) {
    return (
      <div className="text-center py-6">
        <p className="text-red-400 text-sm">{done.error}</p>
        <button onClick={onAnother} className="mt-4 bg-accent-500 hover:bg-accent-400 text-zinc-950 text-sm font-semibold px-4 py-2 rounded-lg">Try again</button>
      </div>
    )
  }
  return (
    <div className="space-y-3">
      {done.results.map(({ code, r }) => {
        const loc = locByCode(code)
        return (
          <div key={code} className="rounded-xl border border-zinc-800 p-3">
            <p className="text-sm font-medium text-zinc-200 mb-1.5 flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ background: loc?.color }} />{loc?.name || code}</p>
            <div className="space-y-1">
              {r?.results ? Object.entries(r.results).map(([net, res]) => (
                <div key={net} className="flex items-center gap-2 text-xs">
                  <PlatformIcon platform={net} size="sm" />
                  {res.ok ? <span className="text-emerald-400 flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Published</span> : <span className="text-red-400">{res.error}</span>}
                </div>
              )) : <span className="text-xs text-red-400">{r?.error || 'Failed'}</span>}
            </div>
          </div>
        )
      })}
      <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
        <button onClick={onAnother} className="text-sm font-medium text-zinc-300 hover:bg-zinc-800 px-4 py-2 rounded-lg">Post another</button>
        <button onClick={onClose} className="bg-accent-500 hover:bg-accent-400 text-zinc-950 text-sm font-semibold px-4 py-2 rounded-lg">Done</button>
      </div>
    </div>
  )
}
