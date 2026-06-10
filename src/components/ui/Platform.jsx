import { FaFacebookF, FaInstagram, FaYelp, FaSquarespace, FaTripadvisor } from 'react-icons/fa'
import { platformName } from '../../lib/supabase'

const SIZES = {
  sm: { box: 'w-6 h-6 rounded-md',  glyph: 13, textCls: 'text-[10px]' },
  md: { box: 'w-9 h-9 rounded-lg',  glyph: 18, textCls: 'text-xs' },
  lg: { box: 'w-11 h-11 rounded-xl', glyph: 22, textCls: 'text-sm' },
}

// Official multicolor Google "G".
function GoogleG({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
      <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
    </svg>
  )
}

// Official OpenTable mark (red on white).
function OpenTableMark({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <path fill="#DA3743" d="M40.776 8.776C27.95 8.776 17.553 19.173 17.553 32S27.95 55.224 40.776 55.224 64 44.827 64 32 53.603 8.776 40.776 8.776zm0 29.03A5.76 5.76 0 0 1 34.97 32a5.76 5.76 0 0 1 5.806-5.806A5.76 5.76 0 0 1 46.582 32c0 3.105-2.7 5.806-5.806 5.806zM0 32a5.76 5.76 0 0 1 5.806-5.806A5.76 5.76 0 0 1 11.612 32a5.76 5.76 0 0 1-5.806 5.806C2.565 37.806 0 35.105 0 32"/>
    </svg>
  )
}

const BRAND = {
  google:      { bg: '#fff', custom: GoogleG },
  yelp:        { bg: '#D32323', fg: '#fff', Icon: FaYelp },
  facebook:    { bg: '#1877F2', fg: '#fff', Icon: FaFacebookF },
  instagram:   { bg: 'radial-gradient(circle at 28% 108%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)', fg: '#fff', Icon: FaInstagram },
  squarespace: { bg: '#000', fg: '#fff', Icon: FaSquarespace, border: true },
  tripadvisor: { bg: '#34E0A1', fg: '#000', Icon: FaTripadvisor },
  opentable:   { bg: '#fff', custom: OpenTableMark },
}

// A rounded badge showing a platform's official logo (or initials when no logo exists).
export function PlatformIcon({ platform, size = 'md', className = '' }) {
  const b = BRAND[platform]
  const s = SIZES[size] || SIZES.md
  if (!b) return null
  const Custom = b.custom
  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 overflow-hidden ${s.box} ${b.border ? 'ring-1 ring-zinc-700' : ''} ${className}`}
      style={{ background: b.bg }}
      title={platformName(platform)}
    >
      {Custom ? <Custom size={s.glyph} />
        : b.text ? <span className={`font-bold ${s.textCls}`} style={{ color: b.fg }}>{b.text}</span>
        : <b.Icon size={s.glyph} color={b.fg} />}
    </span>
  )
}

export function PlatformBadge({ platform }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-200">
      <PlatformIcon platform={platform} size="sm" /> {platformName(platform)}
    </span>
  )
}
