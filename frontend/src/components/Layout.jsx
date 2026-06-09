import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { path: '/dashboard',  label: 'Dashboard',  icon: '⊞' },
  { path: '/ternak',     label: 'Data Hewan', icon: '🐄' },
  { path: '/produksi',   label: 'Production', icon: '📊' },
  { path: '/stok-pakan', label: 'Feed Stock', icon: '🌾' },
  { path: '/jadwal',     label: 'Schedules',  icon: '📅' },
  { path: '/laporan',    label: 'Reports',    icon: '📋' },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const handleLogout = () => { logout(); navigate('/login') }
  const isOwner = user?.role === 'owner'

  return (
    <div className="flex h-screen overflow-hidden bg-cream">
      <aside className="w-56 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col">
        <div className="px-5 py-5 border-b border-gray-100">
          <h1 className="font-display text-xl font-bold text-barn">FarmTrack</h1>
          <p className="text-xs text-gray-400 mt-0.5">Portal Manajemen</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <NavLink key={item.path} to={item.path}
              className={({ isActive }) =>
                `sidebar-item ${isActive ? 'sidebar-item-active' : 'sidebar-item-inactive'}`}>
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}

          {/* Menu Tim — hanya owner */}
          {isOwner && (
            <NavLink to="/tim"
              className={({ isActive }) =>
                `sidebar-item ${isActive ? 'sidebar-item-active' : 'sidebar-item-inactive'}`}>
              <span className="text-base">👥</span>
              <span>Tim</span>
            </NavLink>
          )}
        </nav>

        <div className="px-3 py-4 border-t border-gray-100 space-y-1">
          <NavLink to="/pengaturan"
            className={({ isActive }) =>
              `sidebar-item ${isActive ? 'sidebar-item-active' : 'sidebar-item-inactive'}`}>
            <span>⚙</span><span>Pengaturan</span>
          </NavLink>
          <div className="flex items-center gap-3 px-3 py-2.5 mt-1">
            <div className="w-8 h-8 rounded-full bg-barn text-white flex items-center justify-center text-sm font-bold">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{user?.name}</p>
              <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="w-full text-left sidebar-item sidebar-item-inactive text-red-500 hover:bg-red-50">
            <span>→</span><span>Keluar</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-white border-b border-gray-100 flex items-center px-6 gap-4 flex-shrink-0">
          <div className="flex-1">
            <div className="relative max-w-xs">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
              <input type="text" placeholder="Cari ternak, pakan, catatan..."
                className="w-full pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-barn/20 focus:border-barn" />
            </div>
          </div>
          <button className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg">🔔</button>
          <button className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg">❓</button>
          <div className="flex items-center gap-2 pl-2 border-l border-gray-100">
            <div className="w-7 h-7 rounded-full bg-barn text-white flex items-center justify-center text-xs font-bold">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <span className="text-sm font-medium">{user?.name}</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6"><Outlet /></main>
      </div>
    </div>
  )
}