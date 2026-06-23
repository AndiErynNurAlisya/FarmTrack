import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
// SELURUH desain (Farm Track + kartu + panel merah + sapi + lingkaran) jadi 1 gambar.
// Yang dikode hanya: kolom input, tombol Login, dan link Register Here.
import BG from '../assets/bg-login.png'

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

  // Kolom input: latar #D0D0D0, sudut membulat penuh (menyatu dengan kartu di gambar).
  const fieldClass =
    'w-full px-5 py-3 rounded-full bg-[#D0D0D0] text-sm text-gray-700 placeholder-gray-500 ' +
    'focus:outline-none focus:ring-2 focus:ring-barn/40 transition-all'

  return (
    <div className="min-h-screen bg-white flex items-center justify-center overflow-hidden">
      {/* STAGE: desain dibuat penuh lebar layar. Beri max-w jika ingin dibatasi. */}
      <div className="relative w-full">
        {/* Gambar desain tampil pada ukuran natural (tidak ke-zoom seperti object-cover) */}
        <img src={BG} alt="" className="w-full h-auto block select-none pointer-events-none" />

        {/* Overlay disamakan dengan LEBAR KARTU (left + w), lalu px sama besar agar
            input center & seimbang kiri-kanan terhadap kartu. */}
        <div className="absolute left-[1%] top-[41%] w-[46%] px-[6%] flex flex-col">
          {error && (
            <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <input type="email" placeholder="Username / Email" required
              value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              className={fieldClass} />
            <input type="password" placeholder="Password" required
              value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              className={fieldClass} />
            <button type="submit" disabled={loading}
              className="block mx-auto px-12 py-2.5 rounded-full font-semibold text-white bg-barn hover:bg-primary-600 shadow-lg shadow-black/40 hover:shadow-m hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-60 disabled:shadow-none">
              {loading ? 'Memproses...' : 'Login'}
            </button>
          </form>

          <p className="text-center text-sm text-white mt-6 [-webkit-text-stroke:0.5px_#ffffff] [text-shadow:_1px_1px_3px_#000000]">
            Belum memiliki akun?{' '}
            <Link to="/register" className="font-bold text-barn [-webkit-text-stroke:0.5px_#8B2635] [text-shadow:_1px_1px_3px_#000000]">Register Here.</Link>
          </p>
        </div>
      </div>
    </div>
  )
}