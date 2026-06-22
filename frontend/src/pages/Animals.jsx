import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import { getErrorMessage } from '../api/error'
import { useAuth } from '../context/AuthContext'
import AnimalFormModal from '../components/AnimalFormModal'
import StatusBadge from '../components/StatusBadge'

const TYPES = ['Semua', 'sapi', 'kambing', 'domba', 'ayam']
//const EMPTY_FORM = { tag_number: '', animal_type: 'sapi', breed: '', gender: 'betina', status: 'sehat', weight_kg: '', birth_date: '', purchase_date: '', notes: '' }

export default function Animals() {
  const { user } = useAuth()
  const [animals, setAnimals] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('Semua')
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingAnimal, setEditingAnimal] = useState(null)

  const isOwner = user?.role === 'owner'

  const fetch = async () => {
    setLoading(true)
    const params = {}
    if (filter !== 'Semua') params.animal_type = filter
    if (search) params.search = search
    const r = await api.get('/animals', { params })
    setAnimals(r.data)
    setLoading(false)
  }

  useEffect(() => {
  const timer = setTimeout(() => { fetch() }, 400)
  return () => clearTimeout(timer)
}, [filter, search])

  const openAdd = () => { setEditingAnimal(null); setShowModal(true) }
  const openEdit = (a) => { setEditingAnimal(a); setShowModal(true) }

  const del = async (id) => {
    if (!confirm('Hapus hewan ini?')) return
    await api.delete(`/animals/${id}`); fetch()
  }

  const counts = { total: animals.length, sehat: animals.filter(a=>a.status==='sehat').length, sakit: animals.filter(a=>a.status==='sakit').length, kritis: animals.filter(a=>a.status==='kritis').length, mati: animals.filter(a=>a.status==='mati').length }

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Inventaris Ternak</h2>
          <p className="text-gray-500 text-sm mt-1">Kelola dan pantau catatan kesehatan semua hewan ternak</p>
        </div>
        {isOwner && <button onClick={openAdd} className="btn-primary">＋ Tambah Hewan</button>}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Ternak', val: counts.total, color: 'text-gray-800', bar: 'bg-barn' },
          { label: 'Sehat',        val: counts.sehat, color: 'text-green-600', bar: 'bg-green-500' },
          { label: 'Sakit',        val: counts.sakit, color: 'text-yellow-600', bar: 'bg-yellow-400' },
          { label: 'Kritis',       val: counts.kritis, color: 'text-red-600', bar: 'bg-red-500' },
        ].map(s => (
          <div key={s.label} className="card">
            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
            <p className={`text-3xl font-bold ${s.color}`}>{s.val}</p>
            <div className="w-full h-1 bg-gray-100 rounded-full mt-3">
              <div className={`h-1 rounded-full ${s.bar}`} style={{ width: counts.total ? `${(s.val/counts.total)*100}%` : '0%' }} />
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari ID atau nama hewan..."
            className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-barn/20 focus:border-barn w-64" />
        </div>
        <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1">
          {TYPES.map(t => (
            <button key={t} onClick={() => setFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${filter === t ? 'bg-barn text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
              {t.charAt(0).toUpperCase()+t.slice(1)}
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-400 ml-auto">Menampilkan {animals.length} ternak</span>
      </div>

      {/* Animal cards grid */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-barn border-t-transparent rounded-full animate-spin"/></div>
      ) : animals.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🐄</p>
          <p className="font-medium">Belum ada hewan ternak</p>
          <p className="text-sm">Tambahkan hewan pertama Anda</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {animals.map(a => (
            <div key={a.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <span className="text-xs font-semibold text-gray-400 uppercase">ID: {a.tag_number}</span>
                <StatusBadge status={a.status} />
              </div>
              <div className="mb-3">
                <p className="font-bold text-gray-800 capitalize">{a.breed || a.animal_type}</p>
                <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full capitalize">{a.animal_type}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-4">
                <div><span className="block text-gray-400">Berat</span><span className="font-semibold text-gray-700">{a.weight_kg ? `${a.weight_kg} kg` : '—'}</span></div>
                <div><span className="block text-gray-400">Kelamin</span><span className="font-semibold text-gray-700 capitalize">{a.gender || '—'}</span></div>
              </div>
              <div className="flex items-center gap-2 pt-3 border-t border-gray-50">
                <Link to={`/ternak/${a.id}`} className="flex-1 text-center py-1.5 text-xs font-semibold text-barn hover:bg-primary-50 rounded-lg transition-colors">Detail</Link>
                {isOwner && <>
                  <button onClick={() => openEdit(a)} className="flex-1 text-center py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Edit</button>
                  <button onClick={() => del(a.id)} className="py-1.5 px-2 text-xs text-red-400 hover:bg-red-50 rounded-lg transition-colors">🗑</button>
                </>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <AnimalFormModal
        open={showModal}
        onClose={() => setShowModal(false)}
        animal={editingAnimal}
        onSaved={fetch}
      />
    </div>
  )
}
