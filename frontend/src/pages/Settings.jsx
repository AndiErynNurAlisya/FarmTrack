import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import Modal from '../components/Modal'

export default function Settings() {
  const { user, logout } = useAuth()
  const [tab, setTab] = useState('profil')
  const [form, setForm] = useState({ name: user?.name||'', farm_name: user?.farm_name||'' })
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm_password: '' })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [showPwModal, setShowPwModal] = useState(false)
  const [showDelModal, setShowDelModal] = useState(false)
  const [delConfirm, setDelConfirm] = useState('')
  const [delPassword, setDelPassword] = useState('')
  const [modalMsg, setModalMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const DELETE_PHRASE = 'HAPUS AKUN SAYA'

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

  const changePassword = async (e) => {
    e.preventDefault(); setBusy(true); setModalMsg('')
    if (pwForm.new_password.length < 8) { setModalMsg('Kata sandi baru minimal 8 karakter'); setBusy(false); return }
    if (pwForm.new_password !== pwForm.confirm_password) { setModalMsg('Konfirmasi kata sandi tidak cocok'); setBusy(false); return }
    try {
      await api.put('/auth/me/password', { current_password: pwForm.current_password, new_password: pwForm.new_password })
      setShowPwModal(false)
      setPwForm({ current_password: '', new_password: '', confirm_password: '' })
      setMsg('Kata sandi berhasil diubah')
    } catch (err) {
      setModalMsg(err.response?.data?.detail || 'Gagal mengubah kata sandi')
    } finally { setBusy(false) }
  }

  const deleteAccount = async (e) => {
    e.preventDefault(); setBusy(true); setModalMsg('')
    try {
      await api.delete('/auth/me', { data: { password: delPassword } })
      logout()
      window.location.href = '/login'
    } catch (err) {
      setModalMsg(err.response?.data?.detail || 'Gagal menghapus akun')
      setBusy(false)
    }
  }

  const tabs = [
    { id: 'profil', label: 'Profil Peternak', icon: '👤' },
    { id: 'keamanan', label: 'Keamanan', icon: '🔒' },
  ]

  return (
    <div className="space-y-6 fade-in max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Pengaturan</h2>
        <p className="text-gray-500 text-sm mt-1">Kelola profil peternakan dan keamanan akun Anda</p>
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

          {tab === 'keamanan' && (
            <div className="space-y-4">
              <div className="card">
                <h3 className="font-semibold text-gray-800 mb-5">Manajemen Akun</h3>
                {msg && <div className={`mb-4 px-4 py-3 rounded-xl text-sm ${msg.includes('berhasil') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{msg}</div>}
                <div className="space-y-3">
                  <div onClick={() => { setModalMsg(''); setShowPwModal(true) }}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 cursor-pointer transition-colors">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">Ubah Kata Sandi</p>
                      <p className="text-xs text-gray-400 mt-0.5">Perbarui kata sandi akun Anda</p>
                    </div>
                    <span className="text-gray-400">›</span>
                  </div>
                </div>
              </div>

              <div className="card border-red-100">
                <h3 className="font-semibold text-red-600 mb-2">Zona Bahaya</h3>
                <p className="text-sm text-gray-500 mb-4">Menghapus akun Anda akan menghilangkan semua data ternak dan laporan secara permanen.</p>
                 <button onClick={() => { setModalMsg(''); setDelConfirm(''); setDelPassword(''); setShowDelModal(true) }} className="btn-secondary border-red-200 text-red-600 hover:bg-red-50">Hapus Akun Selamanya</button>
              </div>
            </div>
          )}
        </div>
      </div>
    {showPwModal && (
        <Modal title="Ubah Kata Sandi" onClose={() => setShowPwModal(false)} size="sm">
          <form onSubmit={changePassword} className="space-y-4">
            <p className="text-sm text-gray-500">Masukkan kata sandi saat ini, lalu kata sandi baru Anda.</p>
            <div>
              <label className="label">Kata Sandi Saat Ini *</label>
              <input required type="password" value={pwForm.current_password} onChange={setPw('current_password')} className="input" />
            </div>
            <div>
              <label className="label">Kata Sandi Baru *</label>
              <input required type="password" minLength={8} value={pwForm.new_password} onChange={setPw('new_password')} className="input" placeholder="Minimal 8 karakter" />
            </div>
            <div>
              <label className="label">Konfirmasi Kata Sandi Baru *</label>
              <input required type="password" value={pwForm.confirm_password} onChange={setPw('confirm_password')} className="input" />
            </div>
            {modalMsg && <p className="text-sm text-red-500">{modalMsg}</p>}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowPwModal(false)} className="btn-secondary flex-1 justify-center">Batal</button>
              <button type="submit" disabled={busy} className="btn-primary flex-1 justify-center">{busy ? 'Menyimpan...' : 'Simpan'}</button>
            </div>
          </form>
        </Modal>
      )}

      {showDelModal && (
        <Modal title="⚠️ Hapus Akun Selamanya" onClose={() => setShowDelModal(false)} size="sm">
          <form onSubmit={deleteAccount} className="space-y-4">
            <div className="bg-red-50 border border-red-100 rounded-xl p-3">
              <p className="text-sm text-red-600 font-medium">Tindakan ini permanen dan tidak bisa dibatalkan.</p>
              <p className="text-xs text-red-500 mt-1">Seluruh data ternak, produksi, stok pakan, dan laporan akan dihapus permanen.</p>
            </div>
            <div>
              <label className="label">Ketik <span className="font-bold text-red-600">{DELETE_PHRASE}</span> untuk konfirmasi</label>
              <input value={delConfirm} onChange={e => setDelConfirm(e.target.value)} className="input" placeholder={DELETE_PHRASE} />
            </div>
            <div>
              <label className="label">Kata Sandi *</label>
              <input required type="password" value={delPassword} onChange={e => setDelPassword(e.target.value)} className="input" />
            </div>
            {modalMsg && <p className="text-sm text-red-500">{modalMsg}</p>}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowDelModal(false)} className="btn-secondary flex-1 justify-center">Batal</button>
              <button type="submit" disabled={busy || delConfirm !== DELETE_PHRASE || !delPassword}
                className="btn-primary flex-1 justify-center !bg-red-600 hover:!bg-red-700 disabled:opacity-50">
                {busy ? 'Menghapus...' : 'Hapus Akun'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
