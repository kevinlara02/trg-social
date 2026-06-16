import { RefreshCw } from 'lucide-react'

// Small "Updated 3:42 PM · click to refresh" control for the data pages.
export function LastUpdated({ at, loading, onRefresh }) {
  const label = at ? new Date(at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : null
  return (
    <button
      type="button"
      onClick={onRefresh}
      disabled={loading}
      title="Refresh data"
      className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-200 disabled:opacity-60 transition-colors"
    >
      <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
      {loading ? 'Refreshing…' : label ? `Updated ${label}` : 'Refresh'}
    </button>
  )
}
