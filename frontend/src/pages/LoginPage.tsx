import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get('redirect') || '/'
  const { login, loginAsGuest } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(email, password)
      toast.success('Welcome back!')
      navigate(redirect)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleGuestLogin = async () => {
    setLoading(true)
    try {
      await loginAsGuest()
      toast.success('Welcome! You have 1000 FunCoins to play with!')
      navigate('/game/fun')
    } catch (error) {
      toast.error('Failed to start guest session')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="glass-effect rounded-2xl p-8 w-full max-w-md text-white">
        <h2 className="text-3xl font-bold text-center mb-8 text-yellow-400">
          Login to LuckyPick2
        </h2>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-yellow-400"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-yellow-400"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/80 disabled:opacity-50 py-3 rounded-lg font-bold transition"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/20"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-transparent">OR</span>
          </div>
        </div>

        <button
          onClick={handleGuestLogin}
          disabled={loading}
          className="w-full bg-yellow-500 hover:bg-yellow-600 text-black disabled:opacity-50 py-3 rounded-lg font-bold transition"
        >
          Play as Guest (FunCoins Only)
        </button>

        <p className="text-center mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-yellow-400 hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  )
}
