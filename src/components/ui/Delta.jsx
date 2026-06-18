import { TrendingUp, TrendingDown } from 'lucide-react'

// Period-over-period change. Returns null when there's nothing to compare.
export function delta(cur, prev) {
  if (prev == null || prev === 0) return cur > 0 ? { pct: null, up: true, isNew: true } : null
  const d = ((cur - prev) / prev) * 100
  return { pct: Math.abs(d) < 0.05 ? 0 : Math.round(d), up: d >= 0, isNew: false }
}

// Small green/red change chip.
export function DeltaTag({ d }) {
  if (!d) return null
  if (d.isNew) return <span className="text-xs font-medium text-emerald-400">new</span>
  if (d.pct === 0) return <span className="text-xs text-zinc-500">0%</span>
  const Icon = d.up ? TrendingUp : TrendingDown
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${d.up ? 'text-emerald-400' : 'text-red-400'}`}>
      <Icon className="w-3 h-3" />{Math.abs(d.pct)}%
    </span>
  )
}
