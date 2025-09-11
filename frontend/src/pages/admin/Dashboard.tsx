import { useQuery } from '@tanstack/react-query'
import api from '../../services/api'

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['adminDashboard'],
    queryFn: async () => {
      const response = await api.get('/admin/dashboard')
      return response.data
    },
  })

  if (isLoading) {
    return <div className="text-white text-center">Loading dashboard...</div>
  }

  return (
    <div className="text-white">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="glass-effect rounded-xl p-6">
          <div className="text-4xl mb-2">👥</div>
          <div className="text-2xl font-bold">{stats?.users?.total || 0}</div>
          <div className="text-sm text-gray-300">Total Users</div>
          <div className="text-xs mt-2">
            <span className="text-green-400">{stats?.users?.registered || 0} registered</span> | 
            <span className="text-yellow-400"> {stats?.users?.guest || 0} guests</span>
          </div>
        </div>

        <div className="glass-effect rounded-xl p-6">
          <div className="text-4xl mb-2">🎮</div>
          <div className="text-2xl font-bold">{stats?.games?.totalGames || 0}</div>
          <div className="text-sm text-gray-300">Total Games</div>
          <div className="text-xs mt-2">
            Win Rate: <span className="text-green-400">{stats?.games?.winRate?.toFixed(2) || 0}%</span>
          </div>
        </div>

        <div className="glass-effect rounded-xl p-6">
          <div className="text-4xl mb-2">💰</div>
          <div className="text-2xl font-bold">${stats?.balances?.totalUsdt?.toFixed(2) || 0}</div>
          <div className="text-sm text-gray-300">Total USDT Balance</div>
          <div className="text-xs mt-2">
            FunCoins: <span className="text-yellow-400">{stats?.balances?.totalFun?.toFixed(0) || 0}</span>
          </div>
        </div>

        <div className="glass-effect rounded-xl p-6">
          <div className="text-4xl mb-2">💸</div>
          <div className="text-2xl font-bold">{stats?.withdraws?.pending || 0}</div>
          <div className="text-sm text-gray-300">Pending Withdrawals</div>
          <div className="text-xs mt-2">
            Amount: <span className="text-red-400">${stats?.withdraws?.pendingAmount?.toFixed(2) || 0}</span>
          </div>
        </div>
      </div>

      {/* Game Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-effect rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4">Game Statistics</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Total Games</span>
              <span className="font-bold">{stats?.games?.totalGames || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Wins</span>
              <span className="font-bold text-green-400">{stats?.games?.totalWins || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Fun Games</span>
              <span className="font-bold text-yellow-400">{stats?.games?.funGames || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>USDT Games</span>
              <span className="font-bold text-green-400">{stats?.games?.usdtGames || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Bet Amount</span>
              <span className="font-bold">${stats?.games?.totalBet?.toFixed(2) || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Payout</span>
              <span className="font-bold text-red-400">${stats?.games?.totalPayout?.toFixed(2) || 0}</span>
            </div>
          </div>
        </div>

        <div className="glass-effect rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <a href="/admin/withdraws" className="block bg-white/10 hover:bg-white/20 p-3 rounded-lg transition">
              Review Pending Withdrawals ({stats?.withdraws?.pending || 0})
            </a>
            <a href="/admin/users" className="block bg-white/10 hover:bg-white/20 p-3 rounded-lg transition">
              Manage Users
            </a>
            <a href="/admin/config" className="block bg-white/10 hover:bg-white/20 p-3 rounded-lg transition">
              Game Configuration
            </a>
            <a href="/admin/seed-setup" className="block bg-white/10 hover:bg-white/20 p-3 rounded-lg transition">
              Wallet Setup
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
