import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', farm_name: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      await register(form)
      navigate('/login')
    } catch (err) {
      setError(err.response?.data?.detail || 'Registrasi gagal.')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-bold text-barn">FarmTrack</h1>
          <p className="text-gray-500 text-sm mt-1">Buat akun baru untuk mulai mengelola peternakan Anda</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {error && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Nama Lengkap</label>
              <input type="text" placeholder="Nama Anda" required value={form.name} onChange={set('name')} className="input" />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" placeholder="email@contoh.com" required value={form.email} onChange={set('email')} className="input" />
            </div>
            <div>
              <label className="label">Password</label>
              <input type="password" placeholder="Minimal 8 karakter" required minLength={8} value={form.password} onChange={set('password')} className="input" />
            </div>
            <div>
              <label className="label">Nama Peternakan</label>
              <input type="text" placeholder="Contoh: Peternakan Maju Jaya" required value={form.farm_name} onChange={set('farm_name')} className="input" />
            </div>
            <p className="text-xs text-gray-400">
              Akun yang didaftarkan di sini adalah akun <span className="font-semibold text-gray-500">Owner</span> peternakan. Anggota tim (staff &amp; dokter hewan) ditambahkan oleh owner melalui menu Tim.
            </p>
            <button type="submit" disabled={loading}
              className="w-full py-2.5 rounded-xl font-semibold text-white bg-barn hover:bg-primary-600 transition-colors">
              {loading ? 'Mendaftar...' : 'Daftar Sekarang'}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-4">
            Sudah punya akun? <Link to="/login" className="text-barn font-semibold">Login di sini</Link>
          </p>
        </div>
      </div>
    </div>
  )
}