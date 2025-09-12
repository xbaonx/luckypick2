import { useState, useEffect } from 'react'
import type React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useGameStore } from '../stores/gameStore'
import api from '../services/api'
import toast from 'react-hot-toast'

export default function GamePage() {
  const navigate = useNavigate()
  const { mode: routeModeParam } = useParams()
  const { user, token, updateBalance, loginAsGuest } = useAuthStore()
  const { 
    mode, 
    selectedNumbers, 
    betAmounts,
    defaultBetAmount,
    lastResult,
    lastWinAmount,
    isPlaying,
    setMode,
    toggleNumber,
    setBetAmount,
    setDefaultBetAmount,
    clearBets,
    setLastResult,
    setIsPlaying,
    getBets,
    selectNumbers,
    unselectNumbers,
    setAmountForSelected,
    selectRandom
  } = useGameStore()

  const [showResult, setShowResult] = useState(false)
  const [bulkAmount, setBulkAmount] = useState<number>(defaultBetAmount)
  const [replaceMode, setReplaceMode] = useState<boolean>(false)

  useEffect(() => {
    // Resolve mode from route; default to 'fun' if invalid
    const routeMode = routeModeParam === 'usdt' ? 'usdt' : 'fun'
    // Keep store mode in sync with route
    if (mode !== routeMode) {
      setMode(routeMode)
    }

    if (!user) {
      if (routeMode === 'fun') {
        // Auto-create guest session for Fun mode
        // Only do this if there's no existing token (avoid overriding registered session during hydration)
        if (!token) {
          (async () => {
            try {
              await loginAsGuest()
              toast.success('Welcome! You have 1000 FunCoins to play with!')
            } catch {
              toast.error('Failed to start guest session')
            }
          })()
        }
      } else {
        toast.error('Please register to play with USDT')
        navigate(`/register?redirect=${encodeURIComponent('/game/usdt')}`)
      }
    } else if (routeMode === 'usdt' && user.type !== 'registered') {
      toast.error('Please register to play with USDT')
      navigate(`/register?redirect=${encodeURIComponent('/game/usdt')}`)
    }
  }, [user, token, routeModeParam, mode, setMode, navigate, loginAsGuest])

  const handlePlay = async () => {
    // Guard: require registered account for USDT mode
    if (mode === 'usdt' && user!.type !== 'registered') {
      toast.error('Please register to play with USDT')
      navigate(`/register?redirect=${encodeURIComponent('/game/usdt')}`)
      return
    }

    const bets = getBets()
    if (bets.length === 0) {
      toast.error('Please select at least one number')
      return
    }

    const totalBet = bets.reduce((sum: number, bet: { amount: number }) => sum + bet.amount, 0)
    
    // Check balance
    if (mode === 'fun' && totalBet > user!.balanceFun) {
      toast.error('Insufficient FunCoin balance')
      return
    }
    if (mode === 'usdt' && totalBet > user!.balanceUsdt) {
      toast.error('Insufficient USDT balance')
      return
    }

    setIsPlaying(true)
    try {
      const response = await api.post('/game/play', {
        mode,
        numbers: bets.map((b: { number: number; amount: number }) => b.number),
        betAmounts: bets.map((b: { number: number; amount: number }) => b.amount)
      })

      const { result, winAmount, isWin, newBalance } = response.data
      
      // Update balance in store
      if (mode === 'fun') {
        updateBalance(newBalance, undefined)
      } else {
        updateBalance(undefined, newBalance)
      }

      // Show result
      setLastResult(result, winAmount)
      setShowResult(true)

      if (isWin) {
        toast.success(`🎉 Congratulations! You won ${winAmount} ${mode === 'fun' ? 'FunCoins' : 'USDT'}!`)
      } else {
        toast.error(`Better luck next time! The winning number was ${result}`)
      }
    } catch (error) {
      toast.error('Failed to play game')
    } finally {
      setIsPlaying(false)
    }
  }

  const handleClearBets = () => {
    clearBets()
    setShowResult(false)
  }

  const renderNumberGrid = () => {
    const numbers = []
    for (let i = 0; i < 100; i++) {
      const isSelected = selectedNumbers.includes(i)
      const betAmount = betAmounts.get(i) || defaultBetAmount
      const isWinning = showResult && i === lastResult

      numbers.push(
        <div
          key={i}
          onClick={() => !isPlaying && toggleNumber(i)}
          className={`
            relative cursor-pointer rounded-lg p-4 text-center font-bold transition-all
            ${isWinning ? 'bg-yellow-400 text-black animate-pulse ring-4 ring-yellow-300' : 
              isSelected ? 'bg-primary text-white' : 'bg-white/20 text-white hover:bg-white/30'}
          `}
        >
          <div className="text-lg">{i.toString().padStart(2, '0')}</div>
          {isSelected && (
            <input
              type="number"
              value={betAmount}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBetAmount(i, Number(e.target.value))}
              onClick={(e: React.MouseEvent<HTMLInputElement>) => e.stopPropagation()}
              className="mt-1 w-full bg-black/30 text-white text-xs px-1 py-0.5 rounded"
              min="1"
              max="1000"
            />
          )}
        </div>
      )
    }
    return numbers
  }

  // Quick select helpers
  const range = (start: number, end: number) => Array.from({ length: end - start + 1 }, (_, idx) => start + idx)
  const evens = range(0, 99).filter(n => n % 2 === 0)
  const odds = range(0, 99).filter(n => n % 2 === 1)
  const low = range(0, 49)
  const high = range(50, 99)

  const applySelect = (nums: number[], amount?: number) => {
    selectNumbers(nums, amount, replaceMode)
  }

  const handleApplyAmountToSelected = () => {
    if (selectedNumbers.length === 0) return
    setAmountForSelected(bulkAmount)
  }

  if (!user) return null

  return (
    <div className="text-white">
      <div className="glass-effect rounded-2xl p-4 sm:p-6 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h1 className="text-3xl font-bold">Lucky Pick 2</h1>
          <div className="flex items-center gap-3 flex-wrap">
            {/* Mode Selector */}
            <div className="flex bg-white/10 rounded-lg p-1">
              <button
                onClick={() => navigate('/game/fun')}
                disabled={isPlaying}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base rounded-lg transition ${
                  mode === 'fun' ? 'bg-yellow-500 text-black' : 'text-white hover:bg-white/10'
                }`}
              >
                🪙 FunCoin
              </button>
              {user.type === 'registered' && (
                <button
                  onClick={() => navigate('/game/usdt')}
                  disabled={isPlaying}
                  className={`px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base rounded-lg transition ${
                    mode === 'usdt' ? 'bg-green-500 text-white' : 'text-white hover:bg-white/10'
                  }`}
                >
                  💵 USDT
                </button>
              )}
            </div>

            {/* Balance Display */}
            <div className="text-sm sm:text-lg font-bold">
              Balance: {mode === 'fun' ? 
                `${user.balanceFun.toFixed(0)} FunCoins` : 
                `${user.balanceUsdt.toFixed(2)} USDT`
              }
            </div>

            {/* Mode banners & CTAs */}
            {mode === 'fun' && (
              <div className="ml-0 sm:ml-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
                <span className="text-sm bg-white/10 px-3 py-1 rounded">
                  You're in Fun mode (Demo)
                </span>
                <button
                  onClick={() => navigate('/game/usdt')}
                  className="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white text-sm px-3 py-1 rounded"
                >
                  Play with real USDT
                </button>
              </div>
            )}
            {mode === 'usdt' && user.type === 'registered' && user.balanceUsdt < Math.max(1, defaultBetAmount) && (
              <div className="ml-0 sm:ml-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
                <span className="text-sm bg-red-500/20 text-red-200 px-3 py-1 rounded">
                  Low USDT balance
                </span>
                <button
                  onClick={() => navigate('/deposit')}
                  className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white text-sm px-3 py-1 rounded"
                >
                  Deposit USDT
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Game Info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 text-center">
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-sm opacity-75">Win Rate</div>
            <div className="text-xl font-bold">
              {mode === 'fun' ? '5% (1/20)' : '1% (1/100)'}
            </div>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-sm opacity-75">Payout</div>
            <div className="text-xl font-bold">
              {mode === 'fun' ? '10x' : '70x'}
            </div>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-sm opacity-75">Default Bet</div>
            <input
              type="number"
              value={defaultBetAmount}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDefaultBetAmount(Number(e.target.value))}
              disabled={isPlaying}
              className="w-full bg-black/30 text-white text-xl font-bold px-2 py-1 rounded mt-1"
              min="1"
              max="1000"
            />
          </div>
        </div>

        {/* Result Display */}
        {showResult && (
          <div className="bg-black/30 rounded-lg p-4 mb-4 text-center">
            <div className="text-2xl mb-2">
              {lastWinAmount! > 0 ? '🎉 YOU WIN! 🎉' : '😔 Try Again'}
            </div>
            <div className="text-4xl font-bold text-yellow-400">
              Winning Number: {lastResult?.toString().padStart(2, '0')}
            </div>
            {lastWinAmount! > 0 && (
              <div className="text-2xl mt-2">
                Won: {lastWinAmount} {mode === 'fun' ? 'FunCoins' : 'USDT'}
              </div>
            )}
          </div>
        )}
        {/* Selection toolbar */}
        <div className="mb-4 space-y-3">
          {/* Replace/Append and Amount */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <label className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded">
              <input
                type="checkbox"
                checked={replaceMode}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReplaceMode(e.target.checked)}
              />
              <span className="text-sm">Replace selection</span>
            </label>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="number"
                value={bulkAmount}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBulkAmount(Number(e.target.value))}
                min={1}
                max={1000}
                className="w-full sm:w-28 bg-black/30 text-white text-sm px-2 py-2 rounded"
              />
              <button
                onClick={handleApplyAmountToSelected}
                disabled={isPlaying || selectedNumbers.length === 0}
                className="bg-yellow-500 hover:bg-yellow-600 text-black text-sm px-3 py-2 rounded disabled:opacity-50"
              >
                Apply to selected
              </button>
              {[1,5,10,20,50,100].map(a => (
                <button
                  key={a}
                  onClick={() => setBulkAmount(a)}
                  className={`text-sm px-2 py-1 rounded border border-white/20 ${bulkAmount===a ? 'bg-white/20' : 'hover:bg-white/10'}`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Select chips */}
          <div className="flex flex-wrap gap-2">
            <button onClick={() => applySelect(evens, bulkAmount)} className="text-xs sm:text-sm bg-white/10 hover:bg-white/20 px-3 py-1 rounded">Even</button>
            <button onClick={() => applySelect(odds, bulkAmount)} className="text-xs sm:text-sm bg-white/10 hover:bg-white/20 px-3 py-1 rounded">Odd</button>
            <button onClick={() => applySelect(low, bulkAmount)} className="text-xs sm:text-sm bg-white/10 hover:bg-white/20 px-3 py-1 rounded">0-49</button>
            <button onClick={() => applySelect(high, bulkAmount)} className="text-xs sm:text-sm bg-white/10 hover:bg-white/20 px-3 py-1 rounded">50-99</button>
            {[0,1,2,3,4,5,6,7,8,9].map(d => (
              <button key={d} onClick={() => applySelect(range(0,99).filter(n => n % 10 === d), bulkAmount)} className="text-xs sm:text-sm bg-white/10 hover:bg-white/20 px-3 py-1 rounded">x{d}</button>
            ))}
            <button onClick={() => selectRandom(5, bulkAmount, replaceMode)} className="text-xs sm:text-sm bg-white/10 hover:bg-white/20 px-3 py-1 rounded">Random 5</button>
            <button onClick={() => selectRandom(10, bulkAmount, replaceMode)} className="text-xs sm:text-sm bg-white/10 hover:bg-white/20 px-3 py-1 rounded">Random 10</button>
            <button onClick={() => selectRandom(20, bulkAmount, replaceMode)} className="text-xs sm:text-sm bg-white/10 hover:bg-white/20 px-3 py-1 rounded">Random 20</button>
            <button onClick={() => applySelect(range(0,99), bulkAmount)} className="text-xs sm:text-sm bg-white/10 hover:bg-white/20 px-3 py-1 rounded">Select All</button>
            <button onClick={() => unselectNumbers(selectedNumbers)} className="text-xs sm:text-sm bg-white/10 hover:bg-white/20 px-3 py-1 rounded">Clear</button>
          </div>
        </div>
        <div className="number-grid">
          {renderNumberGrid()}
        </div>
      </div>

      {/* Controls */}
      <div className="glass-effect rounded-2xl p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="text-sm sm:text-lg">
            Selected: <span className="font-bold text-yellow-400">{selectedNumbers.length}</span> numbers | 
            Total Bet: <span className="font-bold text-green-400">
              {getBets().reduce((sum: number, bet: { amount: number }) => sum + bet.amount, 0)} {mode === 'fun' ? 'FunCoins' : 'USDT'}
            </span>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:space-x-4 w-full sm:w-auto">
            <button
              onClick={handleClearBets}
              disabled={isPlaying || selectedNumbers.length === 0}
              className="w-full sm:w-auto bg-gray-500 hover:bg-gray-600 disabled:opacity-50 px-6 py-2 rounded-lg transition"
            >
              Clear
            </button>
            <button
              onClick={handlePlay}
              disabled={isPlaying || selectedNumbers.length === 0}
              className="w-full sm:w-auto bg-green-500 hover:bg-green-600 disabled:opacity-50 px-8 py-2 rounded-lg font-bold transition transform hover:scale-105"
            >
              {isPlaying ? 'Playing...' : 'PLAY'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
