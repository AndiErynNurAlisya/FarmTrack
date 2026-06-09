import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

export default function Pengaturan() {
  const { user, logout } = useAuth()
  const [tab, setTab] = useState('profil')
  const [form, setForm] = useState({ name: user?.name||'', farm_name: user?.farm_name||'' })
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm_password: '' })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))
  const setPw = k => e => setPwForm(p => ({ ...p, [k]: e.target.value }))

  const saveProfile = async (e) => {
    e.preventDefault(); setSaving(true); setMsg('')
    try {
      await api.put(`/auth/me`, form)
      setMsg('Profil berhasil diperbarui')
    } catch { setMsg('Gagal menyimpan perubahan') }
    finally { setSaving(false) }
  }

  const tabs = [
    { id: 'profil', label: 'Profil Peternak', icon: '👤' },
    { id: 'notifikasi', label: 'Notifikasi', icon: '🔔' },
    { id: 'keamanan', label: 'Keamanan', icon: '🔒' },
  ]

  return (
    <div className="space-y-6 fade-in max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Pengaturan</h2>
        <p className="text-gray-500 text-sm mt-1">Kelola profil peternak, notifikasi, dan keamanan akun Anda</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar tabs */}
        <div className="w-48 flex-shrink-0">
          <nav className="space-y-1">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-all ${tab === t.id ? 'bg-barn text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                <span>{t.icon}</span><span>{t.label}</span>
              </button>
            ))}
            <hr className="my-2 border-gray-100" />
            <button onClick={logout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all text-left">
              <span>→</span><span>Keluar</span>
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          {tab === 'profil' && (
            <div className="card">
              <h3 className="font-semibold text-gray-800 mb-5">Informasi Profil</h3>
              {msg && <div className={`mb-4 px-4 py-3 rounded-xl text-sm ${msg.includes('berhasil') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{msg}</div>}

              {/* Avatar */}
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
                <div className="w-16 h-16 rounded-full bg-barn text-white flex items-center justify-center text-2xl font-bold">
                  {user?.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{user?.name}</p>
                  <p className="text-sm text-gray-400 capitalize">{user?.role} — {user?.farm_name || 'Belum ada nama peternakan'}</p>
                </div>
              </div>

              <form onSubmit={saveProfile} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="label">Nama Lengkap</label><input value={form.name} onChange={set('name')} className="input" /></div>
                  <div><label className="label">Alamat Email</label><input value={user?.email||''} disabled className="input bg-gray-50 text-gray-400 cursor-not-allowed" /></div>
                </div>
                <div>
                  <label className="label">Nama Peternakan</label>
                  <input value={form.farm_name} onChange={set('farm_name')} className="input" placeholder="Nama peternakan Anda..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="label">Role</label><input value={user?.role||''} disabled className="input bg-gray-50 text-gray-400 cursor-not-allowed capitalize" /></div>
                </div>
                <div className="flex justify-end pt-2">
                  <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Menyimpan...' : 'Simpan Perubahan'}</button>
                </div>
              </form>
            </div>
          )}

          {tab === 'notifikasi' && (
            <div className="card">
              <h3 className="font-semibold text-gray-800 mb-5">Preferensi Notifikasi</h3>
              <div className="space-y-4">
                {[
                  { label: 'Peringatan Kesehatan Ternak', desc: 'Dapatkan notifikasi saat ternak membutuhkan perhatian medis', on: true },
                  { label: 'Stok Pakan Rendah', desc: 'Pemberitahuan saat stok pakan berada di bawah ambang batas minimum', on: true },
                  { label: 'Laporan Mingguan via Email', desc: 'Rekapitulasi performa produksi dan kesehatan dikirim ke email Anda', on: false },
                ].map((n, i) => (
                  <div key={i} className="flex items-start justify-between py-3 border-b border-gray-50 last:border-0">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center text-sm mt-0.5">🔔</div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{n.label}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{n.desc}</p>
                      </div>
                    </div>
                    <div className={`w-11 h-6 rounded-full transition-colors cursor-pointer flex-shrink-0 ${n.on ? 'bg-barn' : 'bg-gray-200'}`}>
                      <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mt-0.5 ${n.on ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'keamanan' && (
            <div className="space-y-4">
              <div className="card">
                <h3 className="font-semibold text-gray-800 mb-5">Manajemen Akun</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Ubah Kata Sandi', desc: 'Terakhir diubah 3 bulan yang lalu' },
                    { label: 'Sesi Aktif', desc: 'Kelola perangkat yang terhubung' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 cursor-pointer transition-colors">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{item.label}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                      </div>
                      <span className="text-gray-400">›</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card border-red-100">
                <h3 className="font-semibold text-red-600 mb-2">Zona Bahaya</h3>
                <p className="text-sm text-gray-500 mb-4">Menghapus akun Anda akan menghilangkan semua data ternak dan laporan secara permanen.</p>
                <button className="btn-secondary border-red-200 text-red-600 hover:bg-red-50">Hapus Akun Selamanya</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
