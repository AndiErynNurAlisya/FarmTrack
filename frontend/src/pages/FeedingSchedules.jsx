import { useEffect, useState } from 'react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import Modal from '../components/Modal'

const EMPTY = { animal_type: 'sapi', feed_id: '', feeding_time: '06:00', portion_kg: '', is_active: true, notes: '' }

export default function FeedingSchedules() {
  const { user } = useAuth()
  const [schedules, setSchedules] = useState([])
  const [feeds, setFeeds] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [filterType, setFilterType] = useState('')

  const fetchAll = async () => {
    setLoading(true)
    const params = {}; if (filterType) params.animal_type = filterType
    const [s, f] = await Promise.all([api.get('/feeding-schedules', { params }), api.get('/feed-inventory')])
    setSchedules(s.data); setFeeds(f.data); setLoading(false)
  }
  useEffect(() => { fetchAll() }, [filterType])

  const set = k => e => setForm(p => ({ ...p, [k]: k === 'is_active' ? e.target.value === 'true' : e.target.value }))

  const openAdd = () => { setForm(EMPTY); setEditId(null); setShowModal(true) }
  const openEdit = (s) => {
    setForm({ animal_type: s.animal_type, feed_id: s.feed_id, feeding_time: s.feeding_time, portion_kg: s.portion_kg, is_active: s.is_active, notes: s.notes||'' })
    setEditId(s.id); setShowModal(true)
  }

  const save = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      const payload = { ...form, feed_id: parseInt(form.feed_id), portion_kg: parseFloat(form.portion_kg) }
      if (editId) await api.put(`/feeding-schedules/${editId}`, payload)
      else await api.post('/feeding-schedules', payload)
      setShowModal(false); fetchAll()
    } catch (err) { alert(err.response?.data?.detail || 'Gagal') }
    finally { setSaving(false) }
  }

  const del = async (id) => { if (!confirm('Hapus jadwal?')) return; await api.delete(`/feeding-schedules/${id}`); fetchAll() }
  const toggle = async (s) => { await api.put(`/feeding-schedules/${s.id}`, { is_active: !s.is_active }); fetchAll() }

  const grouped = schedules.reduce((acc, s) => {
    const key = s.feeding_time; if (!acc[key]) acc[key] = []; acc[key].push(s); return acc
  }, {})

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Jadwal Pemberian Pakan</h2>
          <p className="text-gray-500 text-sm mt-0.5">{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary">🖨 Cetak Laporan</button>
          <button onClick={openAdd} className="btn-primary">＋ Tambah Jadwal</button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {['', 'sapi', 'kambing', 'domba', 'ayam'].map(t => (
          <button key={t} onClick={() => setFilterType(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${filterType === t ? 'bg-barn text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {t === '' ? 'Semua' : t}
          </button>
        ))}
      </div>

      {loading ? <div className="py-8 flex justify-center"><div className="w-6 h-6 border-4 border-barn border-t-transparent rounded-full animate-spin"/></div> : (
        <div className="space-y-3">
          {schedules.length === 0 ? (
            <div className="card text-center py-12 text-gray-400">
              <p className="text-3xl mb-2">📅</p><p>Belum ada jadwal pakan</p>
            </div>
          ) : (
            Object.entries(grouped).sort(([a],[b]) => a.localeCompare(b)).map(([time, items]) => (
              <div key={time} className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-gray-700 text-lg">{time}</span>
                  <span className="text-xs text-gray-400">WIB</span>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>
                {items.map(s => {
                  const feed = feeds.find(f => f.id === s.feed_id)
                  return (
                    <div key={s.id} className={`card flex items-center gap-4 ${!s.is_active ? 'opacity-60' : ''}`}>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-800 capitalize">Pakan {s.animal_type}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${s.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {s.is_active ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">{s.portion_kg} kg {feed ? `• ${feed.feed_name}` : ''} {s.notes && `• ${s.notes}`}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => toggle(s)}
                          className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${s.is_active ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}>
                          {s.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                        </button>
                        <button onClick={() => openEdit(s)} className="text-xs px-3 py-1.5 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100">Edit</button>
                        <button onClick={() => del(s.id)} className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100">Hapus</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            ))
          )}
        </div>
      )}

      {showModal && (
        <Modal title={editId ? 'Edit Jadwal Pakan' : 'Tambah Jadwal Pakan'} onClose={() => setShowModal(false)}>
          <form onSubmit={save} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Jenis Hewan *</label>
                <select value={form.animal_type} onChange={set('animal_type')} className="input">
                  {['sapi','kambing','domba','ayam'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div><label className="label">Jenis Pakan *</label>
                <select required value={form.feed_id} onChange={set('feed_id')} className="input">
                  <option value="">Pilih pakan...</option>
                  {feeds.map(f => <option key={f.id} value={f.id}>{f.feed_name}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Waktu Pemberian *</label><input type="time" required value={form.feeding_time} onChange={set('feeding_time')} className="input" /></div>
              <div><label className="label">Porsi (kg) *</label><input type="number" step="0.01" required value={form.portion_kg} onChange={set('portion_kg')} className="input" /></div>
            </div>
            <div><label className="label">Status</label>
              <select value={form.is_active.toString()} onChange={set('is_active')} className="input">
                <option value="true">Aktif</option><option value="false">Nonaktif</option>
              </select>
            </div>
            <div><label className="label">Catatan</label><textarea value={form.notes} onChange={set('notes')} rows={2} className="input resize-none" /></div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1 justify-center">Batal</button>
              <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">{saving ? 'Menyimpan...' : 'Simpan'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
