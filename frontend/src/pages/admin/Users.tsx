import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../../services/api'

export default function AdminUsers() {
  const [selectedUser, setSelectedUser] = useState<any>(null)
  
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

  if (isLoading) {
    return <div className="text-white text-center">Loading users...</div>
  }

  return (
    <div className="text-white">
      <h1 className="text-3xl font-bold mb-8">User Management</h1>

      <div className="glass-effect rounded-xl p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">All Users</h2>
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
              {users?.map((user: any) => (
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
      </div>

      {selectedUser && userDetails && (
        <div className="glass-effect rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4">User Details: {selectedUser.email || `Guest-${selectedUser.id}`}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-bold mb-2">User Information</h3>
              <div className="space-y-2 text-sm">
                <div><span className="text-gray-400">ID:</span> {userDetails.user.id}</div>
                <div><span className="text-gray-400">Type:</span> {userDetails.user.type}</div>
                <div><span className="text-gray-400">Email:</span> {userDetails.user.email || 'N/A'}</div>
                <div><span className="text-gray-400">Wallet:</span> {userDetails.user.walletAddress || 'N/A'}</div>
                <div><span className="text-gray-400">Balance Fun:</span> {userDetails.user.balanceFun}</div>
                <div><span className="text-gray-400">Balance USDT:</span> {userDetails.user.balanceUsdt}</div>
              </div>
            </div>

            <div>
              <h3 className="font-bold mb-2">Recent Games</h3>
              <div className="space-y-2 text-sm max-h-40 overflow-y-auto">
                {userDetails.recentGames?.length > 0 ? (
                  userDetails.recentGames.map((game: any) => (
                    <div key={game.id} className="bg-white/5 p-2 rounded">
                      <div>{new Date(game.createdAt).toLocaleString()}</div>
                      <div>
                        Mode: {game.mode} | Bet: {game.totalBet} | 
                        {game.isWin ? <span className="text-green-400"> WIN +{game.winAmount}</span> : ' LOSS'}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-400">No games played</div>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={() => setSelectedUser(null)}
            className="mt-4 bg-gray-500 hover:bg-gray-600 px-4 py-2 rounded-lg transition"
          >
            Close Details
          </button>
        </div>
      )}
    </div>
  )
}
