import { Star } from 'lucide-react'

const REVIEW_STYLES = {
  new:      'bg-sky-500/15 text-sky-300',
  replied:  'bg-emerald-500/15 text-emerald-300',
  archived: 'bg-zinc-700/40 text-zinc-400',
}
const REVIEW_LABELS = { new: 'New', replied: 'Replied', archived: 'Archived' }

export function ReviewStatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${REVIEW_STYLES[status] || REVIEW_STYLES.new}`}>
      {REVIEW_LABELS[status] || status}
    </span>
  )
}

const POST_STYLES = {
  draft:     'bg-zinc-700/40 text-zinc-300',
  scheduled: 'bg-amber-500/15 text-amber-300',
  published: 'bg-emerald-500/15 text-emerald-300',
  failed:    'bg-red-500/15 text-red-300',
}
const POST_LABELS = { draft: 'Draft', scheduled: 'Scheduled', published: 'Published', failed: 'Failed' }

export function PostStatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${POST_STYLES[status] || POST_STYLES.draft}`}>
      {POST_LABELS[status] || status}
    </span>
  )
}

// Read-only star rating, 1 to 5.
export function StarRating({ rating = 0, className = '' }) {
  const r = Math.round(Number(rating) || 0)
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`} title={`${r} of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`w-3.5 h-3.5 ${i <= r ? 'text-amber-400 fill-amber-400' : 'text-zinc-700'}`} />
      ))}
    </span>
  )
}

const PILL = {
  gray:   'bg-zinc-700/40 text-zinc-300',
  green:  'bg-emerald-500/15 text-emerald-300',
  red:    'bg-red-500/15 text-red-300',
  yellow: 'bg-amber-500/15 text-amber-300',
  blue:   'bg-sky-500/15 text-sky-300',
  purple: 'bg-violet-500/15 text-violet-300',
}
export function Pill({ children, color = 'gray' }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${PILL[color] || PILL.gray}`}>
      {children}
    </span>
  )
}
