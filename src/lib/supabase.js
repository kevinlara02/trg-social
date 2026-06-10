import { createClient } from '@supabase/supabase-js'
import { DEMO, demoClient } from './demo'

// Fall back to placeholders so the app still renders before .env is configured.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key'

// In DEMO mode we use an in-memory client with sample data; otherwise the real one.
export const supabase = DEMO ? demoClient : createClient(supabaseUrl, supabaseAnonKey)

// The 7 TRG restaurants. ids MUST match supabase/schema.sql.
export const LOCATIONS = [
  { id: 1, name: 'The Benediction', code: 'TB', sells_alcohol: false, color: '#A8A8A8' },
  { id: 2, name: 'Toast Whittier',  code: 'TW', sells_alcohol: false, color: '#F59E0B' },
  { id: 3, name: 'Story Whittier',  code: 'SW', sells_alcohol: true,  color: '#2F7D88' },
  { id: 4, name: 'Story Anaheim',   code: 'SA', sells_alcohol: true,  color: '#9D231E' },
  { id: 5, name: 'Story Brea',      code: 'SB', sells_alcohol: true,  color: '#3F3267' },
  { id: 6, name: 'Benny and Marys', code: 'BM', sells_alcohol: true,  color: '#B6904E' },
  { id: 7, name: 'Toast Downey',    code: 'TD', sells_alcohol: true,  color: '#DBA6A4' },
]

// Platforms and what each one can do:
//   hasReviews  -> shows on the Reviews page (Google, Yelp)
//   hasMessages -> shows on the Inbox page (Facebook, Instagram, Squarespace website)
//   canPublish  -> we can publish posts to it (Facebook, Instagram)
//   canReply    -> we can post a reply through it (everything except Yelp)
export const PLATFORMS = [
  { key: 'google',      name: 'Google',      short: 'G',  color: '#4285F4', hasReviews: true,  hasMessages: false, canReply: true,  canPublish: false },
  { key: 'yelp',        name: 'Yelp',        short: 'Y',  color: '#D32323', hasReviews: true,  hasMessages: false, canReply: false, canPublish: false },
  { key: 'opentable',   name: 'OpenTable',   short: 'OT', color: '#DA3743', hasReviews: true,  hasMessages: false, canReply: false, canPublish: false },
  { key: 'tripadvisor', name: 'Tripadvisor', short: 'TA', color: '#34E0A1', hasReviews: true,  hasMessages: false, canReply: false, canPublish: false },
  { key: 'facebook',    name: 'Facebook',    short: 'f',  color: '#1877F2', hasReviews: false, hasMessages: true,  canReply: true,  canPublish: true  },
  { key: 'instagram',   name: 'Instagram',   short: 'IG', color: '#E4405F', hasReviews: false, hasMessages: true,  canReply: true,  canPublish: true  },
  { key: 'squarespace', name: 'Squarespace', short: 'Sq', color: '#6B7280', hasReviews: false, hasMessages: true,  canReply: true,  canPublish: false },
]

export const ROLES = ['admin', 'manager', 'staff']
export const REVIEW_STATUSES = ['new', 'replied', 'archived']
export const POST_STATUSES = ['draft', 'scheduled', 'published', 'failed']

export const locationById = (id) => LOCATIONS.find((l) => l.id === Number(id)) || null
export const locationName = (id) => locationById(id)?.name || ''
export const platformByKey = (key) => PLATFORMS.find((p) => p.key === key) || null
export const platformName = (key) => platformByKey(key)?.name || key
export const reviewPlatforms = () => PLATFORMS.filter((p) => p.hasReviews)
export const inboxPlatforms = () => PLATFORMS.filter((p) => p.hasMessages)
export const publishPlatforms = () => PLATFORMS.filter((p) => p.canPublish)
