import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// ── Ikon SVG lokal (dari folder src/assets) ──────────────────
// Nama file mengikuti yang kamu simpan di assets. Kalau ada yang beda,
// cukup ganti nama file di import-nya (atau rename file-nya).
import iconDb from '../assets/dashboard.svg'
import iconHewan from '../assets/hewan.svg'
import iconKesehatan from '../assets/kesehatan.svg'
import iconVaksin from '../assets/vaksin.svg'
import iconProduksi from '../assets/produksi.svg'
import iconStok from '../assets/pakan.svg'
import iconJadwal from '../assets/jadwal.svg'
import iconLaporan from '../assets/laporan.svg'
import iconTim from '../assets/tim.svg'
import iconKeluar from '../assets/keluar.svg'
// Dashboard & Pengaturan: belum ada file SVG-nya, sementara pakai link Iconify.
const ICON_BASE = 'https://api.iconify.design/'
const ic = (name) => ICON_BASE + name + '.svg?color=%238B2635'

const allNavItems = [
  { path: '/dashboard',      label: 'Dashboard',     icon: iconDb, roles: ['owner', 'staff', 'veterinary'] },
  { path: '/ternak',         label: 'Data Hewan',    icon: iconHewan,     roles: ['owner', 'staff', 'veterinary'] },
  { path: '/health-records', label: 'Kesehatan',     icon: iconKesehatan, roles: ['veterinary'] },
  { path: '/vaksinasi',      label: 'Jadwal Vaksin', icon: iconVaksin,    roles: ['owner', 'staff', 'veterinary'] },
  { path: '/produksi',       label: 'Produksi',      icon: iconProduksi,  roles: ['owner', 'staff'] },
  { path: '/stok-pakan',     label: 'Stok Pakan',    icon: iconStok,      roles: ['owner'] },
  { path: '/jadwal',         label: 'Jadwal Pakan',  icon: iconJadwal,    roles: ['owner', 'staff'] },
  { path: '/laporan',        label: 'Laporan',       icon: iconLaporan,   roles: ['owner', 'staff'] },
]

// Ikon: warna asli SVG saat tidak aktif, dan otomatis PUTIH saat menu aktif.
// (img/SVG tidak bisa diwarnai via CSS color, jadi pakai trik brightness-0 invert.)
function NavIcon({ src, isActive }) {
  return (
    <img src={src} alt="" className={`w-5 h-5 object-contain ${isActive ? 'brightness-0 invert' : ''}`} />
  )
}

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const handleLogout = () => { logout(); navigate('/login') }
  const isOwner = user?.role === 'owner'
  const role = user?.role

  const navItems = allNavItems.filter(item => item.roles.includes(role))

  return (
    <div className="flex h-screen overflow-hidden bg-cream">
      <aside className="w-56 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col">
        <div className="px-5 py-5 border-b border-gray-100 text-center">
          <h1 className="font-jolly text-4xl font-bold text-barn">FarmTrack</h1>
          <p className="text-xs text-gray-400 mt-0.5">Portal Manajemen</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <NavLink key={item.path} to={item.path}
              className={({ isActive }) =>
                `sidebar-item ${isActive ? 'sidebar-item-active' : 'sidebar-item-inactive'}`}>
              {({ isActive }) => (
                <>
                  <NavIcon src={item.icon} isActive={isActive} />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}

          {/* Menu Tim - hanya owner */}
          {isOwner && (
            <NavLink to="/tim"
              className={({ isActive }) =>
                `sidebar-item ${isActive ? 'sidebar-item-active' : 'sidebar-item-inactive'}`}>
              {({ isActive }) => (
                <>
                  <NavIcon src={iconTim} isActive={isActive} />
                  <span>Tim</span>
                </>
              )}
            </NavLink>
          )}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-white border-b border-gray-100 flex items-center px-6 gap-3 flex-shrink-0">
          <div className="flex-1" />
          <NavLink to="/pengaturan"
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${isActive ? 'bg-primary-50 text-barn' : 'text-gray-500 hover:bg-gray-100'}`}>
            <img src={ic('lucide/settings')} alt="" className="w-4 h-4 object-contain" />
            <span>Pengaturan</span>
          </NavLink>
          <div className="flex items-center gap-2 pl-3 border-l border-gray-100">
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