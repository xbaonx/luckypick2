import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import GamePage from './pages/GamePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ProfilePage from './pages/ProfilePage'
import DepositPage from './pages/DepositPage'
import WithdrawPage from './pages/WithdrawPage'
import HistoryPage from './pages/HistoryPage'
import AdminLayout from './components/AdminLayout'
import AdminDashboard from './pages/admin/Dashboard'
import AdminUsers from './pages/admin/Users'
import AdminWithdraws from './pages/admin/Withdraws'
import AdminGameHistory from './pages/admin/GameHistory'
import AdminConfig from './pages/admin/Config'
import AdminSeedSetup from './pages/admin/SeedSetup'

function App() {
  const { user } = useAuthStore()
  const isAdmin = user?.isAdmin

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      
      {/* Player routes */}
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="game" element={<GamePage />} />
        <Route path="profile" element={user ? <ProfilePage /> : <Navigate to="/login" />} />
        <Route path="deposit" element={user?.type === 'registered' ? <DepositPage /> : <Navigate to="/register" />} />
        <Route path="withdraw" element={user?.type === 'registered' ? <WithdrawPage /> : <Navigate to="/register" />} />
        <Route path="history" element={user ? <HistoryPage /> : <Navigate to="/login" />} />
      </Route>

      {/* Admin routes */}
      <Route path="/admin" element={isAdmin ? <AdminLayout /> : <Navigate to="/login" />}>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="withdraws" element={<AdminWithdraws />} />
        <Route path="games" element={<AdminGameHistory />} />
        <Route path="config" element={<AdminConfig />} />
        <Route path="seed-setup" element={<AdminSeedSetup />} />
      </Route>
    </Routes>
  )
}

export default App
