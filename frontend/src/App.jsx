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
import HealthRecords from './pages/HealthRecords'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import VaccineSchedule from './pages/VaccineSchedule'
import Team from './pages/Team'

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
          <Route path="health-records" element={<HealthRecords />} />
          <Route path="vaksinasi"  element={<VaccineSchedule />} />
          <Route path="laporan"    element={<Reports />} />
          <Route path="pengaturan" element={<Settings />} />
          <Route path="tim"        element={<OwnerRoute><Team /></OwnerRoute>} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}