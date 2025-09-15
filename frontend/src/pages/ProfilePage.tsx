import { useAuthStore } from '../stores/authStore'
import { Link } from 'react-router-dom'

export default function ProfilePage() {
  const { user } = useAuthStore()

  if (!user) return null

  return (
    <div className="text-white">
      <h1 className="text-3xl font-bold mb-8">My Profile</h1>

      <div className="glass-effect rounded-2xl p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Account Information</h2>
        <div className="space-y-4">
          <div>
            <span className="text-gray-300">Account Type:</span>
            <span className="ml-2 font-bold">
              {user.type === 'guest' ? '🎮 Guest Account' : '💎 Registered Account'}
            </span>
          </div>
          {user.email && (
            <div>
              <span className="text-gray-300">Email:</span>
              <span className="ml-2 font-bold">{user.email}</span>
            </div>
          )}
          {user.walletAddress && (
            <div>
              <span className="text-gray-300">Wallet Address:</span>
              <div className="mt-1 bg-black/30 p-2 rounded font-mono text-sm break-all">
                {user.walletAddress}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="glass-effect rounded-2xl p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Balances</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-yellow-500/20 rounded-lg p-4">
            <div className="text-3xl mb-1">🪙</div>
            <div className="text-2xl font-bold">{user.balanceFun.toFixed(0)}</div>
            <div className="text-sm text-gray-300">FunCoins</div>
          </div>
          {user.type === 'registered' && (
            <div className="bg-green-500/20 rounded-lg p-4">
              <div className="text-3xl mb-1">💵</div>
              <div className="text-2xl font-bold">{user.balanceUsdt.toFixed(2)}</div>
              <div className="text-sm text-gray-300">USDT</div>
            </div>
          )}
        </div>
      </div>

      {user.type === 'guest' && (
        <div className="glass-effect rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Upgrade Your Account</h2>
          <p className="mb-4">
            Register now to unlock real money gaming with USDT!
          </p>
          <Link
            to="/register"
            className="inline-block bg-secondary hover:bg-secondary/80 px-6 py-3 rounded-lg font-bold transition"
          >
            Register Now
          </Link>
        </div>
      )}

      {user.type === 'registered' && (
        <div className="grid md:grid-cols-2 gap-6">
          <Link
            to="/deposit"
            className="glass-effect rounded-2xl p-6 hover:bg-white/10 transition"
          >
            <div className="text-3xl mb-2">💳</div>
            <h3 className="text-xl font-bold">Deposit USDT</h3>
            <p className="text-gray-300">Add funds via Transak</p>
          </Link>
          <Link
            to="/withdraw"
            className="glass-effect rounded-2xl p-6 hover:bg-white/10 transition"
          >
            <div className="text-3xl mb-2">💸</div>
            <h3 className="text-xl font-bold">Withdraw USDT</h3>
            <p className="text-gray-300">Cash out your winnings</p>
          </Link>
        </div>
      )}
    </div>
  )
}
