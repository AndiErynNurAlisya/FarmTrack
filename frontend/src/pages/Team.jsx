import { useEffect, useState } from 'react'
import api from '../api/axios'
import { getErrorMessage } from '../api/error'
import Modal from '../components/Modal'

const EMPTY_FORM = { name: '', email: '', password: '', role: 'staff' }

const roleLabel = { staff: 'Staff', veterinary: 'Veterinary' }
const roleColor = {
  staff: 'bg-blue-50 text-blue-600',
  veterinary: 'bg-purple-50 text-purple-600'
}

export default function Team() {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [page, setPage] = useState(1)
  const PER_PAGE = 10

  const fetchMembers = async () => {
    setLoading(true)
    try {
      const r = await api.get('/auth/members')
      setMembers(r.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchMembers() }, [])

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/auth/register-member', form)
      setShowModal(false)
      setForm(EMPTY_FORM)
      fetchMembers()
    } catch (err) {
    alert(getErrorMessage(err, 'Gagal menambahkan anggota'))
    } finally {
      setSaving(false)
    }
  }

  const del = async (id, name) => {
    if (!confirm(`Hapus ${name} dari tim?`)) return
    try {
      await api.delete(`/auth/members/${id}`)
      fetchMembers()
    } catch (err) {
    alert(getErrorMessage(err, 'Gagal menghapus anggota'))
    }
  }

  const staffCount = members.filter(m => m.role === 'staff').length
  const vetCount = members.filter(m => m.role === 'veterinary').length

  const totalPages = Math.max(1, Math.ceil(members.length / PER_PAGE))
  const currentPage = Math.min(page, totalPages)
  const pageItems = members.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE)

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Manajemen Tim</h2>
          <p className="text-gray-500 text-sm mt-1">Kelola staff dan dokter hewan di peternakan Anda</p>
        </div>
        <button onClick={() => { setForm(EMPTY_FORM); setShowModal(true) }} className="btn-primary">
          ＋ Tambah Anggota
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Anggota', val: members.length, icon: '👥', color: 'text-gray-800' },
          { label: 'Staff',         val: staffCount,     icon: '🧑‍💼', color: 'text-blue-600' },
          { label: 'Dokter Hewan',  val: vetCount,       icon: '🩺', color: 'text-purple-600' },
        ].map(s => (
          <div key={s.label} className="card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{s.icon}</span>
            </div>
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.val}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="p-5 border-b border-gray-100">
          <h3 className="font-semibold text-gray-700">Daftar Anggota Tim</h3>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-barn border-t-transparent rounded-full animate-spin"/>
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">👥</p>
            <p className="font-medium">Belum ada anggota tim</p>
            <p className="text-sm">Tambahkan staff atau dokter hewan pertama Anda</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {['Nama', 'Email', 'Role', 'Bergabung', 'Aksi'].map(h => (
                  <th key={h} className="text-left text-xs text-gray-400 font-semibold px-5 py-3 tracking-wide">
                    {h.toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageItems.map(m => (
                <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-barn/10 flex items-center justify-center text-barn font-bold text-sm">
                        {m.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-semibold text-gray-800">{m.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-500">{m.email}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${roleColor[m.role]}`}>
                      {roleLabel[m.role]}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-400">
                    {m.created_at ? new Date(m.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => del(m.id, m.name)}
                      className="text-xs text-red-400 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && members.length > 0 && (
        <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 text-sm">
          <span className="text-gray-500">
            Menampilkan {(currentPage - 1) * PER_PAGE + 1}–{Math.min(currentPage * PER_PAGE, members.length)} dari {members.length}
          </span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
              className="px-3 py-1 rounded-md border border-gray-200 text-gray-600 disabled:opacity-40 hover:bg-gray-50">‹ Sebelumnya</button>
            <span className="text-gray-600 font-medium">Hal. {currentPage} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
              className="px-3 py-1 rounded-md border border-gray-200 text-gray-600 disabled:opacity-40 hover:bg-gray-50">Berikutnya ›</button>
          </div>
        </div>
      )}
      </div>

      {/* Modal Tambah */}
      {showModal && (
        <Modal title="Tambah Anggota Tim" onClose={() => setShowModal(false)}>
          <form onSubmit={save} className="space-y-4">
            <div>
              <label className="label">Nama Lengkap *</label>
              <input required value={form.name} onChange={set('name')} className="input" placeholder="Contoh: Budi Santoso" />
            </div>
            <div>
              <label className="label">Email *</label>
              <input required type="email" value={form.email} onChange={set('email')} className="input" placeholder="email@contoh.com" />
            </div>
            <div>
              <label className="label">Password *</label>
              <input required type="password" value={form.password} onChange={set('password')} className="input" placeholder="Minimal 8 karakter" minLength={8} />
            </div>
            <div>
              <label className="label">Role *</label>
              <select value={form.role} onChange={set('role')} className="input">
                <option value="staff">Staff</option>
                <option value="veterinary">Dokter Hewan (Veterinary)</option>
              </select>
            </div>
            <p className="text-xs text-gray-400 bg-gray-50 rounded-xl p-3">
              Anggota akan dapat login menggunakan email dan password yang Anda daftarkan. Bagikan kredensial ini secara langsung kepada mereka.
            </p>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1 justify-center">Batal</button>
              <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
                {saving ? 'Menyimpan...' : 'Tambahkan'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}