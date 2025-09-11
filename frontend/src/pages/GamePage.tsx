import { useState, useEffect } from 'react'
import type React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useGameStore } from '../stores/gameStore'
import api from '../services/api'
import toast from 'react-hot-toast'

export default function GamePage() {
  const navigate = useNavigate()
  const { user, updateBalance } = useAuthStore()
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
    getBets
  } = useGameStore()

  const [showResult, setShowResult] = useState(false)

  useEffect(() => {
    if (!user) {
      navigate('/login')
    }
  }, [user, navigate])

  const handlePlay = async () => {
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

  if (!user) return null

  return (
    <div className="text-white">
      <div className="glass-effect rounded-2xl p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold">Lucky Pick 2</h1>
          <div className="flex items-center space-x-4">
            {/* Mode Selector */}
            <div className="flex bg-white/10 rounded-lg p-1">
              <button
                onClick={() => setMode('fun')}
                disabled={isPlaying}
                className={`px-4 py-2 rounded-lg transition ${
                  mode === 'fun' ? 'bg-yellow-500 text-black' : 'text-white hover:bg-white/10'
                }`}
              >
                🪙 FunCoin
              </button>
              {user.type === 'registered' && (
                <button
                  onClick={() => setMode('usdt')}
                  disabled={isPlaying}
                  className={`px-4 py-2 rounded-lg transition ${
                    mode === 'usdt' ? 'bg-green-500 text-white' : 'text-white hover:bg-white/10'
                  }`}
                >
                  💵 USDT
                </button>
              )}
            </div>

            {/* Balance Display */}
            <div className="text-lg font-bold">
              Balance: {mode === 'fun' ? 
                `${user.balanceFun.toFixed(0)} FunCoins` : 
                `${user.balanceUsdt.toFixed(2)} USDT`
              }
            </div>
          </div>
        </div>

        {/* Game Info */}
        <div className="grid grid-cols-3 gap-4 mb-4 text-center">
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
      </div>

      {/* Number Grid */}
      <div className="glass-effect rounded-2xl p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Select Your Lucky Numbers</h2>
        <div className="number-grid">
          {renderNumberGrid()}
        </div>
      </div>

      {/* Controls */}
      <div className="glass-effect rounded-2xl p-6">
        <div className="flex justify-between items-center">
          <div className="text-lg">
            Selected: <span className="font-bold text-yellow-400">{selectedNumbers.length}</span> numbers | 
            Total Bet: <span className="font-bold text-green-400">
              {getBets().reduce((sum, bet) => sum + bet.amount, 0)} {mode === 'fun' ? 'FunCoins' : 'USDT'}
            </span>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={handleClearBets}
              disabled={isPlaying || selectedNumbers.length === 0}
              className="bg-gray-500 hover:bg-gray-600 disabled:opacity-50 px-6 py-2 rounded-lg transition"
            >
              Clear
            </button>
            <button
              onClick={handlePlay}
              disabled={isPlaying || selectedNumbers.length === 0}
              className="bg-green-500 hover:bg-green-600 disabled:opacity-50 px-8 py-2 rounded-lg font-bold transition transform hover:scale-105"
            >
              {isPlaying ? 'Playing...' : 'PLAY'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
