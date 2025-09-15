import { useState, useEffect, useRef } from 'react'
import type React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useGameStore } from '../stores/gameStore'
import api from '../services/api'
import toast from 'react-hot-toast'
import Confetti from 'react-confetti'
import { useWindowSize } from 'react-use'
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
  TrophyIcon,
  FaceFrownIcon,
  ChevronDownIcon,
  LockClosedIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/24/outline'

// A/B Testing CTA variants
const CTA_VARIANTS = [
  "On a hot streak! Play with USDT to win real money",
  "Winning now? Switch to USDT and cash in", 
  "Convert your luck into real USDT earnings"
]

// Helper to get consistent variant for user
const getCtaVariant = (userId: string | undefined): { text: string; variant: string } => {
  if (!userId) {
    const idx = Math.floor(Math.random() * CTA_VARIANTS.length)
    return { text: CTA_VARIANTS[idx], variant: `variant_${idx + 1}` }
  }
  // Use userId hash for consistency
  const hash = userId.split('').reduce((a, b) => a + b.charCodeAt(0), 0)
  const idx = hash % CTA_VARIANTS.length
  return { text: CTA_VARIANTS[idx], variant: `variant_${idx + 1}` }
}

// Log CTA metrics
const logCtaMetric = async (action: 'view' | 'click', variant: string, mode: string, amount?: number, userId?: string) => {
  try {
    await api.post('/metrics/cta', {
      name: 'fun_win_usdt_upsell',
      variant,
      action,
      mode,
      amount,
      userId
    })
  } catch (error) {
    // Silent fail for metrics
    console.warn('Failed to log CTA metric:', error)
  }
}

// Log Guide metrics (reuse metrics endpoint)
const logGuideMetric = async (action: 'view' | 'dismiss' | 'next', step: number, mode: string, userId?: string) => {
  try {
    await api.post('/metrics/cta', {
      name: 'guide_overlay',
      variant: `v1_step_${step}`,
      action,
      mode,
      userId
    })
  } catch (error) {
    console.warn('Failed to log guide metric:', error)
  }
}

