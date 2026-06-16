import { useEffect, useMemo, useState } from 'react'
import { MessageSquare, Reply, Send, Loader2, Check, ExternalLink } from 'lucide-react'
import { LOCATIONS, locationById } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { PlatformIcon } from '../components/ui/Platform'
import { LastUpdated } from '../components/ui/LastUpdated'
import { ListSkeleton } from '../components/ui/Skeleton'
import { TEMPLATES } from '../lib/templates'
import { getComments, replyToComment } from '../lib/live'

const locByCode = (code) => LOCATIONS.find((l) => l.code === code)

export default function Inbox() {
  const { isAdmin, scopedLocationId } = useAuth()
  const scopedCode = scopedLocationId ? locationById(scopedLocationId)?.code : null
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [loc, setLoc] = useState(scopedCode || null)
  const [platform, setPlatform] = useState(null)
  const [replied, setReplied] = useState({}) // { comment_id: replyText }
  const [updatedAt, setUpdatedAt] = useState(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true)
    getComments().then((rows) => { if (active) { setData(rows); setUpdatedAt(Date.now()); setLoading(false) } })
    return () => { active = false }
  }, [tick])

  const comments = useMemo(() => {
    if (!data) return []
    let rows = data
    if (!isAdmin && scopedCode) rows = rows.filter((r) => r.code === scopedCode)
    if (loc) rows = rows.filter((r) => r.code === loc)
    return rows
      .flatMap((r) => (r.comments || []).map((c) => ({ ...c, code: r.code })))
      .filter((c) => !platform || c.network === platform)
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
  }, [data, loc, platform, isAdmin, scopedCode])

  const unreplied = comments.filter((c) => !replied[c.id]).length

  return (
    <div className="p-4 md:p-8 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-zinc-50">Inbox</h1>
          {!loading && data && <span className="text-xs font-semibold text-accent-400 bg-accent-500/10 px-2 py-0.5 rounded-full">{unreplied} comments</span>}
        </div>
        <div className="flex items-center gap-3">
          <LastUpdated at={updatedAt} loading={loading} onRefresh={() => setTick((t) => t + 1)} />
          {isAdmin && data && (
            <select
              value={loc || ''}
              onChange={(e) => setLoc(e.target.value || null)}
              className="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-sm text-zinc-200"
            >
              <option value="">All Locations</option>
              {LOCATIONS.map((l) => <option key={l.id} value={l.code}>{l.name}</option>)}
            </select>
          )}
        </div>
      </div>

      {data && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-3 mb-5 flex gap-2.5 items-center">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
          <p className="text-xs text-emerald-200/80">Live comments from your Instagram &amp; Facebook posts. Replies post straight to the platform.</p>
        </div>
      )}

      {data && (
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <FilterChip active={platform === null} onClick={() => setPlatform(null)}>All</FilterChip>
          <FilterChip active={platform === 'instagram'} onClick={() => setPlatform('instagram')}><PlatformIcon platform="instagram" size="sm" /> Instagram</FilterChip>
          <FilterChip active={platform === 'facebook'} onClick={() => setPlatform('facebook')}><PlatformIcon platform="facebook" size="sm" /> Facebook</FilterChip>
        </div>
      )}

      {loading && !data ? (
        <ListSkeleton rows={5} />
      ) : !data ? (
        <Unavailable />
      ) : comments.length === 0 ? (
        <NoComments />
      ) : (
        <div className="space-y-3">
          {comments.map((c) => (
            <CommentCard
              key={c.id}
              comment={c}
              repliedText={replied[c.id]}
              onReplied={(text) => setReplied((prev) => ({ ...prev, [c.id]: text }))}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function CommentCard({ comment, repliedText, onReplied }) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)
  const loc = locByCode(comment.code)

  async function send() {
    const message = text.trim()
    if (!message) return
    setSending(true); setError(null)
    const res = await replyToComment({ code: comment.code, network: comment.network, comment_id: comment.id, message })
    setSending(false)
    if (res?.ok) {
      onReplied(message); setOpen(false); setText('')
    } else {
      setError(res?.error || 'Could not send. Try again.')
    }
  }

  return (
    <div className="bg-[#101012] rounded-2xl border border-zinc-800 p-4" style={{ borderLeftWidth: '4px', borderLeftColor: loc?.color }}>
      <div className="flex items-start gap-3">
        <PlatformIcon platform={comment.network} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-x-2 gap-y-1 flex-wrap">
            <span className="font-semibold text-zinc-100 text-sm">{comment.author}</span>
            <span className="text-xs text-zinc-500 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: loc?.color }} /> {loc?.name}
            </span>
            {comment.post_permalink && (
              <a href={comment.post_permalink} target="_blank" rel="noreferrer" className="text-xs text-zinc-500 hover:text-zinc-300 inline-flex items-center gap-1">
                <ExternalLink className="w-3 h-3" /> post
              </a>
            )}
            <span className="ml-auto text-xs text-zinc-600">{comment.date ? comment.date.slice(0, 10) : ''}</span>
          </div>
          <p className="text-sm text-zinc-300 mt-2">{comment.text || <span className="text-zinc-600 italic">(no text)</span>}</p>
          {comment.post_caption && <p className="text-xs text-zinc-600 mt-1 line-clamp-1">on: {comment.post_caption}</p>}

          {repliedText ? (
            <div className="mt-3 rounded-xl bg-zinc-900 border border-zinc-800 p-3">
              <p className="text-xs font-medium text-emerald-400 mb-1 flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Replied</p>
              <p className="text-sm text-zinc-300">{repliedText}</p>
            </div>
          ) : (
            <div className="mt-3">
              {!open ? (
                <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-300 border border-zinc-700 hover:bg-zinc-800 px-3 py-1.5 rounded-lg">
                  <Reply className="w-3.5 h-3.5" /> Reply
                </button>
              ) : (
                <div className="space-y-2">
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={2}
                    autoFocus
                    placeholder={`Reply to ${comment.author}…`}
                    className="w-full rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder-zinc-600 text-sm p-3 focus:outline-none focus:ring-2 focus:ring-accent-500/40 focus:border-accent-500/50"
                  />
                  {error && <p className="text-xs text-red-400">{error}</p>}
                  <div className="flex items-center gap-2 flex-wrap">
                    <TemplatePicker onPick={setText} />
                    <button onClick={send} disabled={sending || !text.trim()} className="inline-flex items-center gap-1.5 bg-accent-500 hover:bg-accent-400 disabled:opacity-50 text-zinc-950 text-sm font-semibold px-3 py-1.5 rounded-lg">
                      {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />} {sending ? 'Sending…' : 'Send reply'}
                    </button>
                    <button onClick={() => { setOpen(false); setText(''); setError(null) }} className="text-sm text-zinc-400 hover:text-zinc-200 px-2 py-1.5">Cancel</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function TemplatePicker({ onPick }) {
  return (
    <select
      onChange={(e) => { if (e.target.value) { onPick(e.target.value); e.target.value = '' } }}
      className="text-sm bg-zinc-900 border border-zinc-700 text-zinc-300 rounded-lg px-2 py-[7px] focus:outline-none focus:ring-2 focus:ring-accent-500/40"
      defaultValue=""
    >
      <option value="">Templates…</option>
      {TEMPLATES.map((t) => <option key={t.label} value={t.text}>{t.label}</option>)}
    </select>
  )
}

function NoComments() {
  return (
    <div className="bg-[#101012] rounded-2xl border border-zinc-800 p-10 text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 bg-zinc-800 rounded-xl mb-3">
        <MessageSquare className="w-6 h-6 text-zinc-400" />
      </div>
      <p className="text-zinc-100 font-medium">No comments right now</p>
      <p className="text-zinc-500 text-sm mt-1">New comments on your recent Instagram &amp; Facebook posts will show up here.</p>
    </div>
  )
}

function Unavailable() {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 text-center">
      <MessageSquare className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
      <p className="font-medium text-zinc-200">Comments aren't available right now</p>
      <p className="text-sm text-zinc-500 mt-1">This page shows real Instagram &amp; Facebook comments on the deployed site.</p>
    </div>
  )
}

function FilterChip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
        active ? 'bg-accent-500 text-zinc-950 border-accent-500' : 'bg-[#101012] text-zinc-400 border-zinc-800 hover:bg-zinc-900'
      }`}
    >
      {children}
    </button>
  )
}
