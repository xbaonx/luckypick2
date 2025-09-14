import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useState } from 'react'

export default function Layout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen">
      <nav className="glass-effect text-white shadow-lg sticky top-0 z-50 pt-safe">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-2 py-2">
            <div className="flex items-center space-x-8">
              <Link to="/" className="text-2xl font-bold text-yellow-400">
                🎰 LuckyPick2
              </Link>
              {/* Desktop nav links */}
              <div className="hidden md:flex gap-4">
                <Link to="/game" className="hover:text-yellow-400 transition">Play</Link>
                {user && (
                  <>
                    <Link to="/history" className="hover:text-yellow-400 transition">History</Link>
                    {user.type === 'registered' && (
                      <>
                        <Link to="/deposit" className="hover:text-yellow-400 transition">Deposit</Link>
                        <Link to="/withdraw" className="hover:text-yellow-400 transition">Withdraw</Link>
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
                    <div className="bg-yellow-500/20 px-3 py-1 rounded-full">
                      🪙 {user.balanceFun.toFixed(0)} Fun
                    </div>
                    {user.type === 'registered' && (
                      <div className="bg-green-500/20 px-3 py-1 rounded-full">
                        💵 {user.balanceUsdt.toFixed(2)} USDT
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
        </div>
        {/* Mobile dropdown menu */}
        {menuOpen && (
          <div className="md:hidden px-4 pb-3">
            <div className="glass-effect rounded-xl p-4 space-y-3">
              <div className="flex flex-col">
                <Link to="/game" onClick={() => setMenuOpen(false)} className="py-2 hover:text-yellow-400">Play</Link>
                {user && (
                  <>
                    <Link to="/history" onClick={() => setMenuOpen(false)} className="py-2 hover:text-yellow-400">History</Link>
                    {user.type === 'registered' && (
                      <>
                        <Link to="/deposit" onClick={() => setMenuOpen(false)} className="py-2 hover:text-yellow-400">Deposit</Link>
                        <Link to="/withdraw" onClick={() => setMenuOpen(false)} className="py-2 hover:text-yellow-400">Withdraw</Link>
                      </>
                    )}
                  </>
                )}
              </div>
              <div className="border-t border-white/10 pt-3 flex items-center justify-between">
                {user ? (
                  <>
                    <Link to="/profile" onClick={() => setMenuOpen(false)} className="hover:text-yellow-400">
                      {user.email || 'Guest'}
                    </Link>
                    <button
                      onClick={() => { setMenuOpen(false); handleLogout() }}
                      className="bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg transition"
                    >
                      Logout
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
        <Outlet />
      </main>
    </div>
  )
}
