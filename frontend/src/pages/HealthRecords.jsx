import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'

export default function HealthRecords() {
  const [records, setRecords] = useState([])
  const [animals, setAnimals] = useState([])
  const [loading, setLoading] = useState(true)
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
          <p className="text-gray-500 text-sm mt-1">Ringkasan riwayat pemeriksaan, pengobatan, dan jadwal vaksinasi ternak</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 text-blue-700 text-sm rounded-lg px-4 py-3 flex items-start gap-2">
        <span>ℹ️</span>
        <span>Pencatatan hasil pemeriksaan kini dilakukan langsung dari halaman masing-masing hewan. Buka <Link to="/ternak" className="font-medium underline">Data Hewan</Link>, pilih hewan, lalu klik <b>Log Health Event</b>.</span>
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
                  {['Tanggal','Hewan','Penyakit','Gejala','Pengobatan','Obat','Vaksin Berikutnya'].map(h => (
                    <th key={h} className="text-left pb-3 pr-4 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {records.length === 0 ? (
                  <tr><td colSpan={7} className="py-10 text-center text-gray-400">Belum ada catatan kesehatan</td></tr>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}