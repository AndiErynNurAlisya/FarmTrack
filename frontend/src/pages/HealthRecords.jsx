import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import Modal from '../components/Modal'

const EMPTY = {
  animal_id: '',
  check_date: '',
  disease: '',
  symptoms: '',
  treatment: '',
  medicine_name: '',
  next_vaccine_date: '',
}

export default function HealthRecords() {
  const { user } = useAuth()
  const isOwner = user?.role === 'owner'
  const [searchParams, setSearchParams] = useSearchParams()

  const [records, setRecords] = useState([])
  const [animals, setAnimals] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [filterAnimal, setFilterAnimal] = useState('')

  const fetchAll = async () => {
    setLoading(true)
    const params = {}
    if (filterAnimal) params.animal_id = filterAnimal
    try {
      const [r, a] = await Promise.all([
        api.get('/health-records', { params }),
        api.get('/animals'),
      ])
      setRecords(r.data)
      setAnimals(a.data)
    } catch (err) {
      alert(err.response?.data?.detail || 'Gagal memuat data kesehatan')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [filterAnimal])

  // Buka modal otomatis bila datang dari tombol "+" dashboard (?new=1)
  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setForm(EMPTY)
      setShowModal(true)
      searchParams.delete('new')
      setSearchParams(searchParams, { replace: true })
    }
  }, [])

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const openAdd = () => { setForm(EMPTY); setShowModal(true) }

  const save = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      const payload = {
        ...form,
        animal_id: parseInt(form.animal_id),
        disease: form.disease || null,
        symptoms: form.symptoms || null,
        treatment: form.treatment || null,
        medicine_name: form.medicine_name || null,
        next_vaccine_date: form.next_vaccine_date || null,
      }
      await api.post('/health-records', payload)
      setShowModal(false); setForm(EMPTY); fetchAll()
    } catch (err) {
      alert(err.response?.data?.detail || 'Gagal menyimpan catatan')
    } finally { setSaving(false) }
  }

  const del = async (id) => {
    if (!confirm('Hapus catatan kesehatan ini?')) return
    try {
      await api.delete(`/health-records/${id}`)
      fetchAll()
    } catch (err) {
      alert(err.response?.data?.detail || 'Gagal menghapus catatan')
    }
  }

  const animalLabel = (id) => {
    const a = animals.find(an => an.id === id)
    return a ? `#${a.tag_number} — ${a.animal_type}` : `#${id}`
  }

  const today = new Date()
  const upcomingVaccines = records.filter(
    r => r.next_vaccine_date && new Date(r.next_vaccine_date) >= today
  ).length

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Catatan Kesehatan</h2>
          <p className="text-gray-500 text-sm mt-1">Riwayat pemeriksaan, pengobatan, dan jadwal vaksinasi ternak</p>
        </div>
        <button onClick={openAdd} className="btn-primary">＋ Catat Pemeriksaan</button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Catatan', val: records.length, icon: '📋' },
          { label: 'Vaksinasi Mendatang', val: upcomingVaccines, icon: '💉' },
          { label: 'Hewan Terpantau', val: new Set(records.map(r => r.animal_id)).size, icon: '🐄' },
        ].map(s => (
          <div key={s.label} className="card">
            <div className="text-2xl mb-2">{s.icon}</div>
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{s.val}</p>
          </div>
        ))}
      </div>

      {/* Filter + Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <h3 className="font-semibold text-gray-700">Riwayat Kesehatan</h3>
          <select value={filterAnimal} onChange={e => setFilterAnimal(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-barn/20">
            <option value="">Semua Hewan</option>
            {animals.map(a => <option key={a.id} value={a.id}>#{a.tag_number} — {a.animal_type}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="py-8 flex justify-center"><div className="w-6 h-6 border-4 border-barn border-t-transparent rounded-full animate-spin"/></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 uppercase border-b border-gray-100">
                  {['Tanggal','Hewan','Penyakit','Gejala','Pengobatan','Obat','Vaksin Berikutnya','Aksi'].map(h => (
                    <th key={h} className="text-left pb-3 pr-4 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {records.length === 0 ? (
                  <tr><td colSpan={8} className="py-10 text-center text-gray-400">Belum ada catatan kesehatan</td></tr>
                ) : records.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 pr-4 text-gray-600 whitespace-nowrap">{r.check_date}</td>
                    <td className="py-3 pr-4 font-medium text-barn whitespace-nowrap">
                      <Link to={`/ternak/${r.animal_id}`} className="hover:underline">{animalLabel(r.animal_id)}</Link>
                    </td>
                    <td className="py-3 pr-4 font-semibold text-gray-800">{r.disease || 'Pemeriksaan Rutin'}</td>
                    <td className="py-3 pr-4 text-gray-500 max-w-xs truncate">{r.symptoms || '—'}</td>
                    <td className="py-3 pr-4 text-gray-500 max-w-xs truncate">{r.treatment || '—'}</td>
                    <td className="py-3 pr-4 text-gray-500">{r.medicine_name || '—'}</td>
                    <td className="py-3 pr-4 text-gray-500 whitespace-nowrap">{r.next_vaccine_date || '—'}</td>
                    <td className="py-3">
                      {isOwner && <button onClick={() => del(r.id)} className="text-red-400 hover:text-red-600 text-xs">Hapus</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <Modal title="Catat Pemeriksaan Kesehatan" onClose={() => setShowModal(false)}>
          <form onSubmit={save} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Hewan *</label>
                <select required value={form.animal_id} onChange={set('animal_id')} className="input">
                  <option value="">Pilih hewan...</option>
                  {animals.map(a => <option key={a.id} value={a.id}>#{a.tag_number} – {a.animal_type}</option>)}
                </select>
              </div>
              <div><label className="label">Tanggal Periksa *</label><input type="date" required value={form.check_date} onChange={set('check_date')} className="input" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Nama Penyakit</label><input value={form.disease} onChange={set('disease')} className="input" placeholder="Contoh: Mastitis" /></div>
              <div><label className="label">Nama Obat</label><input value={form.medicine_name} onChange={set('medicine_name')} className="input" placeholder="Nama obat..." /></div>
            </div>
            <div><label className="label">Gejala</label><textarea value={form.symptoms} onChange={set('symptoms')} rows={2} className="input resize-none" placeholder="Gejala yang diamati..." /></div>
            <div><label className="label">Tindakan Pengobatan</label><textarea value={form.treatment} onChange={set('treatment')} rows={2} className="input resize-none" placeholder="Tindakan yang diberikan..." /></div>
            <div><label className="label">Jadwal Vaksin Berikutnya</label><input type="date" value={form.next_vaccine_date} onChange={set('next_vaccine_date')} className="input" /></div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1 justify-center">Batal</button>
              <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">{saving ? 'Menyimpan...' : 'Simpan Catatan'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
