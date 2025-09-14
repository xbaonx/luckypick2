import { useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import toast from 'react-hot-toast'

export default function AdminUsers() {
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [query, setQuery] = useState('')
  const [editFun, setEditFun] = useState<string>('')
  const [editUsdt, setEditUsdt] = useState<string>('')
  const [tab, setTab] = useState<'registered' | 'guest'>('registered')
  const qc = useQueryClient()
  
  const { data: users, isLoading } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: async () => {
      const response = await api.get('/users/all')
      return response.data
    },
  })

  const { data: userDetails } = useQuery({
    queryKey: ['userDetails', selectedUser?.id],
    queryFn: async () => {
      const response = await api.get(`/admin/user/${selectedUser.id}`)
      return response.data
    },
    enabled: !!selectedUser,
  })

  // Sync editable balances when details load
  useEffect(() => {
    if (userDetails?.user) {
      setEditFun(String(userDetails.user.balanceFun ?? ''))
      setEditUsdt(String(userDetails.user.balanceUsdt ?? ''))
    }
  }, [userDetails])

  // Filter and split lists into Registered vs Guests
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = users || []
    const byQuery = q
      ? list.filter((u: any) =>
          (u.email?.toLowerCase().includes(q)) ||
          (u.id?.toLowerCase().includes(q)) ||
          (u.walletAddress?.toLowerCase().includes(q))
        )
      : list
    return {
      registered: byQuery.filter((u: any) => u.type === 'registered'),
      guests: byQuery.filter((u: any) => u.type === 'guest'),
    }
  }, [users, query])

  // Save edited balances via admin endpoint
  const handleSaveBalance = async () => {
    if (!selectedUser) return
    try {
      const body: any = {}
      if (editFun !== '') body.balanceFun = Number(editFun)
      if (editUsdt !== '') body.balanceUsdt = Number(editUsdt)
      await api.put(`/admin/user/${selectedUser.id}/balance`, body)
      toast.success('Balances updated')
      await qc.invalidateQueries({ queryKey: ['userDetails', selectedUser.id] })
      await qc.invalidateQueries({ queryKey: ['adminUsers'] })
    } catch (e) {
      // Error toasts handled by interceptor
    }
  }

  if (isLoading) {
    return <div className="text-white text-center">Loading users...</div>
  }

  return (
    <div className="text-white">
      <h1 className="text-3xl font-bold mb-8">User Management</h1>

      <div className="glass-effect rounded-xl p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">All Users</h2>
        <div className="mb-4">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by email, ID or wallet"
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-yellow-400"
          />
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setTab('registered')}
            className={`px-3 py-1.5 rounded-lg transition ${tab === 'registered' ? 'bg-yellow-500 text-black' : 'bg-white/10 hover:bg-white/20'}`}
          >
            Registered
          </button>
          <button
            onClick={() => setTab('guest')}
            className={`px-3 py-1.5 rounded-lg transition ${tab === 'guest' ? 'bg-yellow-500 text-black' : 'bg-white/10 hover:bg-white/20'}`}
          >
            Guest
          </button>
        </div>

        {tab === 'registered' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left py-2">Email/ID</th>
                  <th className="text-left py-2">Type</th>
                  <th className="text-left py-2">Wallet</th>
                  <th className="text-left py-2">Balance Fun</th>
                  <th className="text-left py-2">Balance USDT</th>
                  <th className="text-left py-2">Created</th>
                  <th className="text-left py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.registered?.map((user: any) => (
                  <tr key={user.id} className="border-b border-white/10">
                    <td className="py-2">
                      {user.email || `Guest-${user.id.substring(0, 8)}`}
                      {user.isAdmin && <span className="ml-2 text-xs bg-red-500 px-1 rounded">ADMIN</span>}
                    </td>
                    <td className="py-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        user.type === 'registered' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {user.type}
                      </span>
                    </td>
                    <td className="py-2">
                      {user.walletAddress ? (
                        <span className="text-xs font-mono">
                          {user.walletAddress.substring(0, 6)}...{user.walletAddress.substring(38)}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="py-2">{Number(user.balanceFun).toFixed(0)}</td>
                    <td className="py-2">{Number(user.balanceUsdt).toFixed(2)}</td>
                    <td className="py-2">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-2">
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="text-blue-400 hover:underline text-sm"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'guest' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left py-2">ID</th>
                  <th className="text-left py-2">Type</th>
                  <th className="text-left py-2">Wallet</th>
                  <th className="text-left py-2">Balance Fun</th>
                  <th className="text-left py-2">Balance USDT</th>
                  <th className="text-left py-2">Created</th>
                  <th className="text-left py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.guests?.map((user: any) => (
                  <tr key={user.id} className="border-b border-white/10">
                    <td className="py-2">
                      {`Guest-${user.id.substring(0, 8)}`}
                      {user.isAdmin && <span className="ml-2 text-xs bg-red-500 px-1 rounded">ADMIN</span>}
                    </td>
                    <td className="py-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        user.type === 'registered' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {user.type}
                      </span>
                    </td>
                    <td className="py-2">
                      {user.walletAddress ? (
                        <span className="text-xs font-mono">
                          {user.walletAddress.substring(0, 6)}...{user.walletAddress.substring(38)}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="py-2">{Number(user.balanceFun).toFixed(0)}</td>
                    <td className="py-2">{Number(user.balanceUsdt).toFixed(2)}</td>
                    <td className="py-2">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-2">
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="text-blue-400 hover:underline text-sm"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedUser && userDetails && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSelectedUser(null)} />
          <div className="relative glass-effect w-full max-w-3xl mx-4 rounded-xl p-6 z-[61]">
            <button
              className="absolute top-3 right-3 bg-white/10 hover:bg-white/20 rounded-md px-3 py-1 text-sm"
              onClick={() => setSelectedUser(null)}
            >
              ✕
            </button>
            <h2 className="text-xl font-bold mb-4">User Details: {selectedUser.email || `Guest-${selectedUser.id}`}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-bold mb-2">User Information</h3>
                <div className="space-y-2 text-sm">
                  <div><span className="text-gray-400">ID:</span> {userDetails.user.id}</div>
                  <div><span className="text-gray-400">Type:</span> {userDetails.user.type}</div>
                  <div><span className="text-gray-400">Email:</span> {userDetails.user.email || 'N/A'}</div>
                  <div><span className="text-gray-400">Wallet:</span> {userDetails.user.walletAddress || 'N/A'}</div>
                  <div className="mt-4">
                    <h4 className="font-semibold mb-2">Edit Balances</h4>
                    <div className="space-y-2">
                      <label className="block text-xs text-gray-400">Fun Balance</label>
                      <input
                        type="number"
                        value={editFun}
                        onChange={(e) => setEditFun(e.target.value)}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-yellow-400"
                      />
                      <label className="block text-xs text-gray-400 mt-2">USDT Balance</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editUsdt}
                        onChange={(e) => setEditUsdt(e.target.value)}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-yellow-400"
                      />
                      <button
                        onClick={handleSaveBalance}
                        className="mt-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition"
                      >
                        Save Balances
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-bold mb-2">Recent Games</h3>
                <div className="space-y-2 text-sm max-h-60 overflow-y-auto">
                  {userDetails.recentGames?.length > 0 ? (
                    userDetails.recentGames.map((game: any) => (
                      <div key={game.id} className="bg-white/5 p-2 rounded">
                        <div>{new Date(game.createdAt).toLocaleString()}</div>
                        <div>
                          Mode: {game.mode} | Bet: {game.totalBet} | {game.isWin ? <span className="text-green-400"> WIN +{game.winAmount}</span> : ' LOSS'}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-400">No games played</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
