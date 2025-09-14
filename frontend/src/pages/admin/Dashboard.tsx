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

  const { data: cronStatus } = useQuery({
    queryKey: ['cronStatus'],
    queryFn: async () => {
      const response = await api.get('/admin/cron/status')
      return response.data
    },
    refetchInterval: 10000, // Refresh every 10s
  })

  const { data: ctaMetrics } = useQuery({
    queryKey: ['ctaMetrics'],
    queryFn: async () => {
      const response = await api.get('/admin/metrics/cta?name=fun_win_usdt_upsell')
      return response.data
    },
  })

  const triggerScan = async () => {
    try {
      await api.post('/admin/cron/scan')
      // Refresh status after trigger
      setTimeout(() => window.location.reload(), 1000)
    } catch (error) {
      console.error('Failed to trigger scan:', error)
    }
  }

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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fun Mode Stats */}
        <div className="glass-effect rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4">Fun Mode</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Games</span>
              <span className="font-bold">{stats?.games?.funMode?.games || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Wins</span>
              <span className="font-bold text-green-400">{stats?.games?.funMode?.wins || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Win Rate</span>
              <span className="font-bold">{(stats?.games?.funMode?.winRate ?? 0).toFixed(2)}%</span>
            </div>
            <div className="flex justify-between">
              <span>Total Bet</span>
              <span className="font-bold text-yellow-300">{(stats?.games?.funMode?.totalBet ?? 0).toFixed(0)} Fun</span>
            </div>
            <div className="flex justify-between">
              <span>Total Payout</span>
              <span className="font-bold text-yellow-300">{(stats?.games?.funMode?.totalPayout ?? 0).toFixed(0)} Fun</span>
            </div>
            <div className="flex justify-between">
              <span>House Edge</span>
              <span className="font-bold text-blue-300">{(stats?.games?.funMode?.houseEdge ?? 0).toFixed(2)}%</span>
            </div>
          </div>
        </div>

        {/* USDT Mode Stats */}
        <div className="glass-effect rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4">USDT Mode</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Games</span>
              <span className="font-bold">{stats?.games?.usdtMode?.games || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Wins</span>
              <span className="font-bold text-green-400">{stats?.games?.usdtMode?.wins || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Win Rate</span>
              <span className="font-bold">{(stats?.games?.usdtMode?.winRate ?? 0).toFixed(2)}%</span>
            </div>
            <div className="flex justify-between">
              <span>Total Bet</span>
              <span className="font-bold">${(stats?.games?.usdtMode?.totalBet ?? 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Payout</span>
              <span className="font-bold text-red-400">${(stats?.games?.usdtMode?.totalPayout ?? 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>House Edge</span>
              <span className="font-bold text-blue-300">{(stats?.games?.usdtMode?.houseEdge ?? 0).toFixed(2)}%</span>
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

        {/* Deposit Scanner Status */}
        <div className="glass-effect rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4">Deposit Scanner</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Status</span>
              <span className={`font-bold ${cronStatus?.isScanning ? 'text-yellow-400' : 'text-green-400'}`}>
                {cronStatus?.isScanning ? 'Scanning...' : 'Idle'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Last Block</span>
              <span className="font-bold">{cronStatus?.lastProcessedBlock || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Current Block</span>
              <span className="font-bold">{cronStatus?.currentBlock || 0}</span>
            </div>
            <button
              onClick={triggerScan}
              disabled={cronStatus?.isScanning}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-3 py-2 rounded-lg transition"
            >
              {cronStatus?.isScanning ? 'Scanning...' : 'Trigger Scan Now'}
            </button>
          </div>
        </div>

        {/* CTA Metrics */}
        <div className="glass-effect rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4">CTA Performance</h2>
          <div className="space-y-3">
            {ctaMetrics?.fun_win_usdt_upsell ? Object.entries(ctaMetrics.fun_win_usdt_upsell).map(([variant, data]: [string, any]) => {
              const views = data.view || 0
              const clicks = data.click || 0
              const ctr = views > 0 ? ((clicks / views) * 100).toFixed(1) : '0.0'
              return (
                <div key={variant} className="border border-white/20 rounded-lg p-3">
                  <div className="font-semibold text-sm mb-2">{variant.replace('_', ' ').toUpperCase()}</div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <div className="text-gray-400">Views</div>
                      <div className="font-bold">{views}</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Clicks</div>
                      <div className="font-bold">{clicks}</div>
                    </div>
                    <div>
                      <div className="text-gray-400">CTR</div>
                      <div className="font-bold text-green-400">{ctr}%</div>
                    </div>
                  </div>
                </div>
              )
            }) : (
              <div className="text-gray-400 text-sm">No CTA data yet</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
