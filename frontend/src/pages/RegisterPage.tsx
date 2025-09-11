import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    try {
      await register(email, password)
      toast.success('Registration successful! Welcome to LuckyPick2!')
      navigate('/')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="glass-effect rounded-2xl p-8 w-full max-w-md text-white">
        <h2 className="text-3xl font-bold text-center mb-8 text-yellow-400">
          Register for LuckyPick2
        </h2>

        <div className="bg-green-500/20 border border-green-500 rounded-lg p-4 mb-6">
          <h3 className="font-bold mb-2">✨ Benefits of Registration:</h3>
          <ul className="text-sm space-y-1">
            <li>✅ Play with real USDT</li>
            <li>✅ 70x payout on wins</li>
            <li>✅ Deposit via MoonPay</li>
            <li>✅ Instant withdrawals</li>
            <li>✅ Personal wallet address</li>
          </ul>
        </div>

        <form onSubmit={handleRegister} className="space-y-6">
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
              minLength={6}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-yellow-400"
              placeholder="Enter your password (min 6 characters)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-yellow-400"
              placeholder="Confirm your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-secondary hover:bg-secondary/80 disabled:opacity-50 py-3 rounded-lg font-bold transition"
          >
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <p className="text-center mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-yellow-400 hover:underline">
            Login here
          </Link>
        </p>
      </div>
    </div>
  )
}
