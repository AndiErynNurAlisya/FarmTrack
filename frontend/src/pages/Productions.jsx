import { useEffect, useState } from 'react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import Modal from '../components/Modal'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

// Pemetaan jenis hewan -> jenis produk yang sah + satuannya (selaras dengan backend).
const PRODUCT_CONFIG = {
  sapi:    [{ value: 'susu', label: 'Susu', unit: 'liter' }, { value: 'daging', label: 'Daging', unit: 'kg' }],
  kambing: [{ value: 'susu', label: 'Susu', unit: 'liter' }, { value: 'daging', label: 'Daging', unit: 'kg' }],
  ayam:    [{ value: 'telur', label: 'Telur', unit: 'butir' }, { value: 'daging', label: 'Daging', unit: 'kg' }],
  domba:   [{ value: 'wol', label: 'Wol', unit: 'kg' }, { value: 'daging', label: 'Daging', unit: 'kg' }],
}
const PRODUCT_LABELS = { susu: 'Susu', telur: 'Telur', wol: 'Wol', daging: 'Daging' }
const PRODUCT_UNITS = { susu: 'liter', telur: 'butir', wol: 'kg', daging: 'kg' }
const PRODUCT_ICONS = { susu: '💧', telur: '🥚', wol: '🧶', daging: '🥩' }
const PRODUCT_TYPES = ['susu', 'telur', 'wol', 'daging']

const EMPTY = { animal_id: '', production_date: '', product_type: '', quantity: '', unit: '', selling_price: '', notes: '' }

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

  // Jenis produk mengikuti jenis hewan yang dipilih.
  const selectedAnimal = animals.find(a => a.id === parseInt(form.animal_id))
  const productOptions = selectedAnimal ? (PRODUCT_CONFIG[selectedAnimal.animal_type] || []) : []

  const onAnimalChange = e => {
    const animal_id = e.target.value
    const animal = animals.find(a => a.id === parseInt(animal_id))
    const opts = animal ? (PRODUCT_CONFIG[animal.animal_type] || []) : []
    const first = opts[0]
    setForm(p => ({ ...p, animal_id, product_type: first?.value || '', unit: first?.unit || '' }))
  }

  const onProductChange = e => {
    const product_type = e.target.value
    const opt = productOptions.find(o => o.value === product_type)
    setForm(p => ({ ...p, product_type, unit: opt?.unit || '' }))
  }

  const save = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      await api.post('/productions', { ...form, animal_id: parseInt(form.animal_id), quantity: parseFloat(form.quantity), selling_price: form.selling_price ? parseFloat(form.selling_price) : null })
      setShowModal(false); setForm(EMPTY); fetchAll()
    } catch (err) { alert(err.response?.data?.detail || 'Gagal') }
    finally { setSaving(false) }
  }

  const del = async (id) => { if (!confirm('Hapus?')) return; await api.delete(`/productions/${id}`); fetchAll() }

  const axisTick = { fontSize: 12 }
  // --- Tren 7 hari terakhir: total produksi per hari, dipisah per kategori ---
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i))
    return d.toISOString().slice(0, 10) // YYYY-MM-DD
  })
  // { susu: [{tanggal, qty}], telur: [...], wol: [...], daging: [...] } untuk 7 hari
  const chartByType = PRODUCT_TYPES.reduce((acc, type) => {
    acc[type] = last7.map(date => {
      const total = prods
        .filter(p => p.product_type === type && (p.production_date || '').slice(0, 10) === date)
        .reduce((sum, p) => sum + (parseFloat(p.quantity) || 0), 0)
      return { tanggal: date.slice(5), qty: Math.round(total * 100) / 100 }
    })
    return acc
  }, {})
  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Data Produksi</h2>
          <p className="text-gray-500 text-sm mt-1">Catatan hasil produksi harian hewan ternak</p>
        </div>
        {(isOwner || user?.role === 'staff') && <button onClick={() => setShowModal(true)} className="btn-primary">＋ Input Produksi</button>}
      </div>

      {/* Summary cards — kartu produk mengikuti jenis produksi hari ini */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          ...PRODUCT_TYPES
            .filter(t => todaySummary[t] != null)
            .map(t => ({
              label: `${PRODUCT_LABELS[t]} Hari Ini`,
              val: `${todaySummary[t] || 0} ${PRODUCT_UNITS[t]}`,
              icon: PRODUCT_ICONS[t],
            })),
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

      {/* Chart — total produksi per hari per kategori (7 hari terakhir) */}
      {prods.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {['susu', 'telur', 'daging', 'wol'].map(type => (
            <div key={type} className="card">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">{PRODUCT_ICONS[type]}</span>
                <h3 className="font-semibold text-gray-700">Tren {PRODUCT_LABELS[type]} (7 Hari)</h3>
                <span className="text-xs text-gray-400">({PRODUCT_UNITS[type]})</span>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={chartByType[type]}>
                  <XAxis dataKey="tanggal" tick={axisTick} />
                  <YAxis tick={axisTick} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="qty" fill="#8B2635" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ))}
        </div>
      )}

      {/* Filters + Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-700">Catatan Produksi</h3>
          <div className="flex gap-1 bg-gray-50 rounded-lg p-1">
            {['', ...PRODUCT_TYPES].map(t => (
              <button key={t} onClick={() => setFilterType(t)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-all capitalize ${filterType === t ? 'bg-white shadow-sm text-barn' : 'text-gray-500 hover:text-gray-700'}`}>
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
                <select required value={form.animal_id} onChange={onAnimalChange} className="input">
                  <option value="">Pilih hewan...</option>
                  {animals.map(a => <option key={a.id} value={a.id}>#{a.tag_number} – {a.animal_type}</option>)}
                </select>
              </div>
              <div><label className="label">Tanggal *</label><input type="date" required value={form.production_date} onChange={set('production_date')} className="input" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Jenis Produk *</label>
                <select required value={form.product_type} onChange={onProductChange} disabled={!form.animal_id} className="input disabled:bg-gray-50 disabled:text-gray-400">
                  <option value="">{form.animal_id ? 'Pilih produk...' : 'Pilih hewan dulu'}</option>
                  {productOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div><label className="label">Jumlah *</label><input type="number" step="0.01" required value={form.quantity} onChange={set('quantity')} className="input" placeholder="0.00" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Satuan</label>
                <input value={form.unit} readOnly placeholder="—" title="Satuan mengikuti jenis produk" className="input bg-gray-50 text-gray-500" />
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
