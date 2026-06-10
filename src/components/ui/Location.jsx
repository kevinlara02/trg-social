import { locationById } from '../../lib/supabase'

// A small colored dot for a restaurant. Each location has its own color;
// use this wherever a single restaurant is shown in a list.
export function LocationDot({ id, className = '' }) {
  const loc = locationById(id)
  if (!loc) return null
  return (
    <span
      className={`inline-block w-2.5 h-2.5 rounded-full shrink-0 ${className}`}
      style={{ backgroundColor: loc.color }}
      title={loc.name}
    />
  )
}

// A pill that names a single restaurant in its own color (subtle tint background).
export function LocationBadge({ id }) {
  const loc = locationById(id)
  if (!loc) return null
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium text-zinc-200"
      style={{ backgroundColor: `${loc.color}26` }}
    >
      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: loc.color }} />
      {loc.name}
    </span>
  )
}
