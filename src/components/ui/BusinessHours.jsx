import { useState } from 'react'
import { Clock, ChevronDown } from 'lucide-react'
import { parseHours } from '../../lib/yelpHours'

// Collapsible weekly hours from Yelp. `open` is the business's hours[0].open array.
export function BusinessHours({ open }) {
  const [show, setShow] = useState(false)
  const hours = parseHours(open)
  if (!hours) return null
  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200"
      >
        <Clock className="w-3 h-3 shrink-0" />
        <span className="text-zinc-300">Hours</span>
        <span className="text-zinc-500">{hours.todayRanges.length ? `Today ${hours.todayRanges.join(', ')}` : 'Closed today'}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${show ? 'rotate-180' : ''}`} />
      </button>
      {show && (
        <div className="mt-2 rounded-lg bg-zinc-900/60 border border-zinc-800 p-2.5 space-y-1 max-w-xs">
          {hours.weekly.map((d) => (
            <div key={d.idx} className={`flex justify-between gap-6 text-xs ${d.isToday ? 'text-zinc-100 font-medium' : 'text-zinc-400'}`}>
              <span>{d.name}</span>
              <span>{d.ranges.length ? d.ranges.join(', ') : 'Closed'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
