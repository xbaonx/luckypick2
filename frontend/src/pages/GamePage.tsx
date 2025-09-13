import { useState, useEffect, useRef } from 'react'
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
  BanknotesIcon,
  CreditCardIcon,
  TrophyIcon,
  FaceFrownIcon,
} from '@heroicons/react/24/outline'

export default function GamePage() {
  const navigate = useNavigate()
  const { mode: routeModeParam } = useParams()
  const { user, token, updateBalance, loginAsGuest } = useAuthStore()
  const triedGuestRef = useRef(false)
  const { 
    mode, 
    selectedNumbers, 
    betAmounts,
    defaultBetAmount,
    isPlaying,
    lastResult,
    lastWinAmount,
    setIsPlaying,
    setLastResult,
    setMode,
    toggleNumber,
    setBetAmount,
    setDefaultBetAmount,
    clearBets,
    getBets,
    selectNumbers,
    unselectNumbers,
    setAmountForSelected,
    selectRandom
  } = useGameStore()

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
    if (mode === 'usdt' && (!user || user.type !== 'registered')) {
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
    if (mode === 'fun' && totalBet > (user?.balanceFun ?? 0)) {
      toast.error('Insufficient FunCoin balance')
      return
    }
    if (mode === 'usdt' && totalBet > (user?.balanceUsdt ?? 0)) {
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

      const { result, winAmount, newBalance } = response.data
      
      // Update balance in store
      if (mode === 'fun') {
        updateBalance(newBalance, undefined)
      } else {
        updateBalance(undefined, newBalance)
      }

      // Store result (disable fast result toasts to avoid distracting popups)
      setLastResult(result, winAmount)
    } catch (error) {
      toast.error('Failed to play game')
      // On error, close overlay immediately
      setIsPlaying(false)
    } finally {
      // Keep overlay open; will be closed by user tap after animation
    }
  }

  const handleClearBets = () => {
    clearBets()
  }

  const renderNumberGrid = () => {
    const numbers = []
    for (let i = 0; i < 100; i++) {
      const isSelected = selectedNumbers.includes(i)
      const betAmount = betAmounts.get(i) || defaultBetAmount
      const isWinning = lastResult !== null && i === lastResult

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

  // Auto login as guest to avoid blank page after logout
  useEffect(() => {
    if (!user && !triedGuestRef.current) {
      triedGuestRef.current = true
      loginAsGuest()
    }
  }, [user, loginAsGuest])

  // Digit display for loading/result animation
  const [digitDisplay, setDigitDisplay] = useState<string[]>(['0', '0'])
  const [overlayReadyDismiss, setOverlayReadyDismiss] = useState(false)
  const [confettiFired, setConfettiFired] = useState(false)

  // Orchestrate staged digit animation during loading and snap to final

  useEffect(() => {
    if (!isPlaying) return
    setOverlayReadyDismiss(false)
    setConfettiFired(false)
    setDigitDisplay([
      Math.floor(Math.random() * 10).toString(),
      Math.floor(Math.random() * 10).toString(),
    ])
    let phase: 'both' | 'unit' = 'both'
    const tick = () => {
      setDigitDisplay(d => {
        if (phase === 'both') {
          return [
            Math.floor(Math.random() * 10).toString(),
            Math.floor(Math.random() * 10).toString(),
          ]
        }
        return [
          d[0],
          Math.floor(Math.random() * 10).toString(),
        ]
      })
    }
    const interval = setInterval(tick, 80)
    const tensLock = setTimeout(() => {
      phase = 'unit'
      if (lastResult !== null) {
        const target = `${(lastResult ?? 0).toString().padStart(2, '0')}`
        setDigitDisplay(d => [target[0], d[1]])
      }
    }, 6000)
    const unitLock = setTimeout(() => {
      if (lastResult !== null) {
        const target = `${(lastResult ?? 0).toString().padStart(2, '0')}`
        setDigitDisplay([target[0], target[1]])
      }
      setOverlayReadyDismiss(true)
      clearInterval(interval)
    }, 10000)

    const cleanup = () => {
      clearInterval(interval)
      clearTimeout(tensLock)
      clearTimeout(unitLock)
    }
    return cleanup
  }, [isPlaying, lastResult])

  // Fire lightweight confetti on win when overlay finalizes
  useEffect(() => {
    if (!overlayReadyDismiss || !isPlaying) return
    if (lastWinAmount && lastWinAmount > 0 && !confettiFired) {
      setConfettiFired(true)
      // simple canvas confetti burst
      const canvas = document.createElement('canvas')
      canvas.style.position = 'fixed'
      canvas.style.inset = '0'
      canvas.style.zIndex = '110'
      canvas.style.pointerEvents = 'none'
      document.body.appendChild(canvas)
      const ctx = canvas.getContext('2d')!
      const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
      resize()
      window.addEventListener('resize', resize)

      const particles = Array.from({ length: 120 }, () => ({
        x: Math.random() * canvas.width,
        y: -20 - Math.random() * 100,
        vx: (Math.random() - 0.5) * 4,
        vy: 2 + Math.random() * 3,
        size: 4 + Math.random() * 4,
        color: `hsl(${Math.floor(Math.random() * 360)}, 90%, 60%)`,
        life: 0,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.2,
      }))

      let raf = 0
      const start = performance.now()
      const draw = (t: number) => {
        const elapsed = t - start
        if (!ctx) return
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        particles.forEach(p => {
          p.life += 16
          p.x += p.vx
          p.y += p.vy
          p.vy += 0.05
          p.rot += p.vr
          ctx.save()
          ctx.translate(p.x, p.y)
          ctx.rotate(p.rot)
          ctx.fillStyle = p.color
          ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size)
          ctx.restore()
        })
        if (elapsed < 1500) {
          raf = requestAnimationFrame(draw)
        } else {
          cleanup()
        }
      }
      const cleanup = () => {
        cancelAnimationFrame(raf)
        window.removeEventListener('resize', resize)
        canvas.remove()
      }
      raf = requestAnimationFrame(draw)
    }
  }, [overlayReadyDismiss, isPlaying, lastWinAmount, confettiFired])

  return (
    <div className="text-white pb-sticky-safe">
      <div className="glass-effect rounded-2xl p-3.5 mb-4">
        <div className="flex flex-col justify-between gap-3.5 mb-4">
          <div className="flex flex-col items-stretch gap-3 w-full">
            {/* Mode Selector */}
            <div className="flex bg-white/15 rounded-lg p-0.5">
              <button
                onClick={() => navigate('/game/fun')}
                disabled={isPlaying}
                className={`px-3 py-1.5 text-sm rounded-lg transition ${
                  mode === 'fun' ? 'bg-yellow-500 text-black' : 'text-white hover:bg-white/10'
                }`}
              >
                FunCoin
              </button>
              {user?.type === 'registered' && (
                <button
                  onClick={() => navigate('/game/usdt')}
                  disabled={isPlaying}
                  className={`px-2.5 py-1.5 text-sm rounded-lg transition ${
                    mode === 'usdt' ? 'bg-green-500 text-white' : 'text-white hover:bg-white/10'
                  }`}
                >
                  USDT
                </button>
              )}
            </div>

            

            {/* Mode banners & CTAs - Mobile Optimized */}
            {mode === 'fun' && (
              <div className="bg-yellow-500/15 border-l-4 border-yellow-500 rounded-lg p-3 w-full">
                <div className="flex flex-col gap-2">
                  <span className="text-sm text-yellow-200 flex items-center gap-2">
                    <SparklesIcon className="h-4 w-4" />
                    <span>You're in Fun mode (Demo)</span>
                  </span>
                  <button
                    onClick={() => navigate('/game/usdt')}
                    className="bg-green-500 hover:bg-green-600 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <BanknotesIcon className="h-5 w-5" />
                    <span>Play with real USDT</span>
                  </button>
                </div>
              </div>
            )}
            {mode === 'usdt' && user?.type === 'registered' && (user?.balanceUsdt ?? 0) < Math.max(1, defaultBetAmount) && (
              <div className="bg-red-500/15 border-l-4 border-red-500 rounded-lg p-3 w-full">
                <div className="flex flex-col gap-2">
                  <span className="text-sm text-red-200 flex items-center gap-2">
                    <XMarkIcon className="h-4 w-4" />
                    <span>Low USDT balance</span>
                  </span>
                  <button
                    onClick={() => navigate('/deposit')}
                    className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <CreditCardIcon className="h-5 w-5" />
                    <span>Deposit USDT</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Default Bet moved inline below as compact control */}

        {/* Result modal removed to prioritize loading overlay */}
        {/* Mobile-optimized Selection toolbar */}
        <div className="mb-3.5 space-y-3">
          {/* Bulk Amount Control - Mobile First */}
          <div className="bg-white/10 rounded-lg p-3">
            <div className="flex flex-col space-y-2">
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
                  className="flex-1 bg-black/50 text-white text-sm px-3 py-2 rounded-lg border border-white/30 focus:border-yellow-300 focus:outline-none"
                  placeholder="Enter amount"
                />
                <button
                  onClick={handleApplyAmountToSelected}
                  disabled={isPlaying || selectedNumbers.length === 0}
                  className="bg-yellow-500 hover:bg-yellow-600 text-black font-medium px-3 py-2 rounded-lg disabled:opacity-50 whitespace-nowrap"
                >
                  Apply
                </button>
              </div>
              
              {/* Amount Presets - Mobile optimized */}
              <div className="grid grid-cols-6 gap-1.5">
                {[1,5,10,20,50,100].map(a => (
                  <button
                    key={a}
                    onClick={() => setBulkAmount(a)}
                    className={`py-1.5 px-1 text-xs rounded-lg border transition-all ${
                      bulkAmount === a ? 'bg-yellow-500 border-yellow-400 text-black font-bold' : 'bg-white/15 hover:bg-white/25 text-white border-white/30'
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>

              {/* Inline Default Bet (compact) */}
              <div className="flex items-center justify-end gap-2 pt-1">
                <span className="text-[11px] text-white/70">Default</span>
                <input
                  type="number"
                  value={defaultBetAmount}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDefaultBetAmount(Number(e.target.value))}
                  disabled={isPlaying}
                  className="w-16 bg-black/50 text-white text-xs px-2 py-1 rounded border border-yellow-300/50 focus:border-yellow-300 focus:outline-none text-center"
                  min={1}
                  max={1000}
                />
              </div>
            </div>
          </div>

          {/* Quick Select - Mobile Grid */}
          <div className="space-y-3">
            <h4 className="text-xs font-medium text-white flex items-center gap-2">
              Quick
            </h4>
            
            {/* Pattern Filters */}
            <div className="grid grid-cols-2 gap-1.5">
              <button onClick={() => applySelect(evens, bulkAmount)} className="py-2 px-2.5 text-xs bg-blue-600/40 hover:bg-blue-600/50 border border-blue-300/50 text-blue-50 rounded-lg font-medium flex items-center justify-center gap-1.5">
                <AdjustmentsHorizontalIcon className="h-4 w-4" />
                <span>Even</span>
              </button>
              <button onClick={() => applySelect(odds, bulkAmount)} className="py-2 px-2.5 text-xs bg-purple-600/40 hover:bg-purple-600/50 border border-purple-300/50 text-purple-50 rounded-lg font-medium flex items-center justify-center gap-1.5">
                <AdjustmentsVerticalIcon className="h-4 w-4" />
                <span>Odd</span>
              </button>
              <button onClick={() => applySelect(low, bulkAmount)} className="py-2 px-2.5 text-xs bg-green-600/40 hover:bg-green-600/50 border border-green-300/50 text-green-50 rounded-lg font-medium flex items-center justify-center gap-1.5">
                <ArrowDownCircleIcon className="h-4 w-4" />
                <span>0-49</span>
              </button>
              <button onClick={() => applySelect(high, bulkAmount)} className="py-2 px-2.5 text-xs bg-orange-600/40 hover:bg-orange-600/50 border border-orange-300/50 text-orange-50 rounded-lg font-medium flex items-center justify-center gap-1.5">
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
                  className="py-1.5 px-2 text-xs bg-white/25 hover:bg-white/35 text-white rounded border border-white/35"
                >
                  x{d}
                </button>
              ))}
            </div>
            
            {/* Random & Utility */}
            <div className="grid grid-cols-2 gap-1.5">
              <button onClick={() => selectRandom(5, bulkAmount, replaceMode)} className="py-2 px-2.5 text-xs bg-pink-600/40 hover:bg-pink-600/50 border border-pink-300/50 text-pink-50 rounded-lg font-medium flex items-center justify-center gap-1.5">
                <SparklesIcon className="h-4 w-4" />
                <span>Rand 5</span>
              </button>
              <button onClick={() => selectRandom(10, bulkAmount, replaceMode)} className="py-2 px-2.5 text-xs bg-pink-600/40 hover:bg-pink-600/50 border border-pink-300/50 text-pink-50 rounded-lg font-medium flex items-center justify-center gap-1.5">
                <SparklesIcon className="h-4 w-4" />
                <span>Rand 10</span>
              </button>
              <button onClick={() => selectRandom(20, bulkAmount, replaceMode)} className="py-2 px-2.5 text-xs bg-pink-600/40 hover:bg-pink-600/50 border border-pink-300/50 text-pink-50 rounded-lg font-medium col-span-2 flex items-center justify-center gap-1.5">
                <SparklesIcon className="h-4 w-4" />
                <span>Rand 20</span>
              </button>
            </div>
            
            {/* Control Buttons */}
            <div className="grid grid-cols-2 gap-1.5">
              <button onClick={() => applySelect(range(0,99), bulkAmount)} className="py-2 px-2.5 text-xs bg-cyan-600/40 hover:bg-cyan-600/50 border border-cyan-300/50 text-cyan-50 rounded-lg font-medium flex items-center justify-center gap-1.5">
                <CheckCircleIcon className="h-4 w-4" />
                <span>All</span>
              </button>
              <button onClick={() => unselectNumbers(selectedNumbers)} className="py-2 px-2.5 text-xs bg-red-600/40 hover:bg-red-600/50 border border-red-300/50 text-red-50 rounded-lg font-medium flex items-center justify-center gap-1.5">
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

      {/* Sticky Bottom Controls (mobile-first, always on) */}
      <div className="fixed bottom-0 left-0 right-0 z-50 pb-safe">
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

      {/* Spin Modal Overlay with digits */}
      {isPlaying && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => overlayReadyDismiss && setIsPlaying(false)}>
          <div className="w-full max-w-xs text-center select-none">
            {overlayReadyDismiss && (
              <div className={`flex items-center justify-center gap-2 mb-2 ${lastWinAmount && lastWinAmount > 0 ? 'text-green-300' : 'text-white/85'}`}>
                {lastWinAmount && lastWinAmount > 0 ? (
                  <>
                    <TrophyIcon className="h-6 w-6 text-yellow-400" />
                    <span className="font-semibold">You Win</span>
                  </>
                ) : (
                  <>
                    <FaceFrownIcon className="h-6 w-6" />
                    <span className="font-semibold">Try Again</span>
                  </>
                )}
              </div>
            )}
            {overlayReadyDismiss && lastWinAmount && lastWinAmount > 0 && (
              <div className="mb-2">
                <span className="inline-flex items-center gap-1 bg-green-500/20 text-green-200 border border-green-300/30 rounded-full px-3 py-1 text-sm font-semibold">
                  <BanknotesIcon className="h-4 w-4" />
                  +{mode === 'fun' ? Math.floor(lastWinAmount).toLocaleString() + ' FunCoins' : lastWinAmount.toFixed(2) + ' USDT'}
                </span>
              </div>
            )}
            {overlayReadyDismiss && lastWinAmount && lastWinAmount > 0 && mode === 'fun' && (
              <div className="mb-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsPlaying(false)
                    if (user?.type === 'registered') {
                      navigate('/game/usdt')
                    } else {
                      navigate(`/register?redirect=${encodeURIComponent('/game/usdt')}`)
                    }
                  }}
                  className="w-full bg-gradient-to-r from-yellow-400 to-green-500 hover:from-yellow-500 hover:to-green-600 text-black font-semibold px-3 py-2 rounded-lg shadow-lg transition flex items-center justify-center gap-2 text-sm"
                >
                  <BanknotesIcon className="h-5 w-5" />
                  <span>Đang đỏ tay! Chơi USDT để kiếm tiền</span>
                </button>
              </div>
            )}
            <div className="flex items-center justify-center gap-2 mb-3">
              {digitDisplay.map((d, i) => (
                <div
                  key={`loading-${d}-${i}`}
                  className={`w-14 h-14 rounded-md flex items-center justify-center text-white text-3xl font-bold shadow-lg ${overlayReadyDismiss ? (lastWinAmount && lastWinAmount > 0 ? 'bg-green-600/80 border border-green-300/70 anim-pop anim-glow-green' : 'bg-slate-700/80 border border-white/30 anim-pop anim-glow-slate') : 'bg-orange-600/80 border border-orange-300/70 anim-flip'}`}
                >
                  {d}
                </div>
              ))}
            </div>
            <div className="text-white font-semibold text-lg">{overlayReadyDismiss ? 'Result' : 'Drawing...'}</div>
            {overlayReadyDismiss && (
              <div className="text-white/70 text-xs mt-1">Tap anywhere to dismiss</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
