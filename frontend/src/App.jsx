import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Animals from './pages/Animals'
import AnimalDetail from './pages/AnimalDetail'
import Productions from './pages/Productions'
import FeedInventory from './pages/FeedInventory'
import FeedingSchedules from './pages/FeedingSchedules'
import Laporan from './pages/Laporan'
import Pengaturan from './pages/Pengaturan'
import Tim from './pages/Tim'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-cream">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-barn border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500 font-medium">Memuat FarmTrack...</p>
      </div>
    </div>
  )
  return user ? children : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return !user ? children : <Navigate to="/dashboard" replace />
}

function OwnerRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'owner') return <Navigate to="/dashboard" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="dashboard"  element={<Dashboard />} />
          <Route path="ternak"     element={<Animals />} />
          <Route path="ternak/:id" element={<AnimalDetail />} />
          <Route path="produksi"   element={<Productions />} />
          <Route path="stok-pakan" element={<FeedInventory />} />
          <Route path="jadwal"     element={<FeedingSchedules />} />
          <Route path="laporan"    element={<Laporan />} />
          <Route path="pengaturan" element={<Pengaturan />} />
          <Route path="tim"        element={<OwnerRoute><Tim /></OwnerRoute>} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}
