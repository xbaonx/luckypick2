import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

export default function AdminLayout() {
  const { logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <div className="w-64 glass-effect text-white">
        <div className="p-6">
          <img src="/logo.png" alt="LuckyPick2" className="h-10 w-10 object-contain" />
        </div>
        <nav className="px-4 space-y-2">
          <Link
            to="/admin"
            className="block px-4 py-2 rounded-lg hover:bg-white/10 transition"
          >
            📊 Dashboard
          </Link>
          <Link
            to="/admin/users"
            className="block px-4 py-2 rounded-lg hover:bg-white/10 transition"
          >
            👥 Users
          </Link>
          <Link
            to="/admin/withdraws"
            className="block px-4 py-2 rounded-lg hover:bg-white/10 transition"
          >
            💸 Withdrawals
          </Link>
          <Link
            to="/admin/games"
            className="block px-4 py-2 rounded-lg hover:bg-white/10 transition"
          >
            🎮 Game History
          </Link>
          <Link
            to="/admin/config"
            className="block px-4 py-2 rounded-lg hover:bg-white/10 transition"
          >
            ⚙️ Configuration
          </Link>
          <Link
            to="/admin/seed-setup"
            className="block px-4 py-2 rounded-lg hover:bg-white/10 transition"
          >
            🔐 Seed Setup
          </Link>
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <button
            onClick={handleLogout}
            className="w-full bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg transition"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 p-8">
        <Outlet />
      </div>
    </div>
  )
}
