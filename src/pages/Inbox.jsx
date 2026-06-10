import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MessageSquare, Link2, Reply, Send, Sparkles, Copy, Check, Loader2 } from 'lucide-react'
import { supabase, LOCATIONS, inboxPlatforms, platformName, locationName } from '../lib/supabase'
import { DEMO, demoMutate, logActivity } from '../lib/demo'
import { aiSuggest } from '../lib/suggest'
import { TEMPLATES } from '../lib/templates'
import { useAuth } from '../context/AuthContext'
import { PlatformIcon } from '../components/ui/Platform'
import { Pill } from '../components/ui/Badge'
import { LocationDot } from '../components/ui/Location'
import { fmt } from '../lib/datefmt'

const KIND = {
  comment: { color: 'blue',   label: 'Comment' },
  dm:      { color: 'purple', label: 'DM' },
  form:    { color: 'yellow', label: 'Website inquiry' },
}

export default function Inbox() {
  const { isAdmin, scopedLocationId } = useAuth()
  const [loc, setLoc] = useState(scopedLocationId || null)
  const [platform, setPlatform] = useState(null)
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState([])

  useEffect(() => {
    let active = true
    ;(async () => {
      setLoading(true)
      try {
        const { data } = await supabase.from('messages')
          .select('id, location_id, platform, kind, author_name, author_handle, body, permalink, message_date, status, reply_body')
          .order('message_date', { ascending: false })
        if (active) setMessages(data || [])
      } catch { if (active) setMessages([]) }
      finally { if (active) setLoading(false) }
    })()
    return () => { active = false }
  }, [])

  const effectiveLoc = isAdmin ? loc : scopedLocationId
  const filtered = messages.filter((m) =>
    (!effectiveLoc || m.location_id === effectiveLoc) &&
    (!platform || m.platform === platform)
  )
  const newCount = messages.filter((m) => m.status === 'new').length

  function applyReply(message, text) {
    const patch = { status: 'replied', reply_body: text }
    if (DEMO) {
      demoMutate('messages', message.id, patch)
      const kindWord = message.kind === 'dm' ? 'DM' : message.kind === 'form' ? 'inquiry' : 'comment'
      logActivity({ action: `replied to a ${platformName(message.platform)} ${kindWord}`, target: message.author_name || message.author_handle || 'a guest', location_id: message.location_id })
    } else {
      supabase.from('messages').update(patch).eq('id', message.id)
    }
    setMessages((ms) => ms.map((m) => (m.id === message.id ? { ...m, ...patch } : m)))
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-zinc-50">Inbox</h1>
          {newCount > 0 && <span className="text-xs font-semibold text-accent-400 bg-accent-500/10 px-2 py-0.5 rounded-full">{newCount} new</span>}
        </div>
        {isAdmin && (
          <select
            value={loc || ''}
            onChange={(e) => setLoc(e.target.value ? Number(e.target.value) : null)}
            className="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-sm text-zinc-200"
          >
            <option value="">All Locations</option>
            {LOCATIONS.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        )}
      </div>

      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <FilterChip active={platform === null} onClick={() => setPlatform(null)}>All</FilterChip>
        {inboxPlatforms().map((p) => (
          <FilterChip key={p.key} active={platform === p.key} onClick={() => setPlatform(p.key)}>
            <PlatformIcon platform={p.key} size="sm" /> {p.name}
          </FilterChip>
        ))}
      </div>

      {loading ? (
        <p className="text-zinc-500 text-sm py-10 text-center">Loading…</p>
      ) : filtered.length === 0 ? (
        <EmptyState isAdmin={isAdmin} />
      ) : (
        <div className="space-y-3">
          {filtered.map((m) => <MessageCard key={m.id} message={m} onReply={applyReply} />)}
        </div>
      )}
    </div>
  )
}

function MessageCard({ message, onReply }) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [copied, setCopied] = useState(false)
  const [generating, setGenerating] = useState(false)
  const who = message.author_name || message.author_handle || 'Someone'
  const kind = KIND[message.kind] || KIND.comment

  async function suggest() {
    setGenerating(true)
    try {
      const { text: t } = await aiSuggest({ kind: 'message', item: message, location: locationName(message.location_id) })
      setText(t)
    } finally { setGenerating(false) }
  }
  function send() { if (!text.trim()) return; onReply(message, text.trim()); setOpen(false); setText('') }
  async function copy() { try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500) } catch { /* clipboard blocked */ } }

  return (
    <div className="bg-[#101012] rounded-2xl border border-zinc-800 p-4">
      <div className="flex items-start gap-3">
        <PlatformIcon platform={message.platform} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-x-2 gap-y-1 flex-wrap">
            <span className="font-semibold text-zinc-100 text-sm">{who}</span>
            <Pill color={kind.color}>{kind.label}</Pill>
            <span className="text-xs text-zinc-500 flex items-center gap-1.5">
              <LocationDot id={message.location_id} /> {locationName(message.location_id)}
            </span>
            <span className="ml-auto text-xs text-zinc-600">{fmt(message.message_date)}</span>
          </div>
          <p className="text-sm text-zinc-300 mt-2">{message.body}</p>

          {message.status === 'replied' && message.reply_body && (
            <div className="mt-3 rounded-xl bg-zinc-900 border border-zinc-800 p-3">
              <p className="text-xs font-medium text-accent-400 mb-1">Your reply</p>
              <p className="text-sm text-zinc-300">{message.reply_body}</p>
            </div>
          )}

          {message.status !== 'replied' && (
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
                    placeholder={`Reply to ${who}…`}
                    className="w-full rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder-zinc-600 text-sm p-3 focus:outline-none focus:ring-2 focus:ring-accent-500/40 focus:border-accent-500/50"
                  />
                  <div className="flex items-center gap-2 flex-wrap">
                    <button onClick={suggest} disabled={generating} className="inline-flex items-center gap-1.5 text-sm font-medium text-accent-400 border border-accent-500/30 hover:bg-accent-500/10 disabled:opacity-50 px-3 py-1.5 rounded-lg">
                      {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                      {generating ? 'Generating…' : 'Suggest'}
                    </button>
                    <TemplatePicker onPick={setText} />
                    <button onClick={copy} className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-200 border border-zinc-700 hover:bg-zinc-800 px-3 py-1.5 rounded-lg">
                      {copied ? <Check className="w-3.5 h-3.5 text-accent-400" /> : <Copy className="w-3.5 h-3.5" />} {copied ? 'Copied!' : 'Copy'}
                    </button>
                    <button onClick={send} className="inline-flex items-center gap-1.5 bg-accent-500 hover:bg-accent-400 text-zinc-950 text-sm font-semibold px-3 py-1.5 rounded-lg">
                      <Send className="w-3.5 h-3.5" /> Send
                    </button>
                    <button onClick={() => { setOpen(false); setText('') }} className="text-sm text-zinc-400 hover:text-zinc-200 px-2 py-1.5">Cancel</button>
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

function EmptyState({ isAdmin }) {
  return (
    <div className="bg-[#101012] rounded-2xl border border-zinc-800 p-10 text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 bg-zinc-800 rounded-xl mb-3">
        <MessageSquare className="w-6 h-6 text-zinc-400" />
      </div>
      <p className="text-zinc-100 font-medium">No messages here</p>
      <p className="text-zinc-500 text-sm mt-1 max-w-md mx-auto">Try a different filter, or connect Facebook, Instagram, and your Squarespace site.</p>
      {isAdmin && (
        <Link to="/connections" className="inline-flex items-center gap-2 mt-4 bg-accent-500 hover:bg-accent-400 text-zinc-950 text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
          <Link2 className="w-4 h-4" /> Go to Connections
        </Link>
      )}
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
