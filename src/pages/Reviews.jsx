import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Star, Link2, ExternalLink, Reply, Send, Sparkles, Copy, Check, Loader2 } from 'lucide-react'
import { supabase, LOCATIONS, reviewPlatforms, platformByKey, platformName, locationName } from '../lib/supabase'
import { DEMO, demoMutate, logActivity } from '../lib/demo'
import { aiSuggest } from '../lib/suggest'
import { TEMPLATES } from '../lib/templates'
import { useAuth } from '../context/AuthContext'
import { PlatformIcon } from '../components/ui/Platform'
import { StarRating, ReviewStatusBadge } from '../components/ui/Badge'
import { LocationDot } from '../components/ui/Location'
import { fmt } from '../lib/datefmt'

export default function Reviews() {
  const { isAdmin, scopedLocationId } = useAuth()
  const [loc, setLoc] = useState(scopedLocationId || null)
  const [platform, setPlatform] = useState(null)
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [reviews, setReviews] = useState([])

  useEffect(() => {
    let active = true
    ;(async () => {
      setLoading(true)
      try {
        const { data } = await supabase.from('reviews')
          .select('id, location_id, platform, author_name, rating, body, review_url, review_date, status, reply_body')
          .order('review_date', { ascending: false })
        if (active) setReviews(data || [])
      } catch { if (active) setReviews([]) }
      finally { if (active) setLoading(false) }
    })()
    return () => { active = false }
  }, [])

  const effectiveLoc = isAdmin ? loc : scopedLocationId
  const filtered = reviews.filter((r) =>
    (!effectiveLoc || r.location_id === effectiveLoc) &&
    (!platform || r.platform === platform) &&
    (!status || r.status === status)
  )
  const newCount = reviews.filter((r) => r.status === 'new').length

  function applyReply(review, text) {
    const patch = { status: 'replied', reply_body: text }
    if (DEMO) {
      demoMutate('reviews', review.id, patch)
      logActivity({ action: `replied to a ${platformName(review.platform)} review`, target: review.author_name || 'a guest', location_id: review.location_id })
    } else {
      supabase.from('reviews').update(patch).eq('id', review.id)
    }
    setReviews((rs) => rs.map((r) => (r.id === review.id ? { ...r, ...patch } : r)))
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-zinc-50">Reviews</h1>
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

      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <FilterChip active={platform === null} onClick={() => setPlatform(null)}>All</FilterChip>
        {reviewPlatforms().map((p) => (
          <FilterChip key={p.key} active={platform === p.key} onClick={() => setPlatform(p.key)}>
            <PlatformIcon platform={p.key} size="sm" /> {p.name}
          </FilterChip>
        ))}
      </div>
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <SmallChip active={status === null} onClick={() => setStatus(null)}>All status</SmallChip>
        <SmallChip active={status === 'new'} onClick={() => setStatus('new')}>Needs reply</SmallChip>
        <SmallChip active={status === 'replied'} onClick={() => setStatus('replied')}>Replied</SmallChip>
      </div>

      {loading ? (
        <p className="text-zinc-500 text-sm py-10 text-center">Loading…</p>
      ) : filtered.length === 0 ? (
        <EmptyState isAdmin={isAdmin} />
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => <ReviewCard key={r.id} review={r} onReply={applyReply} />)}
        </div>
      )}
    </div>
  )
}

function ReviewCard({ review, onReply }) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [copied, setCopied] = useState(false)
  const [generating, setGenerating] = useState(false)
  const canReply = platformByKey(review.platform)?.canReply

  async function suggest() {
    setGenerating(true)
    try {
      const { text: t } = await aiSuggest({ kind: 'review', item: review, location: locationName(review.location_id) })
      setText(t)
    } finally { setGenerating(false) }
  }
  function send() { if (!text.trim()) return; onReply(review, text.trim()); setOpen(false); setText('') }
  function markReplied() { onReply(review, text.trim() || 'Replied on Yelp.'); setOpen(false); setText('') }
  async function copy() { try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500) } catch { /* clipboard blocked */ } }

  return (
    <div className="bg-[#101012] rounded-2xl border border-zinc-800 p-4">
      <div className="flex items-start gap-3">
        <PlatformIcon platform={review.platform} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-x-2 gap-y-1 flex-wrap">
            <span className="font-semibold text-zinc-100 text-sm">{review.author_name || 'Guest'}</span>
            <StarRating rating={review.rating} />
            <span className="text-xs text-zinc-500 flex items-center gap-1.5">
              <LocationDot id={review.location_id} /> {locationName(review.location_id)}
            </span>
            <span className="ml-auto"><ReviewStatusBadge status={review.status} /></span>
          </div>
          <p className="text-sm text-zinc-300 mt-2">{review.body}</p>
          <p className="text-xs text-zinc-600 mt-1">{fmt(review.review_date)}</p>

          {review.status === 'replied' && review.reply_body && (
            <div className="mt-3 rounded-xl bg-zinc-900 border border-zinc-800 p-3">
              <p className="text-xs font-medium text-accent-400 mb-1">Your reply</p>
              <p className="text-sm text-zinc-300">{review.reply_body}</p>
            </div>
          )}

          {review.status !== 'replied' && (
            <div className="mt-3">
              {!open ? (
                <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-300 border border-zinc-700 hover:bg-zinc-800 px-3 py-1.5 rounded-lg">
                  <Reply className="w-3.5 h-3.5" /> {canReply ? 'Reply' : 'Draft reply'}
                </button>
              ) : (
                <div className="space-y-2">
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={3}
                    autoFocus
                    placeholder={canReply ? `Reply to ${review.author_name || 'this review'}…` : 'Draft your reply, then copy it into Yelp…'}
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
                    {canReply ? (
                      <button onClick={send} className="inline-flex items-center gap-1.5 bg-accent-500 hover:bg-accent-400 text-zinc-950 text-sm font-semibold px-3 py-1.5 rounded-lg">
                        <Send className="w-3.5 h-3.5" /> Send reply
                      </button>
                    ) : (
                      <>
                        <a href={review.review_url || '#'} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 bg-accent-500 hover:bg-accent-400 text-zinc-950 text-sm font-semibold px-3 py-1.5 rounded-lg">
                          <ExternalLink className="w-3.5 h-3.5" /> Open in {platformName(review.platform)}
                        </a>
                        <button onClick={markReplied} className="text-sm font-medium text-zinc-300 hover:bg-zinc-800 px-3 py-1.5 rounded-lg">Mark replied</button>
                      </>
                    )}
                    <button onClick={() => { setOpen(false); setText('') }} className="text-sm text-zinc-400 hover:text-zinc-200 px-2 py-1.5">Cancel</button>
                  </div>
                  {!canReply && (
                    <p className="text-xs text-zinc-600">{platformName(review.platform)} reviews are answered on its own site. Copy your reply and paste it there.</p>
                  )}
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
        <Star className="w-6 h-6 text-zinc-400" />
      </div>
      <p className="text-zinc-100 font-medium">No reviews here</p>
      <p className="text-zinc-500 text-sm mt-1 max-w-md mx-auto">Try a different filter, or connect Google and Yelp to pull in reviews.</p>
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

function SmallChip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
        active ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
      }`}
    >
      {children}
    </button>
  )
}
