import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../stores/authStore'
import api from '../services/api'

export default function HistoryPage() {
  const { user } = useAuthStore()

  const { data: gameHistory, isLoading } = useQuery({
    queryKey: ['gameHistory'],
    queryFn: async () => {
      const response = await api.get('/game/history?limit=100')
      return response.data
    },
    enabled: !!user,
  })

  if (!user) return null

  return (
    <div className="text-white">
      <h1 className="text-3xl font-bold mb-8">Game History</h1>

      <div className="glass-effect rounded-2xl p-6">
        {isLoading ? (
          <div className="text-center py-4">Loading...</div>
        ) : gameHistory && gameHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left py-2">Date</th>
                  <th className="text-left py-2">Mode</th>
                  <th className="text-left py-2">Numbers</th>
                  <th className="text-left py-2">Total Bet</th>
                  <th className="text-left py-2">Result</th>
                  <th className="text-left py-2">Win Amount</th>
                  <th className="text-left py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {gameHistory.map((game: any) => (
                  <tr key={game.id} className="border-b border-white/10">
                    <td className="py-2">
                      {new Date(game.createdAt).toLocaleString()}
                    </td>
                    <td className="py-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        game.mode === 'fun' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'
                      }`}>
                        {game.mode.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2">
                      <div className="flex flex-wrap gap-1">
                        {game.numbers.map((num: number, idx: number) => (
                          <span key={idx} className="bg-white/10 px-2 py-1 rounded text-xs">
                            {num.toString().padStart(2, '0')}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-2">
                      {game.totalBet} {game.mode === 'fun' ? 'Fun' : 'USDT'}
                    </td>
                    <td className="py-2">
                      <span className="bg-primary px-2 py-1 rounded text-xs">
                        {game.result.toString().padStart(2, '0')}
                      </span>
                    </td>
                    <td className="py-2">
                      {game.winAmount > 0 ? (
                        <span className="text-green-400 font-bold">
                          +{game.winAmount} {game.mode === 'fun' ? 'Fun' : 'USDT'}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="py-2">
                      {game.isWin ? (
                        <span className="text-green-400">🎉 WIN</span>
                      ) : (
                        <span className="text-gray-400">LOSS</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-300">No games played yet</p>
        )}
      </div>
    </div>
  )
}
