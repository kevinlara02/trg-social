import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Star, MessageSquare, CalendarClock, TrendingUp, Link2, ArrowRight } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { supabase, LOCATIONS, locationName } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { ReviewStatusBadge, StarRating } from '../components/ui/Badge'
import { PlatformIcon } from '../components/ui/Platform'
import { LocationDot, LocationBadge } from '../components/ui/Location'
import { fmt } from '../lib/datefmt'
import { eachDayOfInterval, startOfMonth, endOfMonth, format, parseISO } from 'date-fns'

const ABBREV = {
  'The Benediction': 'TB',
  'Toast Whittier': 'TW',
  'Story Whittier': 'SW',
  'Story Anaheim': 'SA',
  'Story Brea': 'SB',
  'Benny and Marys': 'BM',
  'Toast Downey': 'TD',
}

const abbrevName = (fullName) => ABBREV[fullName] || fullName

export default function Dashboard() {
  const { isAdmin, scopedLocationId } = useAuth()
  const [loc, setLoc] = useState(scopedLocationId || null)
  const [loading, setLoading] = useState(true)
  const [reviews, setReviews] = useState([])
  const [messages, setMessages] = useState([])
  const [posts, setPosts] = useState([])
  const [accounts, setAccounts] = useState([])

  const effectiveLoc = isAdmin ? loc : scopedLocationId

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      try {
        const [r, m, p, a] = await Promise.all([
          supabase.from('reviews')
            .select('id, location_id, platform, author_name, rating, body, review_date, status')
            .order('review_date', { ascending: false }).limit(100),
          supabase.from('messages')
            .select('id, location_id, platform, kind, status').eq('status', 'new'),
          supabase.from('posts')
            .select('id, caption, status, scheduled_at').eq('status', 'scheduled')
            .order('scheduled_at', { ascending: true }).limit(8),
          supabase.from('connected_accounts')
            .select('location_id, platform, status'),
        ])
        if (!active) return
        setReviews(r.data || [])
        setMessages(m.data || [])
        setPosts(p.data || [])
        setAccounts(a.data || [])
      } catch {
        if (active) { setReviews([]); setMessages([]); setPosts([]); setAccounts([]) }
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [])

  const byLoc = (arr) => (effectiveLoc ? arr.filter((x) => x.location_id === effectiveLoc) : arr)
  const reviewsF = byLoc(reviews)
  const messagesF = byLoc(messages)

  const newReviews = reviewsF.filter((r) => r.status === 'new').length
  const rated = reviewsF.filter((r) => r.rating)
  const avgRating = rated.length ? (rated.reduce((s, r) => s + Number(r.rating), 0) / rated.length).toFixed(1) : 'n/a'
  const recent = reviewsF.slice(0, 6)

  const connectedTotal = accounts.filter((x) => x.status === 'connected').length
  const showSetup = !loading && connectedTotal === 0
  const showTable = isAdmin && !effectiveLoc

  const ratingsTimelineData = buildTimelineData(reviewsF)
  const platformData = buildPlatformData(reviewsF)
  const ratingDistribution = buildRatingDistribution(reviewsF)
  const restaurantRatings = buildRestaurantRatings(reviewsF)

  return (
    <div className="p-4 md:p-8 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-zinc-50">Dashboard</h1>
          {effectiveLoc && <LocationBadge id={effectiveLoc} />}
        </div>
        {isAdmin && (
          <select
            value={loc || ''}
            onChange={(e) => setLoc(e.target.value ? Number(e.target.value) : null)}
            className="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-sm text-zinc-200"
          >
            <option value="">All Locations</option>
            {LOCATIONS.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        )}
      </div>

      {showSetup && (
        <Link to="/connections" className="block mb-6 rounded-2xl bg-gradient-to-r from-accent-500/15 to-accent-500/5 border border-accent-500/25 p-5 sm:p-6 hover:from-accent-500/20 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-accent-500/20 text-accent-400 flex items-center justify-center shrink-0">
              <Link2 className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-zinc-50">Let's connect your accounts</p>
              <p className="text-sm text-zinc-400">Link each restaurant's Google, Yelp, Facebook, and Instagram to start seeing reviews and messages here.</p>
            </div>
            <ArrowRight className="w-5 h-5 shrink-0 text-accent-400" />
          </div>
        </Link>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Star} label="New Reviews" value={newReviews} loading={loading} />
        <StatCard icon={MessageSquare} label="Unread Messages" value={messagesF.length} loading={loading} />
        <StatCard icon={TrendingUp} label="Avg Rating" value={avgRating} loading={loading} />
        <StatCard icon={CalendarClock} label="Scheduled Posts" value={posts.length} loading={loading} />
      </div>

      {loading ? (
        <div className="text-center py-12 text-zinc-400">Loading charts...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="bg-[#101012] rounded-2xl border border-zinc-800 p-4 md:p-6">
              <h3 className="font-semibold text-zinc-100 mb-4 text-sm md:text-base">Ratings Over Time</h3>
              <ResponsiveContainer width="100%" height={200} minHeight={200}>
                <LineChart data={ratingsTimelineData} margin={{ left: -20, right: 0, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="date" stroke="#71717a" style={{ fontSize: '11px' }} tick={{ fontSize: 10 }} />
                  <YAxis stroke="#71717a" style={{ fontSize: '11px' }} tick={{ fontSize: 10 }} domain={[0, 5]} width={30} />
                  <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', color: '#fafafa', fontSize: '12px' }} />
                  <Line type="monotone" dataKey="rating" stroke="#71717a" strokeWidth={2} dot={{ fill: '#71717a', r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-[#101012] rounded-2xl border border-zinc-800 p-4 md:p-6">
              <h3 className="font-semibold text-zinc-100 mb-4 text-sm md:text-base">Rating Distribution</h3>
              <ResponsiveContainer width="100%" height={200} minHeight={200}>
                <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                  <Pie data={ratingDistribution} cx="50%" cy="50%" labelLine={false} label={(entry) => `${entry.value}`} outerRadius={70} fill="#71717a" dataKey="value">
                    {ratingDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e'][index] || '#71717a'} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', color: '#fafafa', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-[#101012] rounded-2xl border border-zinc-800 p-4 md:p-6">
              <h3 className="font-semibold text-zinc-100 mb-4 text-sm md:text-base">Avg Rating by Restaurant</h3>
              <ResponsiveContainer width="100%" height={200} minHeight={200}>
                <BarChart data={restaurantRatings} margin={{ left: -20, right: 0, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="abbrev" stroke="#71717a" style={{ fontSize: '11px' }} tick={{ fontSize: 10 }} />
                  <YAxis stroke="#71717a" style={{ fontSize: '11px' }} tick={{ fontSize: 10 }} domain={[0, 5]} width={30} />
                  <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', color: '#fafafa', fontSize: '12px' }} formatter={(value) => value.toFixed(1)} />
                  <Bar dataKey="rating" radius={[8, 8, 0, 0]}>
                    {restaurantRatings.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 mb-6">
            <div className="bg-[#101012] rounded-2xl border border-zinc-800 p-4 md:p-6">
              <h3 className="font-semibold text-zinc-100 mb-4 text-sm md:text-base">Reviews by Platform</h3>
              <ResponsiveContainer width="100%" height={200} minHeight={200}>
                <BarChart data={platformData} margin={{ left: -20, right: 0, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="platform" stroke="#71717a" style={{ fontSize: '11px' }} tick={{ fontSize: 10 }} />
                  <YAxis stroke="#71717a" style={{ fontSize: '11px' }} tick={{ fontSize: 10 }} width={30} />
                  <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', color: '#fafafa', fontSize: '12px' }} />
                  <Bar dataKey="count" fill="#71717a" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {showTable && (
            <div className="bg-[#101012] rounded-2xl border border-zinc-800 overflow-hidden mb-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider border-b border-zinc-800">
                      <th className="py-3 px-5">Restaurant</th>
                      <th className="py-3 px-3 text-right">New Reviews</th>
                      <th className="py-3 px-3 text-right">Unread</th>
                      <th className="py-3 px-5 text-right">Avg Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {LOCATIONS.map((l) => {
                      const rv = reviews.filter((r) => r.location_id === l.id)
                      const nr = rv.filter((r) => r.status === 'new').length
                      const un = messages.filter((m) => m.location_id === l.id).length
                      const rd = rv.filter((r) => r.rating)
                      const avg = rd.length ? (rd.reduce((s, r) => s + Number(r.rating), 0) / rd.length).toFixed(1) : null
                      return (
                        <tr
                          key={l.id}
                          onClick={() => setLoc(l.id)}
                          className="border-b border-zinc-800/60 last:border-0 hover:bg-zinc-900 cursor-pointer"
                        >
                          <td className="py-3 px-5" style={{ borderLeft: `4px solid ${l.color}` }}>
                            <span className="inline-flex items-center gap-2 font-medium text-zinc-200">
                              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: l.color }} />
                              {l.name}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-medium">{nr > 0 ? <span className="text-zinc-100">{nr}</span> : <span className="text-zinc-600">0</span>}</td>
                          <td className="py-3 px-3 text-right font-medium">{un > 0 ? <span className="text-zinc-100">{un}</span> : <span className="text-zinc-600">0</span>}</td>
                          <td className="py-3 px-5 text-right font-semibold text-accent-400">{avg || <span className="text-zinc-600 font-medium">n/a</span>}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="bg-[#101012] rounded-2xl border border-zinc-800 overflow-hidden">
              <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
                <h2 className="font-semibold text-zinc-100">Recent Reviews</h2>
                <Link to="/reviews" className="text-sm text-zinc-400 hover:text-zinc-200">View all</Link>
              </div>
              {recent.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <Star className="w-6 h-6 text-zinc-600 mx-auto mb-2" />
                  <p className="text-zinc-500 text-sm">No reviews yet</p>
                </div>
              ) : (
                <ul className="divide-y divide-zinc-800/60">
                  {recent.map((rev) => (
                    <li key={rev.id} className="px-5 py-3 flex items-start gap-3">
                      <PlatformIcon platform={rev.platform} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-zinc-100 text-sm truncate">{rev.author_name || 'Guest'}</p>
                          {rev.rating ? <StarRating rating={rev.rating} /> : null}
                        </div>
                        <p className="text-xs text-zinc-500 truncate flex items-center gap-1.5">
                          <LocationDot id={rev.location_id} />{locationName(rev.location_id)}
                        </p>
                        {rev.body && <p className="text-sm text-zinc-400 mt-1 line-clamp-2">{rev.body}</p>}
                      </div>
                      <ReviewStatusBadge status={rev.status} />
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="bg-[#101012] rounded-2xl border border-zinc-800 overflow-hidden">
              <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
                <h2 className="font-semibold text-zinc-100">Scheduled Posts</h2>
                <Link to="/publish" className="text-sm text-zinc-400 hover:text-zinc-200">Open Publish</Link>
              </div>
              {posts.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <CalendarClock className="w-6 h-6 text-zinc-600 mx-auto mb-2" />
                  <p className="text-zinc-500 text-sm">Nothing scheduled</p>
                </div>
              ) : (
                <ul className="divide-y divide-zinc-800/60">
                  {posts.map((post) => (
                    <li key={post.id} className="px-5 py-3 flex items-center justify-between gap-3">
                      <p className="text-sm text-zinc-200 truncate flex-1">{post.caption || 'Untitled post'}</p>
                      <span className="text-xs text-zinc-500 shrink-0">{fmt(post.scheduled_at)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  )
}

function StatCard({ icon: Icon, label, value, loading }) {
  return (
    <div className="bg-[#101012] rounded-2xl border border-zinc-800 p-5 flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-accent-500/10 text-accent-400">
        <Icon className="w-6 h-6" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-zinc-50">{loading ? '…' : value}</p>
        <p className="text-sm text-zinc-500 truncate">{label}</p>
      </div>
    </div>
  )
}

function buildTimelineData(reviews) {
  if (!reviews.length) return []
  const now = new Date()
  const month = startOfMonth(now)
  const end = endOfMonth(now)
  const days = eachDayOfInterval({ start: month, end })

  const grouped = {}
  days.forEach((d) => {
    grouped[format(d, 'yyyy-MM-dd')] = []
  })

  reviews.forEach((r) => {
    if (r.review_date) {
      const key = format(parseISO(r.review_date), 'yyyy-MM-dd')
      if (grouped[key]) grouped[key].push(r)
    }
  })

  return days.map((d) => {
    const key = format(d, 'yyyy-MM-dd')
    const dayReviews = grouped[key].filter((r) => r.rating)
    const avg = dayReviews.length ? dayReviews.reduce((s, r) => s + Number(r.rating), 0) / dayReviews.length : null
    return {
      date: format(d, 'MMM dd'),
      rating: avg ? parseFloat(avg.toFixed(1)) : null,
    }
  }).filter((d) => d.rating !== null)
}

function buildPlatformData(reviews) {
  const platforms = {}
  reviews.forEach((r) => {
    platforms[r.platform] = (platforms[r.platform] || 0) + 1
  })
  return Object.entries(platforms).map(([platform, count]) => ({
    platform: platform.charAt(0).toUpperCase() + platform.slice(1),
    count,
  }))
}

function buildRatingDistribution(reviews) {
  const counts = { '1 Star': 0, '2 Stars': 0, '3 Stars': 0, '4 Stars': 0, '5 Stars': 0 }
  reviews.forEach((r) => {
    if (r.rating) {
      const rating = Math.round(Number(r.rating))
      if (rating === 1) counts['1 Star']++
      else if (rating === 2) counts['2 Stars']++
      else if (rating === 3) counts['3 Stars']++
      else if (rating === 4) counts['4 Stars']++
      else if (rating === 5) counts['5 Stars']++
    }
  })
  return Object.entries(counts).map(([name, value]) => ({ name, value })).filter((d) => d.value > 0)
}

function buildRestaurantRatings(reviews) {
  const byLoc = {}
  LOCATIONS.forEach((l) => { byLoc[l.id] = [] })
  reviews.forEach((r) => { if (r.rating && byLoc[r.location_id]) byLoc[r.location_id].push(Number(r.rating)) })
  return LOCATIONS
    .map((l) => {
      const ratings = byLoc[l.id]
      const avg = ratings.length ? ratings.reduce((s, r) => s + r, 0) / ratings.length : 0
      return { abbrev: abbrevName(l.name), rating: avg > 0 ? parseFloat(avg.toFixed(1)) : 0, color: l.color }
    })
    .filter((d) => d.rating > 0)
}
