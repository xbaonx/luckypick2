import { useState, useEffect } from 'react'
import type React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useGameStore } from '../stores/gameStore'
import api from '../services/api'
import toast from 'react-hot-toast'
import {
  SparklesIcon,
  CheckCircleIcon,
  XMarkIcon,
  ArrowDownCircleIcon,
  ArrowUpCircleIcon,
  AdjustmentsHorizontalIcon,
  AdjustmentsVerticalIcon,
  PlayCircleIcon,
} from '@heroicons/react/24/outline'

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
    <div className="text-white pb-sticky-safe">
      <div className="glass-effect rounded-2xl p-4 sm:p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <h1 className="text-3xl font-bold">Lucky Pick 2</h1>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
            {/* Mode Selector */}
            <div className="flex bg-white/10 rounded-lg p-1">
              <button
                onClick={() => navigate('/game/fun')}
                disabled={isPlaying}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base rounded-lg transition ${
                  mode === 'fun' ? 'bg-yellow-500 text-black' : 'text-white hover:bg-white/10'
                }`}
              >
                FunCoin
              </button>
              {user.type === 'registered' && (
                <button
                  onClick={() => navigate('/game/usdt')}
                  disabled={isPlaying}
                  className={`px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base rounded-lg transition ${
                    mode === 'usdt' ? 'bg-green-500 text-white' : 'text-white hover:bg-white/10'
                  }`}
                >
                  USDT
                </button>
              )}
            </div>

            {/* Balance Display - Mobile Optimized */}
            <div className="bg-white/10 rounded-lg px-4 py-3 text-center sm:text-left">
              <div className="text-xs text-white/70 uppercase tracking-wide mb-1">Balance</div>
              <div className="text-lg sm:text-xl font-bold text-yellow-400">
                {mode === 'fun' ? 
                  `${user.balanceFun.toFixed(0)} FunCoins` : 
                  `${user.balanceUsdt.toFixed(2)} USDT`
                }
              </div>
            </div>

            {/* Mode banners & CTAs - Mobile Optimized */}
            {mode === 'fun' && (
              <div className="bg-yellow-500/10 border-l-4 border-yellow-500 rounded-lg p-3 w-full lg:max-w-md">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="text-sm text-yellow-200 flex-1">
                    🎮 You're in Fun mode (Demo)
                  </span>
                  <button
                    onClick={() => navigate('/game/usdt')}
                    className="bg-green-500 hover:bg-green-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                  >
                    💵 Play with real USDT
                  </button>
                </div>
              </div>
            )}
            {mode === 'usdt' && user.type === 'registered' && user.balanceUsdt < Math.max(1, defaultBetAmount) && (
              <div className="bg-red-500/10 border-l-4 border-red-500 rounded-lg p-3 w-full lg:max-w-md">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="text-sm text-red-200 flex-1">
                    ⚠️ Low USDT balance
                  </span>
                  <button
                    onClick={() => navigate('/deposit')}
                    className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                  >
                    💳 Deposit USDT
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Game Info - Mobile Optimized */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 text-center">
          <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-400/20 rounded-xl p-4">
            <div className="text-xs sm:text-sm text-blue-200 mb-1">Win Rate</div>
            <div className="text-lg sm:text-xl font-bold text-blue-100">
              {mode === 'fun' ? '5%' : '1%'}
            </div>
            <div className="text-xs text-blue-300 mt-1">
              {mode === 'fun' ? '(1/20)' : '(1/100)'}
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-400/20 rounded-xl p-4">
            <div className="text-xs sm:text-sm text-green-200 mb-1">Payout</div>
            <div className="text-lg sm:text-xl font-bold text-green-100">
              {mode === 'fun' ? '10x' : '70x'}
            </div>
            <div className="text-xs text-green-300 mt-1">multiplier</div>
          </div>
          <div className="col-span-2 sm:col-span-1 bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border border-yellow-400/20 rounded-xl p-4">
            <div className="text-xs sm:text-sm text-yellow-200 mb-2">Default Bet</div>
            <input
              type="number"
              value={defaultBetAmount}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDefaultBetAmount(Number(e.target.value))}
              disabled={isPlaying}
              className="w-full bg-black/40 text-white text-lg sm:text-xl font-bold px-3 py-2 rounded-lg border border-yellow-400/30 focus:border-yellow-400 focus:outline-none text-center"
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
        {/* Mobile-optimized Selection toolbar */}
        <div className="mb-4 space-y-4">
          {/* Bulk Amount Control - Mobile First */}
          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex flex-col space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Bulk Amount</span>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={replaceMode}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReplaceMode(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Replace</span>
                </label>
              </div>
              
              <div className="flex gap-2">
                <input
                  type="number"
                  value={bulkAmount}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBulkAmount(Number(e.target.value))}
                  min={1}
                  max={1000}
                  className="flex-1 bg-black/30 text-white text-lg px-4 py-3 rounded-lg border border-white/20 focus:border-yellow-400 focus:outline-none"
                  placeholder="Enter amount"
                />
                <button
                  onClick={handleApplyAmountToSelected}
                  disabled={isPlaying || selectedNumbers.length === 0}
                  className="bg-yellow-500 hover:bg-yellow-600 text-black font-medium px-4 py-3 rounded-lg disabled:opacity-50 whitespace-nowrap"
                >
                  Apply
                </button>
              </div>
              
              {/* Amount Presets - Mobile optimized */}
              <div className="grid grid-cols-6 gap-2">
                {[1,5,10,20,50,100].map(a => (
                  <button
                    key={a}
                    onClick={() => setBulkAmount(a)}
                    className={`py-2 px-1 text-sm rounded-lg border border-white/20 transition-all ${
                      bulkAmount === a ? 'bg-yellow-500 border-yellow-400 text-black font-bold' : 'bg-white/10 hover:bg-white/20 text-white'
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Select - Mobile Grid */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-white/80 flex items-center gap-2">
              Quick Select
            </h4>
            
            {/* Pattern Filters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button onClick={() => applySelect(evens, bulkAmount)} className="py-3 px-4 text-sm bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/20 text-blue-200 rounded-lg font-medium flex items-center justify-center gap-2">
                <AdjustmentsHorizontalIcon className="h-4 w-4" />
                <span>Even</span>
              </button>
              <button onClick={() => applySelect(odds, bulkAmount)} className="py-3 px-4 text-sm bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/20 text-purple-200 rounded-lg font-medium flex items-center justify-center gap-2">
                <AdjustmentsVerticalIcon className="h-4 w-4" />
                <span>Odd</span>
              </button>
              <button onClick={() => applySelect(low, bulkAmount)} className="py-3 px-4 text-sm bg-green-500/20 hover:bg-green-500/30 border border-green-400/20 text-green-200 rounded-lg font-medium flex items-center justify-center gap-2">
                <ArrowDownCircleIcon className="h-4 w-4" />
                <span>0-49</span>
              </button>
              <button onClick={() => applySelect(high, bulkAmount)} className="py-3 px-4 text-sm bg-orange-500/20 hover:bg-orange-500/30 border border-orange-400/20 text-orange-200 rounded-lg font-medium flex items-center justify-center gap-2">
                <ArrowUpCircleIcon className="h-4 w-4" />
                <span>50-99</span>
              </button>
            </div>
            
            {/* Last Digit Filters - Compact Grid */}
            <div className="grid grid-cols-5 gap-1">
              {[0,1,2,3,4,5,6,7,8,9].map(d => (
                <button 
                  key={d} 
                  onClick={() => applySelect(range(0,99).filter(n => n % 10 === d), bulkAmount)} 
                  className="py-2 px-2 text-xs bg-white/10 hover:bg-white/20 text-white rounded border border-white/20"
                >
                  x{d}
                </button>
              ))}
            </div>
            
            {/* Random & Utility */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button onClick={() => selectRandom(5, bulkAmount, replaceMode)} className="py-3 px-4 text-sm bg-pink-500/20 hover:bg-pink-500/30 border border-pink-400/20 text-pink-200 rounded-lg font-medium flex items-center justify-center gap-2">
                <SparklesIcon className="h-4 w-4" />
                <span>Random 5</span>
              </button>
              <button onClick={() => selectRandom(10, bulkAmount, replaceMode)} className="py-3 px-4 text-sm bg-pink-500/20 hover:bg-pink-500/30 border border-pink-400/20 text-pink-200 rounded-lg font-medium flex items-center justify-center gap-2">
                <SparklesIcon className="h-4 w-4" />
                <span>Random 10</span>
              </button>
              <button onClick={() => selectRandom(20, bulkAmount, replaceMode)} className="py-3 px-4 text-sm bg-pink-500/20 hover:bg-pink-500/30 border border-pink-400/20 text-pink-200 rounded-lg font-medium sm:col-span-1 col-span-2 flex items-center justify-center gap-2">
                <SparklesIcon className="h-4 w-4" />
                <span>Random 20</span>
              </button>
            </div>
            
            {/* Control Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => applySelect(range(0,99), bulkAmount)} className="py-3 px-4 text-sm bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/20 text-cyan-200 rounded-lg font-medium flex items-center justify-center gap-2">
                <CheckCircleIcon className="h-4 w-4" />
                <span>Select All</span>
              </button>
              <button onClick={() => unselectNumbers(selectedNumbers)} className="py-3 px-4 text-sm bg-red-500/20 hover:bg-red-500/30 border border-red-400/20 text-red-200 rounded-lg font-medium flex items-center justify-center gap-2">
                <XMarkIcon className="h-4 w-4" />
                <span>Clear</span>
              </button>
            </div>
          </div>
        </div>
        <div className="number-grid">
          {renderNumberGrid()}
        </div>
      </div>

      {/* Desktop Controls */}
      <div className="hidden sm:block glass-effect rounded-2xl p-4 sm:p-6">
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
              className="w-full sm:w-auto bg-green-500 hover:bg-green-600 disabled:opacity-50 px-8 py-2 rounded-lg font-bold transition transform hover:scale-105 flex items-center justify-center gap-2"
            >
              <PlayCircleIcon className="h-5 w-5" />
              <span>{isPlaying ? 'Playing...' : 'Play'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bottom Controls */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 pb-safe">
        <div className="px-4">
          <div className="backdrop-blur-md bg-black/70 rounded-t-2xl border-t border-white/20 p-4">
            <div className="flex items-center justify-between text-sm mb-3">
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-white/70">Selected:</span>
                  <span className="font-bold text-yellow-400 ml-1">{selectedNumbers.length}</span>
                </div>
                <div className="h-4 w-px bg-white/20"></div>
                <div>
                  <span className="text-white/70">Total:</span>
                  <span className="font-bold text-green-400 ml-1">
                    {getBets().reduce((sum: number, bet: { amount: number }) => sum + bet.amount, 0)} {mode === 'fun' ? 'FC' : 'USDT'}
                  </span>
                </div>
              </div>
              <button
                onClick={handleClearBets}
                disabled={isPlaying || selectedNumbers.length === 0}
                className="bg-gray-600 hover:bg-gray-700 disabled:opacity-50 px-3 py-1.5 rounded-lg text-xs font-medium transition"
              >
                Clear
              </button>
            </div>
            <button
              onClick={handlePlay}
              disabled={isPlaying || selectedNumbers.length === 0}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-600 disabled:to-gray-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl text-lg transition-all transform active:scale-95 shadow-lg flex items-center justify-center gap-2"
            >
              <PlayCircleIcon className="h-6 w-6" />
              <span>{isPlaying ? 'Playing...' : 'Play Now'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