export default function GamePage() {
  const navigate = useNavigate()
  const { mode: routeModeParam } = useParams()
  const { user, token, updateBalance, loginAsGuest } = useAuthStore()
  const triedGuestRef = useRef(false)
  const { width, height } = useWindowSize()
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
  const [showTools, setShowTools] = useState<boolean>(false)

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
    if (mode === 'usdt') {
      const bal = user?.balanceUsdt ?? 0
      if (totalBet > bal) {
        setNeededUsdt(Number((totalBet - bal).toFixed(2)))
        setShowInsufficientUsdt(true)
        return
      }
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
      );
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
  const [showGuide, setShowGuide] = useState(false)
  const [guideStep, setGuideStep] = useState(0)
  const [showInsufficientUsdt, setShowInsufficientUsdt] = useState(false)
  const [neededUsdt, setNeededUsdt] = useState<number | null>(null)

  // First-time guide for likely US users
  useEffect(() => {
    try {
      const seen = localStorage.getItem('lp2_guide_v1') === '1'
      if (seen) return
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''
      const lang = (navigator.languages && navigator.languages[0]) || navigator.language || ''
      const usTzPrefixes = [
        'America/New_York','America/Detroit','America/Kentucky','America/Indiana','America/Chicago','America/Boise','America/Denver','America/Phoenix','America/Los_Angeles','America/Anchorage','America/Juneau','America/Sitka','America/Nome','Pacific/Honolulu'
      ]
      const isUSTz = usTzPrefixes.some(p => tz.startsWith(p))
      const isUSLang = /en-US/i.test(lang || '')
      const likelyUS = isUSTz || isUSLang
      if (likelyUS) {
        setShowGuide(true)
        setGuideStep(0)
        logGuideMetric('view', 0, mode, user?.id)
      }
    } catch {}
  // run only on first mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const openGuide = () => {
    setShowGuide(true)
    setGuideStep(0)
    logGuideMetric('view', 0, mode, user?.id)
  }

  const handleGuideNext = () => {
    const next = guideStep + 1
    if (next >= 3) {
      // finish
      localStorage.setItem('lp2_guide_v1', '1')
      setShowGuide(false)
      logGuideMetric('dismiss', guideStep, mode, user?.id)
    } else {
      setGuideStep(next)
      logGuideMetric('next', next, mode, user?.id)
    }
  }

  const handleGuideSkip = () => {
    localStorage.setItem('lp2_guide_v1', '1')
    setShowGuide(false)
    logGuideMetric('dismiss', guideStep, mode, user?.id)
  }

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

  // Fire confetti on win when overlay finalizes
  useEffect(() => {
    if (overlayReadyDismiss && lastWinAmount && lastWinAmount > 0 && !confettiFired) {
      setConfettiFired(true)
    }
  }, [overlayReadyDismiss, lastWinAmount, confettiFired])

  return (
    <div className="text-white pb-sticky-safe">
      {confettiFired && (
        <Confetti
          width={width}
          height={height}
          recycle={false}
          numberOfPieces={500}
          tweenDuration={7000}
          onConfettiComplete={() => setConfettiFired(false)}
        />
      )}
      <div className="glass-effect rounded-2xl p-3.5 mb-4">
        <div className="flex flex-col justify-between gap-3.5 mb-4">
          <div className="flex flex-col items-stretch gap-3 w-full">
            {/* Mode Selector + Quick Actions */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
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
                <button
                  onClick={() => {
                    if (user?.type === 'registered') {
                      navigate('/game/usdt')
                    } else {
                      navigate(`/register?redirect=${encodeURIComponent('/game/usdt')}`)
                    }
                  }}
                  disabled={isPlaying}
                  className={`px-2.5 py-1.5 text-sm rounded-lg transition ${
                    mode === 'usdt' ? 'bg-green-500 text-white' : 'text-white hover:bg-white/10'
                  }`}
                  title={user?.type === 'registered' ? 'Play with USDT' : 'Đăng ký để chơi USDT'}
                >
                  {user?.type === 'registered' ? (
                    'USDT'
                  ) : (
                    <span className="inline-flex items-center gap-1">
                      <LockClosedIcon className="h-4 w-4" />
                      <span>USDT</span>
                    </span>
                  )}
                </button>
              </div>

              {user?.type === 'registered' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate('/deposit')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5"
                  >
                    <BanknotesIcon className="h-4 w-4" />
                    <span>Deposit</span>
                  </button>
                  <button
                    onClick={() => navigate('/withdraw')}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5"
                  >
                    <ArrowUpCircleIcon className="h-4 w-4" />
                    <span>Withdraw</span>
                  </button>
                </div>
              )}
            </div>

            

            {/* Mode banners removed per request */}
          </div>
        </div>

        {/* Tools Toggle */}
        <div className="mb-3.5">
          <button
            onClick={() => setShowTools(v => !v)}
            className="w-full flex items-center justify-between bg-white/10 hover:bg-white/15 border border-white/20 rounded-lg px-3 py-2 text-sm transition"
          >
            <span className="font-medium">Bet Tools</span>
            <ChevronDownIcon className={`h-5 w-5 transition-transform ${showTools ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Collapsible: Bulk Amount + Quick tools */}
        <div
          className={`mb-3.5 space-y-3 overflow-hidden transition-all duration-300 ease-in-out ${showTools ? 'max-h-[1200px] opacity-100' : 'max-h-0 opacity-0'}`}
          aria-hidden={!showTools}
        >
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
        <h4 className="text-sm font-semibold text-white/90 mb-2 flex items-center gap-2">
          <span>Pick your lucky numbers</span>
          <span
            className="inline-flex items-center gap-1 text-white/70 text-xs cursor-help"
            title="You can select multiple numbers"
          >
            <QuestionMarkCircleIcon className="h-4 w-4" />
            <span>Tip</span>
          </span>
        </h4>
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

      {/* Spin Modal Overlay with digits */
      }
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
            {overlayReadyDismiss && lastWinAmount && lastWinAmount > 0 && mode === 'fun' && (() => {
              const ctaVariant = getCtaVariant(user?.id)
              // Log view when CTA is displayed
              logCtaMetric('view', ctaVariant.variant, mode, lastWinAmount, user?.id)
              
              return (
                <div className="mb-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      // Log click before navigation
                      logCtaMetric('click', ctaVariant.variant, mode, lastWinAmount, user?.id)
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
                    <span>{ctaVariant.text}</span>
                  </button>
                </div>
              )
            })()}
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

      {/* Insufficient USDT Overlay */}
      {showInsufficientUsdt && (
        <div className="fixed inset-0 z-[110] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm glass-effect rounded-2xl border border-white/20 p-5 text-white">
            <div className="text-lg font-semibold mb-1">Insufficient USDT</div>
            <div className="text-white/80 text-sm mb-3">
              {typeof neededUsdt === 'number' ? (
                <>You need an extra <span className="font-semibold text-green-300">{neededUsdt.toFixed(2)} USDT</span> to place this bet.</>
              ) : (
                <>Your USDT balance is not enough to place this bet.</>
              )}
              {typeof user?.balanceUsdt === 'number' && (
                <div className="mt-1 text-xs text-white/60">Current balance: {user.balanceUsdt.toFixed(2)} USDT</div>
              )}
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowInsufficientUsdt(false)}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-sm"
              >
                Adjust bets
              </button>
              <button
                onClick={() => { setShowInsufficientUsdt(false); navigate('/deposit') }}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm"
              >
                Deposit USDT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating help button (reopen guide) */}
      {!isPlaying && !showGuide && (
        <button
          onClick={openGuide}
          className="fixed bottom-40 left-4 sm:bottom-32 md:bottom-24 md:left-auto md:right-4 z-[90] bg-white/10 hover:bg-white/20 border border-white/20 text-white px-3 py-2 rounded-full shadow-lg inline-flex items-center gap-1"
          title="Show quick guide"
        >
          <QuestionMarkCircleIcon className="h-5 w-5" />
          <span className="text-sm">Guide</span>
        </button>
      )}

      {/* First-time Guide Overlay (US users) */}
      {showGuide && (
        <div className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md glass-effect rounded-2xl border border-white/20 p-5 text-white">
            <div className="text-lg font-semibold mb-2">Quick Start</div>
            {guideStep === 0 && (
              <div className="space-y-2 text-sm">
                <div className="font-medium">1) Mode & Actions</div>
                <ul className="list-disc list-inside space-y-1 text-white/90">
                  <li>Choose FunCoin or USDT at the top.</li>
                  <li>Use Deposit / Withdraw buttons next to the selector.</li>
                </ul>
              </div>
            )}
            {guideStep === 1 && (
              <div className="space-y-2 text-sm">
                <div className="font-medium">2) Pick Numbers & Tools</div>
                <ul className="list-disc list-inside space-y-1 text-white/90">
                  <li>Tap numbers to select; enter amount on selected tiles.</li>
                  <li>Open Bet Tools for Bulk Amount and quick patterns.</li>
                </ul>
              </div>
            )}
            {guideStep === 2 && (
              <div className="space-y-2 text-sm">
                <div className="font-medium">3) Play</div>
                <ul className="list-disc list-inside space-y-1 text-white/90">
                  <li>Check Selected and Total at the bottom bar.</li>
                  <li>Press Play Now to spin. Good luck!</li>
                </ul>
              </div>
            )}
            <div className="mt-4 flex items-center justify-between">
              <button onClick={handleGuideSkip} className="text-white/70 hover:text-white text-sm">Skip</button>
              <div className="flex items-center gap-2">
                {guideStep > 0 && (
                  <button onClick={() => setGuideStep(guideStep - 1)} className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-sm">Back</button>
                )}
                <button onClick={handleGuideNext} className="px-3 py-1.5 rounded-lg bg-yellow-500 text-black font-semibold text-sm">
                  {guideStep >= 2 ? 'Got it' : 'Next'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
