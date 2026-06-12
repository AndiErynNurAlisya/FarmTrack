import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'

const TYPE_ICON = { sapi: '🐄', kambing: '🐐', ayam: '🐔', domba: '🐑' }

function startOfToday() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

export default function VaccineSchedule() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)
      setError('')
      try {
        const [healthRes, animalsRes] = await Promise.all([
          api.get('/health-records'),
          api.get('/animals'),
        ])

        const animalMap = {}
        animalsRes.data.forEach(a => { animalMap[a.id] = a })

        const today = startOfToday()
        const upcoming = healthRes.data
          .filter(r => r.next_vaccine_date && new Date(r.next_vaccine_date) >= today)
          .sort((a, b) => new Date(a.next_vaccine_date) - new Date(b.next_vaccine_date))
          .map(r => {
            const d = new Date(r.next_vaccine_date)
            const diffDays = Math.round((d - today) / 86400000)
            const animal = animalMap[r.animal_id]
            return {
              id: r.id,
              animalId: r.animal_id,
              tgl: d.getDate().toString(),
              bln: d.toLocaleString('id-ID', { month: 'short' }).toUpperCase(),
              tahun: d.getFullYear(),
              tanggalPenuh: d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
              judul: `Vaksinasi \u2014 ${r.disease || 'Jadwal Rutin'}`,
              medicine: r.medicine_name,
              animalTag: animal?.tag_number || `Hewan #${r.animal_id}`,
              animalType: animal?.animal_type || '',
              diffDays,
            }
          })
        setItems(upcoming)
      } catch (err) {
        setError(err.response?.data?.detail || 'Gagal memuat jadwal vaksinasi.')
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  const renderBadge = (diffDays) => {
    if (diffDays <= 0) return <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-600">Hari ini</span>
    if (diffDays <= 7) return <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-50 text-orange-600">{diffDays} hari lagi</span>
    return <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">{diffDays} hari lagi</span>
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link to="/dashboard" className="text-gray-400 hover:text-barn transition-colors text-sm">‹ Dashboard</Link>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mt-1">Jadwal Vaksinasi</h2>
          <p className="text-gray-500 text-sm mt-0.5">Semua jadwal vaksinasi hewan yang akan datang, diurutkan dari yang terdekat.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-barn border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
          <p className="text-red-500 text-sm">{error}</p>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="text-4xl mb-3">💉</div>
          <p className="text-gray-700 font-medium">Tidak ada jadwal vaksinasi mendatang</p>
          <p className="text-gray-400 text-sm mt-1">Jadwal akan muncul di sini saat catatan kesehatan memiliki tanggal vaksin berikutnya.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-700">Mendatang</h3>
            <span className="text-xs text-gray-400">{items.length} jadwal</span>
          </div>
          <div className="divide-y divide-gray-50">
            {items.map(j => (
              <Link key={j.id} to={`/ternak/${j.animalId}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 group transition-colors">
                <div className="text-center w-12 flex-shrink-0">
                  <p className="text-xs text-gray-400 leading-none">{j.bln}</p>
                  <p className="text-2xl font-bold text-barn leading-tight">{j.tgl}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{j.judul}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {TYPE_ICON[j.animalType] || '\ud83d\udc3e'} {j.animalTag}
                    {j.animalType ? ` \u00b7 ${j.animalType.charAt(0).toUpperCase() + j.animalType.slice(1)}` : ''}
                    {j.medicine ? ` \u00b7 ${j.medicine}` : ''}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{j.tanggalPenuh}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {renderBadge(j.diffDays)}
                  <span className="text-gray-300 group-hover:text-barn transition-colors">›</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
