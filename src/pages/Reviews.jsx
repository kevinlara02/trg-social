import { useEffect, useMemo, useState } from 'react'
import { Star, ExternalLink, Info, Phone, MapPin, Utensils } from 'lucide-react'
import { LOCATIONS, locationById } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { StarRating } from '../components/ui/Badge'
import { PlatformIcon } from '../components/ui/Platform'
import { getYelp } from '../lib/live'

const locByCode = (code) => LOCATIONS.find((l) => l.code === code)
const fmtNum = (n) => (n == null ? '–' : Number(n).toLocaleString('en-US'))
const TX_LABEL = { delivery: 'Delivery', pickup: 'Pickup', restaurant_reservation: 'Reservations' }

export default function Reviews() {
  const { isAdmin, scopedLocationId } = useAuth()
  const scopedCode = scopedLocationId ? locationById(scopedLocationId)?.code : null
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [loc, setLoc] = useState(scopedCode || null)

  useEffect(() => {
    let active = true
    getYelp().then((rows) => { if (active) { setData(rows); setLoading(false) } })
    return () => { active = false }
  }, [])

  const rows = useMemo(() => {
    if (!data) return []
    let r = data.filter((x) => x.rating != null)
    if (!isAdmin && scopedCode) r = r.filter((x) => x.code === scopedCode)
    if (loc) r = r.filter((x) => x.code === loc)
    return [...r].sort((a, b) => (b.rating || 0) - (a.rating || 0)) // ranked best -> worst
  }, [data, loc, isAdmin, scopedCode])

  const totalReviews = rows.reduce((s, r) => s + (r.review_count || 0), 0)
  const avgRating = rows.length ? rows.reduce((s, r) => s + (r.rating || 0), 0) / rows.length : 0
  const openCount = rows.filter((r) => r.is_open_now === true).length
  const lowestCode = rows.length > 1 ? rows[rows.length - 1].code : null

  return (
    <div className="p-4 md:p-8 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-50">Reviews</h1>
          <p className="text-zinc-500 mt-1">Your Yelp ratings, ranked across all locations.</p>
        </div>
        {isAdmin && data && (
          <select value={loc || ''} onChange={(e) => setLoc(e.target.value || null)} className="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-sm text-zinc-200">
            <option value="">All Locations</option>
            {LOCATIONS.map((l) => <option key={l.id} value={l.code}>{l.name}</option>)}
          </select>
        )}
      </div>

      {loading ? (
        <p className="text-zinc-500 text-sm py-10 text-center">Loading Yelp data…</p>
      ) : !data ? (
        <Unavailable />
      ) : (
        <>
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-3 mb-5 flex gap-2.5 items-center">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
            <p className="text-xs text-emerald-200/80">Live from Yelp. Tap &quot;View on Yelp&quot; to read and reply to reviews.</p>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <Kpi label="Avg Yelp Rating" value={avgRating ? avgRating.toFixed(1) + '★' : '–'} />
            <Kpi label="Total Reviews" value={fmtNum(totalReviews)} />
            <Kpi label="Open Now" value={`${openCount}/${rows.length}`} />
          </div>

          <div className="space-y-3">
            {rows.map((r, i) => (
              <YelpCard key={r.code} r={r} rank={i + 1} isLowest={r.code === lowestCode} />
            ))}
          </div>

          <div className="bg-sky-500/10 border border-sky-500/20 rounded-2xl p-4 mt-6 flex gap-3">
            <Info className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-sky-100">Want full review text + replies inside the app?</p>
              <p className="text-sky-200/70 mt-0.5">Yelp only shares ratings through its API. To read and reply to individual reviews here, the next step is connecting Google Business.</p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function YelpCard({ r, rank, isLowest }) {
  const l = locByCode(r.code)
  const photo = r.photos?.[0]
  return (
    <div className="bg-[#101012] rounded-2xl border border-zinc-800 p-4" style={{ borderLeftWidth: '4px', borderLeftColor: l?.color }}>
      <div className="flex gap-3">
        {photo ? (
          <img src={photo} alt="" loading="lazy" className="w-20 h-20 rounded-xl object-cover shrink-0" />
        ) : (
          <div className="w-20 h-20 rounded-xl shrink-0 flex items-center justify-center text-zinc-200 font-bold text-lg" style={{ background: (l?.color || '#71717a') + '33' }}>{l?.code}</div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-zinc-600">#{rank}</span>
            <span className="font-semibold text-zinc-100 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: l?.color }} />{l?.name}
            </span>
            {isLowest && <span className="text-[10px] font-semibold uppercase tracking-wide text-red-400 bg-red-500/10 rounded px-1.5 py-0.5">Lowest rated</span>}
            {r.is_open_now === true && <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-400 bg-emerald-500/10 rounded px-1.5 py-0.5">Open now</span>}
            {r.is_open_now === false && <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 bg-zinc-800 rounded px-1.5 py-0.5">Closed</span>}
            <a href={r.url || '#'} target="_blank" rel="noreferrer" className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-accent-400 hover:text-accent-300">
              View on Yelp <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="text-lg font-bold text-zinc-50">{r.rating?.toFixed(1)}</span>
            <StarRating rating={Math.round(r.rating)} />
            <span className="text-sm text-zinc-400">{fmtNum(r.review_count)} reviews</span>
            {r.price && <span className="text-xs text-zinc-500">{r.price}</span>}
          </div>

          {r.categories?.length > 0 && <p className="text-xs text-zinc-500 mt-1">{r.categories.join(' · ')}</p>}
          {r.transactions?.length > 0 && (
            <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1.5">
              <Utensils className="w-3 h-3" /> {r.transactions.map((t) => TX_LABEL[t] || t).join(' · ')}
            </p>
          )}
          <div className="flex items-center gap-x-3 gap-y-1 flex-wrap mt-1 text-xs text-zinc-500">
            {r.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {r.phone}</span>}
            {r.address && <span className="flex items-center gap-1 min-w-0"><MapPin className="w-3 h-3 shrink-0" /> <span className="truncate">{r.address}</span></span>}
          </div>
        </div>
      </div>
    </div>
  )
}

function Kpi({ label, value }) {
  return (
    <div className="bg-[#101012] rounded-2xl border border-zinc-800 p-4">
      <p className="text-xl md:text-2xl font-bold text-zinc-50 flex items-center gap-2">{value}<span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-400 bg-emerald-500/10 rounded px-1.5 py-0.5">Live</span></p>
      <p className="text-sm text-zinc-500 truncate mt-0.5">{label}</p>
    </div>
  )
}

function Unavailable() {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 text-center">
      <Star className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
      <p className="font-medium text-zinc-200">Yelp data isn&apos;t available right now</p>
      <p className="text-sm text-zinc-500 mt-1">This page shows your live Yelp ratings on the deployed site.</p>
    </div>
  )
}
