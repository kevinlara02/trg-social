import { format as dfFormat } from 'date-fns'

export function fmt(date, pattern = 'MMM d, yyyy') {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d)) return ''
  return dfFormat(d, pattern)
}
