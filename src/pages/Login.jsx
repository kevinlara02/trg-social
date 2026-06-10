import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Megaphone } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const { signIn } = useAuth()
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

  return (
    <div
      className="min-h-screen bg-zinc-950 flex items-center justify-center p-4"
      style={{ backgroundImage: 'radial-gradient(60% 50% at 50% -10%, rgba(194,163,94,0.16), transparent)' }}
    >
      <div className="bg-[#101012] border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-sm p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-zinc-50">Digital Monitor</h1>
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
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-accent-500/40 focus:border-accent-500/50 text-base"
              placeholder="••••••••"
            />
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
      </div>
    </div>
  )
}
