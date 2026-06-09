import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Login gagal. Periksa email dan password Anda.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#8B2635' }}>
      {/* Left - Form */}
      <div className="flex-1 flex items-center justify-center bg-white relative" style={{
        clipPath: 'ellipse(85% 100% at 0% 50%)'
      }}>
        <div className="absolute top-8 left-8">
          <div className="w-20 h-20 rounded-full opacity-20" style={{ background: '#8B2635' }} />
        </div>
        <div className="w-full max-w-sm mx-auto px-12">
          <div className="bg-gray-100 rounded-3xl p-8 shadow-sm">
            <h1 className="font-display text-3xl font-bold text-barn mb-6">Farm Track</h1>
            {error && (
              <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="email" placeholder="Username / Email" required
                value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                className="input bg-white" />
              <input
                type="password" placeholder="Password" required
                value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                className="input bg-white" />
              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-full font-semibold text-white transition-all"
                style={{ background: '#8B2635' }}>
                {loading ? 'Memproses...' : 'Login'}
              </button>
            </form>
            <p className="text-center text-sm text-gray-500 mt-4">
              Belum punya akun?{' '}
              <Link to="/register" className="font-semibold" style={{ color: '#8B2635' }}>Daftar di sini</Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right - Decorative */}
      <div className="hidden lg:flex flex-1 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white">
            <p className="text-6xl mb-4">🐄</p>
            <h2 className="font-display text-3xl font-bold mb-2">FarmTrack</h2>
            <p className="text-white/70 text-sm">Manajemen Kandang Ternak Digital</p>
          </div>
        </div>
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full opacity-10 bg-white" />
        <div className="absolute top-10 right-20 w-20 h-20 rounded-full opacity-10 bg-white" />
      </div>
    </div>
  )
}
