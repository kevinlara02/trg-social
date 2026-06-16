// Formats Yelp business hours (the `open` array from the Yelp business detail).
// Yelp's `day` field is 0=Monday ... 6=Sunday.
const SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

function fmtTime(t) {
  if (!t || t.length < 4) return t || ''
  let h = parseInt(t.slice(0, 2), 10)
  const m = t.slice(2)
  const ap = h >= 12 ? 'PM' : 'AM'
  h = h % 12
  if (h === 0) h = 12
  return `${h}:${m} ${ap}`
}

export function yelpTodayIndex() {
  const js = new Date().getDay() // 0=Sun..6=Sat
  return (js + 6) % 7 // -> 0=Mon..6=Sun
}

export function parseHours(open) {
  if (!Array.isArray(open) || !open.length) return null
  const byDay = {}
  for (const o of open) {
    const range = `${fmtTime(o.start)} - ${fmtTime(o.end)}`
    ;(byDay[o.day] = byDay[o.day] || []).push(range)
  }
  const today = yelpTodayIndex()
  const weekly = SHORT.map((short, idx) => ({
    idx,
    short,
    name: FULL[idx],
    ranges: byDay[idx] || [],
    isToday: idx === today,
  }))
  return { today, weekly, todayRanges: byDay[today] || [] }
}
