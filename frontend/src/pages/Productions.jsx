import { useEffect, useState } from 'react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import Modal from '../components/Modal'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const EMPTY = { animal_id: '', production_date: '', product_type: 'susu', quantity: '', unit: 'liter', selling_price: '', notes: '' }

export default function Productions() {
  const { user } = useAuth()
  const isOwner = user?.role === 'owner'
  const [prods, setProds] = useState([])
  const [animals, setAnimals] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [filterType, setFilterType] = useState('')
  const [todaySummary, setTodaySummary] = useState({})

  const fetchAll = async () => {
    setLoading(true)
    const params = {}; if (filterType) params.product_type = filterType
    const [p, a, t] = await Promise.all([
      api.get('/productions', { params }),
      api.get('/animals'),
      api.get('/productions/summary/today'),
    ])
    setProds(p.data); setAnimals(a.data); setTodaySummary(t.data)
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [filterType])

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const save = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      await api.post('/productions', { ...form, animal_id: parseInt(form.animal_id), quantity: parseFloat(form.quantity), selling_price: form.selling_price ? parseFloat(form.selling_price) : null })
      setShowModal(false); setForm(EMPTY); fetchAll()
    } catch (err) { alert(err.response?.data?.detail || 'Gagal') }
    finally { setSaving(false) }
  }

  const del = async (id) => { if (!confirm('Hapus?')) return; await api.delete(`/productions/${id}`); fetchAll() }

  const chartData = [...prods].slice(0,14).reverse().map(p => ({ tanggal: p.production_date.slice(5), qty: parseFloat(p.quantity) }))

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Data Produksi</h2>
          <p className="text-gray-500 text-sm mt-1">Catatan hasil produksi harian hewan ternak</p>
        </div>
        {isOwner && <button onClick={() => setShowModal(true)} className="btn-primary">＋ Input Produksi</button>}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Susu Hari Ini', val: `${todaySummary.susu || 0} L`, icon: '💧' },
          { label: 'Telur Hari Ini', val: `${todaySummary.telur || 0} butir`, icon: '🥚' },
          { label: 'Total Catatan', val: prods.length, icon: '📝' },
          { label: 'Hewan Berproduksi', val: new Set(prods.map(p=>p.animal_id)).size, icon: '🐄' },
        ].map(s => (
          <div key={s.label} className="card">
            <div className="text-2xl mb-2">{s.icon}</div>
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{s.val}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-gray-700 mb-4">Tren Produksi 14 Hari Terakhir</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <XAxis dataKey="tanggal" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="qty" fill="#8B2635" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Filters + Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-700">Catatan Produksi</h3>
          <div className="flex gap-1 bg-gray-50 rounded-lg p-1">
            {['', 'susu', 'telur'].map(t => (
              <button key={t} onClick={() => setFilterType(t)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${filterType === t ? 'bg-white shadow-sm text-barn' : 'text-gray-500 hover:text-gray-700'}`}>
                {t === '' ? 'Semua' : t}
              </button>
            ))}
          </div>
        </div>
        {loading ? <div className="py-8 flex justify-center"><div className="w-6 h-6 border-4 border-barn border-t-transparent rounded-full animate-spin"/></div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 uppercase border-b border-gray-100">
                  {['Tanggal','Hewan','Jenis Produk','Jumlah','Satuan','Harga/Satuan','Catatan','Aksi'].map(h => (
                    <th key={h} className="text-left pb-3 pr-4 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {prods.length === 0 ? (
                  <tr><td colSpan={8} className="py-8 text-center text-gray-400">Belum ada data produksi</td></tr>
                ) : prods.map(p => {
                  const a = animals.find(an => an.id === p.animal_id)
                  return (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 pr-4 text-gray-600">{p.production_date}</td>
                      <td className="py-3 pr-4 font-medium text-barn">{a ? `#${a.tag_number}` : `#${p.animal_id}`}</td>
                      <td className="py-3 pr-4"><span className="px-2 py-0.5 bg-primary-50 text-barn rounded-full text-xs font-semibold capitalize">{p.product_type}</span></td>
                      <td className="py-3 pr-4 font-semibold">{p.quantity}</td>
                      <td className="py-3 pr-4 text-gray-500">{p.unit}</td>
                      <td className="py-3 pr-4 text-gray-500">{p.selling_price ? `Rp ${Number(p.selling_price).toLocaleString('id')}` : '—'}</td>
                      <td className="py-3 pr-4 text-gray-400 max-w-xs truncate">{p.notes || '—'}</td>
                      <td className="py-3">{isOwner && <button onClick={() => del(p.id)} className="text-red-400 hover:text-red-600 text-xs">Hapus</button>}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <Modal title="Input Produksi Baru" onClose={() => setShowModal(false)}>
          <form onSubmit={save} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Hewan *</label>
                <select required value={form.animal_id} onChange={set('animal_id')} className="input">
                  <option value="">Pilih hewan...</option>
                  {animals.map(a => <option key={a.id} value={a.id}>#{a.tag_number} – {a.animal_type}</option>)}
                </select>
              </div>
              <div><label className="label">Tanggal *</label><input type="date" required value={form.production_date} onChange={set('production_date')} className="input" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Jenis Produk *</label>
                <select value={form.product_type} onChange={set('product_type')} className="input">
                  <option value="susu">Susu</option><option value="telur">Telur</option>
                </select>
              </div>
              <div><label className="label">Jumlah *</label><input type="number" step="0.01" required value={form.quantity} onChange={set('quantity')} className="input" placeholder="0.00" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Satuan</label>
                <select value={form.unit} onChange={set('unit')} className="input">
                  <option value="liter">Liter</option><option value="butir">Butir</option><option value="kg">Kg</option>
                </select>
              </div>
              <div><label className="label">Harga/Satuan (Rp)</label><input type="number" value={form.selling_price} onChange={set('selling_price')} className="input" placeholder="0" /></div>
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
