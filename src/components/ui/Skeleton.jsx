// Lightweight loading placeholders (pulse) used while live data loads.
export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-zinc-800/60 rounded ${className}`} />
}

export function KpiSkeleton({ count = 4 }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-[#101012] rounded-2xl border border-zinc-800 p-5">
          <Skeleton className="h-3 w-20 mb-3" />
          <Skeleton className="h-7 w-16" />
        </div>
      ))}
    </div>
  )
}

export function ListSkeleton({ rows = 5 }) {
  return (
    <div className="bg-[#101012] rounded-2xl border border-zinc-800 divide-y divide-zinc-800/60">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="p-4 flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function ChartSkeleton({ height = 240 }) {
  return (
    <div className="bg-[#101012] rounded-2xl border border-zinc-800 p-5">
      <Skeleton className="h-4 w-40 mb-4" />
      <Skeleton className="w-full" style={{ height }} />
    </div>
  )
}
