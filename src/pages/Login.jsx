import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [linkSent, setLinkSent] = useState(false)
  const [linkLoading, setLinkLoading] = useState(false)
  const { signIn, signInWithLink } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const err = await signIn(email, password)
    if (err) {
      setError('Incorrect email or password. Please try again.')
      setLoading(false)
    } else {
      navigate('/dashboard')
    }
  }

  async function handleEmailLink() {
    setError('')
    if (!email) {
      setError('Type your email above first, then tap the link button.')
      return
    }
    setLinkLoading(true)
    const err = await signInWithLink(email)
    setLinkLoading(false)
    if (err) {
      setError('Could not send the link. Check the email and try again.')
    } else {
      setLinkSent(true)
    }
  }

  return (
    <div
      className="min-h-screen bg-zinc-950 flex items-center justify-center p-4"
      style={{ backgroundImage: 'radial-gradient(60% 50% at 50% -10%, rgba(194,163,94,0.16), transparent)' }}
    >
      <div className="bg-[#101012] border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-sm p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-zinc-50">TRG Digital Monitor</h1>
          <p className="text-zinc-500 mt-1">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Email</label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-accent-500/40 focus:border-accent-500/50 text-base"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-accent-500/40 focus:border-accent-500/50 text-base"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-zinc-500 hover:text-zinc-300"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-300 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent-500 hover:bg-accent-400 disabled:bg-zinc-700 disabled:text-zinc-400 text-zinc-950 font-semibold py-3.5 rounded-xl transition-colors text-base"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        {linkSent ? (
          <div className="mt-6 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 px-4 py-3 rounded-xl text-sm text-center">
            Check your email. We sent a sign-in link to <span className="font-medium">{email}</span>.
            Open it on this device to sign in, no password needed.
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 my-6">
              <div className="h-px flex-1 bg-zinc-800" />
              <span className="text-xs text-zinc-600 uppercase tracking-wide">or</span>
              <div className="h-px flex-1 bg-zinc-800" />
            </div>
            <button
              type="button"
              onClick={handleEmailLink}
              disabled={linkLoading}
              className="w-full border border-zinc-700 hover:border-zinc-600 hover:bg-zinc-900 disabled:opacity-50 text-zinc-200 font-medium py-3.5 rounded-xl transition-colors text-base"
            >
              {linkLoading ? 'Sending link…' : 'Email me a sign-in link'}
            </button>
            <p className="text-xs text-zinc-600 text-center mt-3">
              No password needed. We email you a link that signs you in.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
