import { useEffect, useState } from 'react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import Modal from '../components/Modal'

const EMPTY = { feed_name: '', current_stock_kg: '', min_stock_alert: '', unit_price: '', supplier: '', last_restock_date: '' }

export default function FeedInventory() {
  const { user } = useAuth()
  const isOwner = user?.role === 'owner'
  const [feeds, setFeeds] = useState([])
  const [lowStock, setLowStock] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)

  const fetchAll = async () => {
    setLoading(true)
    const [f, l] = await Promise.all([api.get('/feed-inventory'), api.get('/feed-inventory/low-stock')])
    setFeeds(f.data); setLowStock(l.data); setLoading(false)
  }
  useEffect(() => { fetchAll() }, [])

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const openAdd = () => { setForm(EMPTY); setEditId(null); setShowModal(true) }
  const openEdit = (f) => {
    setForm({ feed_name: f.feed_name, current_stock_kg: f.current_stock_kg, min_stock_alert: f.min_stock_alert, unit_price: f.unit_price||'', supplier: f.supplier||'', last_restock_date: f.last_restock_date||'' })
    setEditId(f.id); setShowModal(true)
  }

  const save = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      const payload = { ...form, current_stock_kg: parseFloat(form.current_stock_kg), min_stock_alert: parseFloat(form.min_stock_alert), unit_price: form.unit_price ? parseFloat(form.unit_price) : null }
      if (editId) await api.put(`/feed-inventory/${editId}`, payload)
      else await api.post('/feed-inventory', payload)
      setShowModal(false); fetchAll()
    } catch (err) { alert(err.response?.data?.detail || 'Gagal') }
    finally { setSaving(false) }
  }

  const del = async (id) => { if (!confirm('Hapus?')) return; await api.delete(`/feed-inventory/${id}`); fetchAll() }

  const pct = (f) => Math.min(100, Math.round((f.current_stock_kg / Math.max(f.min_stock_alert * 3, 1)) * 100))
  const barColor = (f) => pct(f) <= 20 ? 'bg-red-500' : pct(f) <= 50 ? 'bg-yellow-400' : 'bg-green-500'

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Manajemen Stok Pakan</h2>
          <p className="text-gray-500 text-sm mt-1">Pantau ketersediaan dan kelola stok pakan ternak</p>
        </div>
        {(isOwner || user?.role === 'staff') && <button onClick={openAdd} className="btn-primary">＋ Tambah Jenis Pakan</button>}
      </div>

      {/* Alert kritis */}
      {lowStock.length > 0 && (
        <div className="card border-red-100 bg-red-50">
          <div className="flex items-center gap-3 mb-3">
            <span className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-red-600">⚠</span>
            <h3 className="font-semibold text-red-700">Inventaris Pakan Kritis</h3>
            <span className="ml-auto px-2 py-0.5 bg-red-100 text-red-600 text-xs font-bold rounded-full">{lowStock.length} ITEMS LOW</span>
          </div>
          <div className="space-y-3">
            {lowStock.map(f => (
              <div key={f.id}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-800">{f.feed_name}</span>
                  <span className="text-red-600 font-semibold">{pct(f)}% Tersisa</span>
                </div>
                <div className="w-full bg-red-100 rounded-full h-2">
                  <div className="bg-red-500 h-2 rounded-full" style={{ width: `${pct(f)}%` }} />
                </div>
                <p className="text-xs text-red-500 mt-0.5">Kritis: Stok {f.current_stock_kg} kg di bawah minimum {f.min_stock_alert} kg</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Feed table */}
      <div className="card">
        <h3 className="font-semibold text-gray-700 mb-4">Inventaris Pakan Aktif</h3>
        {loading ? <div className="py-8 flex justify-center"><div className="w-6 h-6 border-4 border-barn border-t-transparent rounded-full animate-spin"/></div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 uppercase border-b border-gray-100">
                  {['Jenis Pakan','Stok Tersedia','Min. Alert','Status','Harga/kg','Supplier','Restock Terakhir','Aksi'].map(h => (
                    <th key={h} className="text-left pb-3 pr-4 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {feeds.length === 0 ? (
                  <tr><td colSpan={8} className="py-8 text-center text-gray-400">Belum ada data pakan</td></tr>
                ) : feeds.map(f => (
                  <tr key={f.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 pr-4 font-medium text-gray-800">{f.feed_name}</td>
                    <td className="py-3 pr-4">
                      <span className={`font-semibold ${f.current_stock_kg <= f.min_stock_alert ? 'text-red-600' : 'text-gray-800'}`}>{f.current_stock_kg} kg</span>
                      <div className="w-24 h-1.5 bg-gray-100 rounded-full mt-1">
                        <div className={`h-1.5 rounded-full ${barColor(f)}`} style={{ width: `${pct(f)}%` }} />
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-gray-500">{f.min_stock_alert} kg</td>
                    <td className="py-3 pr-4">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${f.current_stock_kg <= f.min_stock_alert ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                        {f.current_stock_kg <= f.min_stock_alert ? 'Kritis' : 'Aman'}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-gray-500">{f.unit_price ? `Rp ${Number(f.unit_price).toLocaleString('id')}` : '—'}</td>
                    <td className="py-3 pr-4 text-gray-500">{f.supplier || '—'}</td>
                    <td className="py-3 pr-4 text-gray-500">{f.last_restock_date || '—'}</td>
                    <td className="py-3">
                      <div className="flex gap-2">
                          {(isOwner || user?.role === 'staff') && <button onClick={() => openEdit(f)} className="text-xs text-barn hover:underline">Edit</button>}
                          {isOwner && <button onClick={() => del(f.id)} className="text-xs text-red-400 hover:underline">Hapus</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <Modal title={editId ? 'Edit Data Pakan' : 'Tambah Pakan Baru'} onClose={() => setShowModal(false)}>
          <form onSubmit={save} className="space-y-4">
            <div><label className="label">Nama Pakan *</label><input required value={form.feed_name} onChange={set('feed_name')} className="input" placeholder="Contoh: Jagung Silase" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Stok Saat Ini (kg) *</label><input type="number" step="0.01" required value={form.current_stock_kg} onChange={set('current_stock_kg')} className="input" /></div>
              <div><label className="label">Min. Alert (kg) *</label><input type="number" step="0.01" required value={form.min_stock_alert} onChange={set('min_stock_alert')} className="input" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Harga/kg (Rp)</label><input type="number" value={form.unit_price} onChange={set('unit_price')} className="input" /></div>
              <div><label className="label">Tanggal Restock Terakhir</label><input type="date" value={form.last_restock_date} onChange={set('last_restock_date')} className="input" /></div>
            </div>
            <div><label className="label">Supplier</label><input value={form.supplier} onChange={set('supplier')} className="input" placeholder="Nama pemasok..." /></div>
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
