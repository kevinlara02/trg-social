import { useEffect, useState } from 'react'
import { CheckCircle2, Info } from 'lucide-react'
import { supabase, LOCATIONS, PLATFORMS, platformByKey } from '../lib/supabase'
import { PlatformIcon } from '../components/ui/Platform'
import { Modal } from '../components/ui/Modal'

// What each "Set up" button explains. Honest about platform limits + approvals.
const SETUP_NOTES = {
  google: {
    title: 'Connect Google',
    body: 'Lets you read and reply to Google reviews for this restaurant, straight from TRG Social. Uses Google\'s Business Profile API. Since you are already the verified owner, we just need Google to approve API access.',
    can: 'Read reviews · Reply to reviews',
  },
  yelp: {
    title: 'Connect Yelp',
    body: 'Yelp does not allow apps to reply to reviews. We can show your Yelp reviews here (read-only); to reply, use the button that opens Yelp for Business. We only need a free Yelp API key.',
    can: 'Read reviews · Reply on Yelp (link out)',
  },
  facebook: {
    title: 'Connect Facebook',
    body: 'Lets you read and reply to comments and messages, and publish posts to this restaurant\'s Facebook Page. Uses Meta\'s API and turns on once Meta approves the app.',
    can: 'Messages · Comments · Publish posts',
  },
  instagram: {
    title: 'Connect Instagram',
    body: 'Lets you read and reply to comments and DMs, and publish posts to this restaurant\'s Instagram. The account must be a Professional account linked to its Facebook Page.',
    can: 'DMs · Comments · Publish posts',
  },
  squarespace: {
    title: 'Connect Squarespace',
    body: 'Pulls in messages from this restaurant\'s Squarespace website (contact forms, reservation and catering inquiries) so your team can answer them here instead of digging through email.',
    can: 'Website inquiries · Reply by email',
  },
  opentable: {
    title: 'Connect OpenTable',
    body: 'Pulls in your OpenTable rating and recent diner reviews. OpenTable\'s data needs an approved partner connection. You reply from OpenTable\'s own dashboard, which also aggregates your Google, Yelp, Facebook, and Tripadvisor reviews in one place.',
    can: 'Read reviews · Reply on OpenTable',
  },
  tripadvisor: {
    title: 'Connect Tripadvisor',
    body: 'Pulls in your Tripadvisor rating, ranking, and up to the 5 most recent reviews (Tripadvisor\'s API caps it at 5). You reply from the Tripadvisor Management Center.',
    can: 'Read rating + recent reviews · Reply on Tripadvisor',
  },
}

export default function Connections() {
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [setup, setSetup] = useState(null) // { platform, location }

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      try {
        const { data } = await supabase
          .from('connected_accounts')
          .select('location_id, platform, status, display_name, username')
        if (active) setAccounts(data || [])
      } catch {
        if (active) setAccounts([])
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [])

  const find = (locId, plat) =>
    accounts.find((a) => a.location_id === locId && a.platform === plat) || null

  const connectedCount = accounts.filter((a) => a.status === 'connected').length
  const totalSlots = LOCATIONS.length * PLATFORMS.length

  return (
    <div className="p-4 md:p-8 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-50">Connections</h1>
        <p className="text-zinc-500 mt-1">Link each restaurant's accounts. {connectedCount} of {totalSlots} connected.</p>
      </div>

      <div className="bg-sky-500/10 border border-sky-500/20 rounded-2xl p-4 mb-6 flex gap-3">
        <Info className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium text-sky-100">Connecting turns on as approvals clear.</p>
          <p className="text-sky-200/70 mt-0.5">Google and Meta (Facebook + Instagram) each require a one-time business approval before connecting works. Tap any platform to see what it does and where it stands.</p>
        </div>
      </div>

      <div className="space-y-4">
        {LOCATIONS.map((loc) => (
          <div key={loc.id} className="bg-[#101012] rounded-2xl border border-zinc-800 overflow-hidden">
            <div className="px-5 py-3 border-b border-zinc-800 flex items-center gap-2" style={{ borderLeft: `4px solid ${loc.color}` }}>
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: loc.color }} />
              <p className="font-semibold text-zinc-100">{loc.name}</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 p-3">
              {PLATFORMS.map((p) => {
                const acct = find(loc.id, p.key)
                const connected = acct?.status === 'connected'
                return (
                  <div key={p.key} className="rounded-xl border border-zinc-800 bg-[#0c0c0e] p-3 flex flex-col items-center text-center gap-2">
                    <PlatformIcon platform={p.key} size="lg" />
                    <p className="text-sm font-medium text-zinc-200">{p.name}</p>
                    {connected ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-accent-400">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Connected
                      </span>
                    ) : (
                      <span className="text-xs text-zinc-500">Not connected</span>
                    )}
                    <button
                      onClick={() => setSetup({ platform: p.key, location: loc })}
                      className="mt-1 text-xs font-semibold px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-colors"
                    >
                      {connected ? 'Manage' : 'Set up'}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <Modal
        open={!!setup}
        onClose={() => setSetup(null)}
        title={setup ? SETUP_NOTES[setup.platform]?.title : ''}
      >
        {setup && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <PlatformIcon platform={setup.platform} size="lg" />
              <div>
                <p className="font-semibold text-zinc-100">{platformByKey(setup.platform)?.name}</p>
                <p className="text-sm text-zinc-500">{setup.location.name}</p>
              </div>
            </div>
            <p className="text-sm text-zinc-400">{SETUP_NOTES[setup.platform]?.body}</p>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">What you'll be able to do</p>
              <p className="text-sm text-zinc-200">{SETUP_NOTES[setup.platform]?.can}</p>
            </div>
            <button disabled className="w-full bg-zinc-800 text-zinc-500 font-semibold py-3 rounded-xl text-sm cursor-not-allowed">
              Connect (available after approval)
            </button>
          </div>
        )}
      </Modal>
    </div>
  )
}
