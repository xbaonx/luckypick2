import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import api from '../../services/api'

export default function AdminGameHistory() {
  const { data: games, isLoading } = useQuery({
    queryKey: ['adminGameHistory'],
    queryFn: async () => {
      const response = await api.get('/game/all-history?limit=200')
      return response.data
    },
  })

  // Pagination state
  const [page, setPage] = useState(1)
  const [playerFilter, setPlayerFilter] = useState('')
  const [modeFilter, setModeFilter] = useState<'all' | 'fun' | 'usdt'>('all')
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')
  const pageSize = 20
  const normalized = useMemo(() => {
    const list = games || []
    const term = playerFilter.trim().toLowerCase()
    const fromTs = dateFrom ? new Date(dateFrom + 'T00:00:00').getTime() : null
    const toTs = dateTo ? new Date(dateTo + 'T23:59:59').getTime() : null
    return list.filter((g: any) => {
      // text filter
      if (term) {
        const email = (g.user?.email || '').toLowerCase()
        const userId = (g.userId || '').toLowerCase()
        if (!email.includes(term) && !userId.includes(term)) return false
      }
      // mode filter
      if (modeFilter !== 'all' && g.mode !== modeFilter) return false
      // date range filter
      const ts = new Date(g.createdAt).getTime()
      if (fromTs && ts < fromTs) return false
      if (toTs && ts > toTs) return false
      return true
    })
  }, [games, playerFilter, modeFilter, dateFrom, dateTo])

  const total = normalized.length || 0
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const current = Math.min(page, pageCount)
  const visible = useMemo(() => {
    return (normalized || []).slice((current - 1) * pageSize, current * pageSize)
  }, [normalized, current])

  useEffect(() => {
    setPage(1)
  }, [total])

  if (isLoading) {
    return <div className="text-white text-center">Loading game history...</div>
  }

  return (
    <div className="text-white">
      <h1 className="text-3xl font-bold mb-8">Game History</h1>

      <div className="glass-effect rounded-xl p-6">
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <h2 className="text-xl font-bold">All Games</h2>
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={modeFilter}
              onChange={(e) => { setModeFilter(e.target.value as any); setPage(1) }}
              className="bg-black/40 text-white px-3 py-2 rounded-lg border border-white/10 focus:border-yellow-400 outline-none text-sm"
            >
              <option value="all">All modes</option>
              <option value="fun">Fun</option>
              <option value="usdt">USDT</option>
            </select>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
              className="bg-black/40 text-white px-3 py-2 rounded-lg border border-white/10 focus:border-yellow-400 outline-none text-sm"
            />
            <span className="text-white/60 text-sm">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
              className="bg-black/40 text-white px-3 py-2 rounded-lg border border-white/10 focus:border-yellow-400 outline-none text-sm"
            />
            <input
              type="text"
              value={playerFilter}
              onChange={(e) => { setPlayerFilter(e.target.value); setPage(1) }}
              placeholder="Filter by email or user ID"
              className="bg-black/40 text-white px-3 py-2 rounded-lg border border-white/10 focus:border-yellow-400 outline-none text-sm min-w-[260px]"
            />
          </div>
        </div>
        
        {normalized && normalized.length > 0 ? (
          <div className="overflow-x-auto">
            {/* Top Pagination */}
            <div className="flex items-center justify-between mb-2 text-sm bg-white/5 rounded-lg px-3 py-2">
              <div>Page {current} of {pageCount}</div>
              <div className="flex gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded">Prev</button>
                <button onClick={() => setPage((p) => Math.min(pageCount, p + 1))} className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded">Next</button>
              </div>
            </div>
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
                {visible.map((game: any) => (
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
            {/* Bottom Pagination */}
            <div className="flex items-center justify-between mt-3 text-sm">
              <div>Page {current} of {pageCount}</div>
              <div className="flex gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded">Prev</button>
                <button onClick={() => setPage((p) => Math.min(pageCount, p + 1))} className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded">Next</button>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-gray-300">No games played yet</p>
        )}
      </div>
    </div>
  )
}
