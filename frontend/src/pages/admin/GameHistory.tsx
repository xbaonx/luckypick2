import { useQuery } from '@tanstack/react-query'
import api from '../../services/api'

export default function AdminGameHistory() {
  const { data: games, isLoading } = useQuery({
    queryKey: ['adminGameHistory'],
    queryFn: async () => {
      const response = await api.get('/game/all-history?limit=200')
      return response.data
    },
  })

  if (isLoading) {
    return <div className="text-white text-center">Loading game history...</div>
  }

  return (
    <div className="text-white">
      <h1 className="text-3xl font-bold mb-8">Game History</h1>

      <div className="glass-effect rounded-xl p-6">
        <h2 className="text-xl font-bold mb-4">All Games</h2>
        
        {games && games.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left py-2">Date</th>
                  <th className="text-left py-2">User</th>
                  <th className="text-left py-2">Mode</th>
                  <th className="text-left py-2">Numbers</th>
                  <th className="text-left py-2">Total Bet</th>
                  <th className="text-left py-2">Result</th>
                  <th className="text-left py-2">Win Amount</th>
                  <th className="text-left py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {games.map((game: any) => (
                  <tr key={game.id} className="border-b border-white/10">
                    <td className="py-2">
                      {new Date(game.createdAt).toLocaleString()}
                    </td>
                    <td className="py-2">
                      {game.user?.email || `Guest-${game.userId.substring(0, 8)}`}
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
                        {game.numbers.slice(0, 5).map((num: number, idx: number) => (
                          <span key={idx} className="bg-white/10 px-1 py-0.5 rounded text-xs">
                            {num.toString().padStart(2, '0')}
                          </span>
                        ))}
                        {game.numbers.length > 5 && (
                          <span className="text-xs text-gray-400">+{game.numbers.length - 5} more</span>
                        )}
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
                          +{game.winAmount}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="py-2">
                      {game.isWin ? (
                        <span className="text-green-400">WIN</span>
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
