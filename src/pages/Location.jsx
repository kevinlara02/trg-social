import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, ExternalLink, Phone, MapPin, Heart, MessageCircle, Image as ImageIcon } from 'lucide-react'
import { LOCATIONS } from '../lib/supabase'
import { StarRating } from '../components/ui/Badge'
import { PlatformIcon } from '../components/ui/Platform'
import { getYelp, getLivePosts, getComments } from '../lib/live'

const locByCode = (code) => LOCATIONS.find((l) => l.code === code)
const fmtNum = (n) => (n == null ? '–' : n >= 1000 ? (n / 1000).toFixed(1).replace('.0', '') + 'k' : `${n}`)
const TX_LABEL = { delivery: 'Delivery', pickup: 'Pickup', restaurant_reservation: 'Reservations' }

export default function Location() {
  const { code } = useParams()
  const loc = locByCode(code)
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState({ yelp: null, posts: null, comments: null })

  useEffect(() => {
    let active = true
    setLoading(true)
    Promise.all([getYelp(), getLivePosts(), getComments()]).then(([yelp, posts, comments]) => {
      if (active) { setData({ yelp, posts, comments }); setLoading(false) }
    })
    return () => { active = false }
  }, [code])

  if (!loc) {
    return (
      <div className="p-4 md:p-8 max-w-5xl">
        <Link to="/reports" className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-200"><ArrowLeft className="w-4 h-4" /> All reports</Link>
        <p className="text-zinc-300 mt-6">Restaurant not found.</p>
      </div>
    )
  }

  const y = (data.yelp || []).find((r) => r.code === code)
  const p = (data.posts || []).find((r) => r.code === code)
  const cm = (data.comments || []).find((r) => r.code === code)
  const recentPosts = [...(p?.posts || [])].sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 6)
  const recentComments = [...(cm?.comments || [])].sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 8)

  return (
    <div className="p-4 md:p-8 max-w-5xl">
      <Link to="/reports" className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-200 mb-4"><ArrowLeft className="w-4 h-4" /> All reports</Link>
      <div className="flex items-center gap-3 mb-6">
        <span className="w-4 h-4 rounded-full" style={{ background: loc.color }} />
        <h1 className="text-2xl font-bold text-zinc-50">{loc.name}</h1>
        {y?.category && <span className="text-sm text-zinc-500">{y.category}</span>}
      </div>

      {loading ? (
        <p className="text-zinc-500 text-sm py-10 text-center">Loading…</p>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Kpi label="Yelp Rating" value={y?.rating != null ? y.rating.toFixed(1) + '★' : '–'} />
            <Kpi label="Instagram" value={fmtNum(p?.ig_followers)} sub="followers" />
            <Kpi label="Facebook" value={fmtNum(p?.fb_followers)} sub="followers" />
            <Kpi label="Instagram Posts" value={fmtNum(p?.ig_posts_count)} />
          </div>

          {y && (
            <section className="bg-[#101012] rounded-2xl border border-zinc-800 p-5 mb-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-semibold text-zinc-100 flex items-center gap-2"><PlatformIcon platform="yelp" size="sm" /> Yelp</h2>
                {y.url && <a href={y.url} target="_blank" rel="noreferrer" className="text-sm text-accent-400 hover:text-accent-300 inline-flex items-center gap-1">View on Yelp <ExternalLink className="w-3.5 h-3.5" /></a>}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {y.rating != null && <><span className="text-lg font-bold text-zinc-50">{y.rating.toFixed(1)}</span><StarRating rating={Math.round(y.rating)} /></>}
                <span className="text-sm text-zinc-400">{fmtNum(y.review_count)} reviews</span>
                {y.price && <span className="text-xs text-zinc-500">{y.price}</span>}
                {y.is_open_now === true && <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-400 bg-emerald-500/10 rounded px-1.5 py-0.5">Open now</span>}
                {y.is_open_now === false && <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 bg-zinc-800 rounded px-1.5 py-0.5">Closed</span>}
              </div>
              <div className="flex items-center gap-x-3 gap-y-1 flex-wrap mt-2 text-xs text-zinc-500">
                {y.transactions?.length > 0 && <span>{y.transactions.map((t) => TX_LABEL[t] || t).join(' · ')}</span>}
                {y.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {y.phone}</span>}
                {y.address && <span className="flex items-center gap-1 min-w-0"><MapPin className="w-3 h-3 shrink-0" /> <span className="truncate">{y.address}</span></span>}
              </div>
            </section>
          )}

          <section className="bg-[#101012] rounded-2xl border border-zinc-800 overflow-hidden mb-6">
            <div className="px-5 py-4 border-b border-zinc-800"><h2 className="font-semibold text-zinc-100">Recent posts</h2></div>
            <div className="p-4">
              {recentPosts.length ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {recentPosts.map((post) => <PostCard key={post.id} post={post} />)}
                </div>
              ) : <p className="text-sm text-zinc-600 text-center py-6">No recent posts</p>}
            </div>
          </section>

          <section className="bg-[#101012] rounded-2xl border border-zinc-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
              <h2 className="font-semibold text-zinc-100">Recent comments</h2>
              <Link to="/inbox" className="text-sm text-zinc-400 hover:text-zinc-200">Open Inbox</Link>
            </div>
            <div className="divide-y divide-zinc-800/60">
              {recentComments.length ? recentComments.map((c) => (
                <div key={c.id} className="px-5 py-3 flex items-start gap-3">
                  <PlatformIcon platform={c.network} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-zinc-200">{c.author}</p>
                    <p className="text-sm text-zinc-400">{c.text}</p>
                  </div>
                  <span className="text-xs text-zinc-600 shrink-0">{c.date ? c.date.slice(0, 10) : ''}</span>
                </div>
              )) : <p className="text-sm text-zinc-600 text-center py-6">No recent comments</p>}
            </div>
          </section>
        </>
      )}
    </div>
  )
}

function PostCard({ post }) {
  return (
    <a href={post.permalink || '#'} target="_blank" rel="noreferrer" className="block rounded-xl overflow-hidden border border-zinc-800 bg-[#0c0c0e] hover:border-zinc-600 transition-colors">
      {post.image ? (
        <img src={post.image} alt="" loading="lazy" className="w-full aspect-square object-cover" />
      ) : (
        <div className="w-full aspect-square flex items-center justify-center bg-zinc-900 text-zinc-700"><ImageIcon className="w-7 h-7" /></div>
      )}
      <div className="p-2.5">
        <div className="flex items-center gap-2 mb-1">
          <PlatformIcon platform={post.network} size="sm" />
          <span className="text-xs text-zinc-500 ml-auto">{post.date ? post.date.slice(0, 10) : ''}</span>
        </div>
        {post.caption && <p className="text-xs text-zinc-400 line-clamp-2 mb-1.5">{post.caption}</p>}
        <div className="flex items-center gap-3 text-xs text-zinc-500">
          {post.likes != null && <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{fmtNum(post.likes)}</span>}
          {post.comments != null && <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{fmtNum(post.comments)}</span>}
        </div>
      </div>
    </a>
  )
}

function Kpi({ label, value, sub }) {
  return (
    <div className="bg-[#101012] rounded-2xl border border-zinc-800 p-4">
      <p className="text-2xl font-bold text-zinc-50">{value}</p>
      <p className="text-sm text-zinc-500 truncate">{label}{sub ? ` ${sub}` : ''}</p>
    </div>
  )
}
