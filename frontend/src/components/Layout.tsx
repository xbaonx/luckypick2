import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useState, useEffect } from 'react'
import {
  PlayCircleIcon,
  ClockIcon,
  BanknotesIcon,
  ArrowUpCircleIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  SparklesIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline'
import OpenInBrowserBanner from './OpenInBrowserBanner'

export default function Layout() {
  const { user, token, logout, refreshProfile, updateBalance } = useAuthStore()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  // Keep user profile fresh so balances reflect admin edits
  useEffect(() => {
    let timer: any
    const onFocus = () => {
      refreshProfile?.()
    }
    // Initial fetch
    refreshProfile?.()
    // Focus listener
    window.addEventListener('focus', onFocus)
    // Periodic refresh every 60s
    timer = setInterval(() => refreshProfile?.(), 60000)
    return () => {
      window.removeEventListener('focus', onFocus)
      if (timer) clearInterval(timer)
    }
  }, [refreshProfile])

  // SSE: subscribe to real-time user events (e.g., balance_update)
  useEffect(() => {
    if (!token) return
    const es = new EventSource(`/api/events/user?token=${encodeURIComponent(token)}`)
    const onBalance = (evt: MessageEvent) => {
      try {
        const payload = typeof evt.data === 'string' ? JSON.parse(evt.data) : evt.data
        if (payload && (payload.balanceFun !== undefined || payload.balanceUsdt !== undefined)) {
          updateBalance?.(payload.balanceFun, payload.balanceUsdt)
        }
      } catch {}
    }
    es.addEventListener('balance_update', onBalance as any)
    es.onerror = () => {
      // Let EventSource auto-reconnect; no action needed
    }
    return () => {
      es.removeEventListener('balance_update', onBalance as any)
      es.close()
    }
  }, [token, updateBalance])

  return (
    <div className="min-h-screen">
      <nav className="glass-effect text-white shadow-lg sticky top-0 z-50 pt-safe">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-2 py-2">
            <div className="flex items-center space-x-8">
              <Link to="/" className="flex items-center">
                <img src="/logo.png" alt="LuckyPick2" className="h-10 w-10 object-contain" />
              </Link>
              {/* Desktop nav links */}
              <div className="hidden md:flex gap-4">
                <Link to="/game" className="hover:text-yellow-400 transition inline-flex items-center gap-1.5">
                  <PlayCircleIcon className="h-5 w-5" />
                  <span>Play</span>
                </Link>
                {user && (
                  <>
                    <Link to="/history" className="hover:text-yellow-400 transition inline-flex items-center gap-1.5">
                      <ClockIcon className="h-5 w-5" />
                      <span>History</span>
                    </Link>
                    {user.type === 'registered' && (
                      <>
                        <Link to="/deposit" className="hover:text-yellow-400 transition inline-flex items-center gap-1.5">
                          <BanknotesIcon className="h-5 w-5" />
                          <span>Deposit</span>
                        </Link>
                        <Link to="/withdraw" className="hover:text-yellow-400 transition inline-flex items-center gap-1.5">
                          <ArrowUpCircleIcon className="h-5 w-5" />
                          <span>Withdraw</span>
                        </Link>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
            {/* Mobile menu toggle */}
            <button
              className="md:hidden ml-auto bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg transition"
              aria-label="Toggle menu"
              onClick={() => setMenuOpen((v) => !v)}
            >
              ☰ Menu
            </button>

            {/* Desktop user controls */}
            <div className="hidden md:flex items-center gap-2 flex-wrap">
              {user ? (
                <>
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="bg-yellow-500/20 px-3 py-1 rounded-full inline-flex items-center gap-1.5">
                      <SparklesIcon className="h-4 w-4" />
                      <span>{user.balanceFun.toFixed(0)} Fun</span>
                    </div>
                    {user.type === 'registered' && (
                      <div className="bg-green-500/20 px-3 py-1 rounded-full inline-flex items-center gap-1.5">
                        <CurrencyDollarIcon className="h-4 w-4" />
                        <span>{user.balanceUsdt.toFixed(2)} USDT</span>
                      </div>
                    )}
                  </div>
                  <Link to="/profile" className="hover:text-yellow-400">
                    {user.email || 'Guest'}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="bg-red-500 hover:bg-red-600 px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base rounded-lg transition"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="bg-primary hover:bg-primary/80 px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base rounded-lg transition"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="bg-secondary hover:bg-secondary/80 px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base rounded-lg transition"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
          {/* Mobile balances under header row (inside sticky navbar) */}
          {user && (
            <div className="md:hidden pb-2">
              <div className="flex flex-wrap items-center gap-2 text-base font-semibold">
                <div className="bg-yellow-500/20 px-3 py-1.5 rounded-full inline-flex items-center gap-1.5">
                  <SparklesIcon className="h-5 w-5" />
                  <span>{user.balanceFun.toFixed(0)} Fun</span>
                </div>
                {user.type === 'registered' && (
                  <div className="bg-green-500/20 px-3 py-1.5 rounded-full inline-flex items-center gap-1.5">
                    <CurrencyDollarIcon className="h-5 w-5" />
                    <span>{user.balanceUsdt.toFixed(2)} USDT</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        {/* Mobile dropdown menu */}
        {menuOpen && (
          <div className="md:hidden px-4 pb-3">
            <div className="glass-effect rounded-xl p-4 space-y-3">
              <div className="flex flex-col">
                <Link to="/game" onClick={() => setMenuOpen(false)} className="py-2 hover:text-yellow-400 inline-flex items-center gap-2">
                  <PlayCircleIcon className="h-5 w-5" />
                  <span>Play</span>
                </Link>
                {user && (
                  <>
                    <Link to="/history" onClick={() => setMenuOpen(false)} className="py-2 hover:text-yellow-400 inline-flex items-center gap-2">
                      <ClockIcon className="h-5 w-5" />
                      <span>History</span>
                    </Link>
                    {user.type === 'registered' && (
                      <>
                        <Link to="/deposit" onClick={() => setMenuOpen(false)} className="py-2 hover:text-yellow-400 inline-flex items-center gap-2">
                          <BanknotesIcon className="h-5 w-5" />
                          <span>Deposit</span>
                        </Link>
                        <Link to="/withdraw" onClick={() => setMenuOpen(false)} className="py-2 hover:text-yellow-400 inline-flex items-center gap-2">
                          <ArrowUpCircleIcon className="h-5 w-5" />
                          <span>Withdraw</span>
                        </Link>
                      </>
                    )}
                  </>
                )}
              </div>
              <div className="border-t border-white/10 pt-3 flex items-center justify-between">
                {user ? (
                  <>
                    <Link to="/profile" onClick={() => setMenuOpen(false)} className="hover:text-yellow-400 inline-flex items-center gap-2">
                      <UserCircleIcon className="h-5 w-5" />
                      <span>{user.email || 'Guest'}</span>
                    </Link>
                    <button
                      onClick={() => { setMenuOpen(false); handleLogout() }}
                      className="bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg transition inline-flex items-center gap-2"
                    >
                      <ArrowRightOnRectangleIcon className="h-5 w-5" />
                      <span>Logout</span>
                    </button>
                  </>
                ) : (
                  <div className="flex gap-2 w-full">
                    <Link to="/login" onClick={() => setMenuOpen(false)} className="flex-1 text-center bg-primary hover:bg-primary/80 px-3 py-1.5 rounded-lg transition">Login</Link>
                    <Link to="/register" onClick={() => setMenuOpen(false)} className="flex-1 text-center bg-secondary hover:bg-secondary/80 px-3 py-1.5 rounded-lg transition">Register</Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <OpenInBrowserBanner />
        <Outlet />
      </main>
    </div>
  )
}
