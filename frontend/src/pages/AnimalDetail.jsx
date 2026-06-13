import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import Modal from '../components/Modal'
import StatusBadge from '../components/StatusBadge'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const HEALTH_EMPTY = { check_date: '', disease: '', symptoms: '', treatment: '', medicine_name: '', next_vaccine_date: '' }
const ANIMAL_EMPTY = { tag_number: '', animal_type: 'sapi', breed: '', gender: 'betina', status: 'sehat', weight_kg: '', birth_date: '', purchase_date: '', notes: '' }

export default function AnimalDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [animal, setAnimal] = useState(null)
  const [health, setHealth] = useState([])
  const [prods, setProds] = useState([])
  const [loading, setLoading] = useState(true)
  const [showHealth, setShowHealth] = useState(false)
  const [healthForm, setHealthForm] = useState(HEALTH_EMPTY)
  const [showEdit, setShowEdit] = useState(false)
  const [editForm, setEditForm] = useState(ANIMAL_EMPTY)
  const [saving, setSaving] = useState(false)

  const isOwner = user?.role === 'owner'

  const fetchAll = async () => {
  setLoading(true)
  try {
    // Data hewan adalah yang utama.
    const a = await api.get(`/animals/${id}`)
    setAnimal(a.data)

    // Kesehatan & produksi bersifat best-effort: sebagian role (mis. veterinary)
    // tidak punya akses ke produksi, jadi kegagalannya tidak boleh memblokir halaman.
    const [h, p] = await Promise.allSettled([
      api.get('/health-records', { params: { animal_id: id } }),
      api.get('/productions', { params: { animal_id: id } }),
    ])
    setHealth(h.status === 'fulfilled' ? h.value.data : [])
    setProds(p.status === 'fulfilled' ? p.value.data : [])
  } catch (err) {
    setAnimal(null)
  } finally {
    setLoading(false)
  }
}

  useEffect(() => { fetchAll() }, [id])

  const setHF = k => e => setHealthForm(p => ({ ...p, [k]: e.target.value }))
  const setEF = k => e => setEditForm(p => ({ ...p, [k]: e.target.value }))

  const openEditProfile = () => {
    if (!animal) return
    setEditForm({
      tag_number: animal.tag_number || '',
      animal_type: animal.animal_type || 'sapi',
      breed: animal.breed || '',
      gender: animal.gender || 'betina',
      status: animal.status || 'sehat',
      weight_kg: animal.weight_kg || '',
      birth_date: animal.birth_date || '',
      purchase_date: animal.purchase_date || '',
      notes: animal.notes || '',
    })
    setShowEdit(true)
  }

  const saveAnimal = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      const payload = { ...editForm, weight_kg: editForm.weight_kg ? parseFloat(editForm.weight_kg) : null }
      await api.put(`/animals/${id}`, payload)
      setShowEdit(false); fetchAll()
    } catch (err) {
      const d = err.response?.data?.detail
      const msg = Array.isArray(d)
        ? d.map(x => x.msg).join(', ')
        : (typeof d === 'string' ? d : 'Gagal menyimpan data hewan')
      alert(msg)
    } finally { setSaving(false) }
  }

  const saveHealth = async (e) => {
  e.preventDefault(); setSaving(true)
  try {
    // Field opsional yang kosong dikirim sebagai null (bukan string kosong),
    // agar tanggal/teks kosong tidak ditolak validasi backend.
    const payload = {
      animal_id: parseInt(id),
      check_date: healthForm.check_date,
      disease: healthForm.disease || null,
      symptoms: healthForm.symptoms || null,
      treatment: healthForm.treatment || null,
      medicine_name: healthForm.medicine_name || null,
      next_vaccine_date: healthForm.next_vaccine_date || null,
    }
    await api.post('/health-records', payload)
    setShowHealth(false); setHealthForm(HEALTH_EMPTY); fetchAll()
  } catch (err) {
    const d = err.response?.data?.detail
    const msg = Array.isArray(d)
      ? d.map(x => x.msg).join(', ')
      : (typeof d === 'string' ? d : 'Gagal menyimpan catatan')
    alert(msg)
  }
  finally { setSaving(false) }
}

  const calcAge = (birth) => {
    if (!birth) return '—'
    const diff = Date.now() - new Date(birth).getTime()
    const months = Math.floor(diff / (1000 * 60 * 60 * 24 * 30))
    return months >= 12 ? `${Math.floor(months / 12)} Tahun` : `${months} Bulan`
  }

  const chartData = prods.slice(0, 30).reverse().map((p, i) => ({
    day: `DAY ${i + 1}`,
    qty: parseFloat(p.quantity)
  }))

  const animalEmoji = { sapi: '🐄', kambing: '🐐', ayam: '🐔', domba: '🐑' }

  const statusColor = (s) => {
    if (s === 'Completed') return 'bg-green-100 text-green-700'
    if (s === 'Observation') return 'bg-yellow-100 text-yellow-700'
    return 'bg-gray-100 text-gray-600'
  }

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="w-8 h-8 border-4 border-barn border-t-transparent rounded-full animate-spin"/>
    </div>
  )
  if (!animal) return <div className="text-center py-16 text-gray-400">Hewan tidak ditemukan</div>

  const prodHarian = prods.length > 0 ? `${prods[0].quantity} ${prods[0].unit || 'L'}` : '—'

    // --- Statistik produksi dari database ---
    const prodUnit = prods[0]?.unit || 'L'
    const prodQtys = prods.map(p => parseFloat(p.quantity)).filter(n => !isNaN(n))
    const latestQty = prodQtys[0] ?? null
    const avgQty = prodQtys.length ? prodQtys.reduce((a, b) => a + b, 0) / prodQtys.length : 0
    // Selisih produksi terbaru vs rata-rata (hanya bermakna bila ada >1 catatan)
    const yieldDiff = prodQtys.length > 1 && latestQty != null ? latestQty - avgQty : null
    const totalProduksi = prodQtys.reduce((a, b) => a + b, 0)

  return (
    <div className="space-y-5 fade-in">
      {/* Breadcrumb + Title */}
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
          <Link to="/ternak" className="hover:text-barn transition-colors">Livestock</Link>
          <span>›</span>
          <span className="text-gray-700 font-medium capitalize">{animal.animal_type} Profile</span>
        </div>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">
            {animal.breed || animal.animal_type} #{animal.tag_number}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={openEditProfile}
              className="flex items-center gap-1.5 px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
            >
              ✏ Edit Profile
            </button>
            <button
              onClick={() => setShowHealth(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-sm bg-barn text-white rounded-lg hover:bg-barn/90 transition-colors font-medium"
            >
              📋 Log Health Event
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* LEFT — Animal Card */}
        <div className="space-y-4">
          {/* Main animal card */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            {/* Animal image area */}
            <div className="relative">
              <div className="w-full h-48 bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
                <span className="text-8xl">{animalEmoji[animal.animal_type] || '🐄'}</span>
              </div>
              <div className="absolute top-3 right-3">
                <span className="flex items-center gap-1 bg-white text-green-600 text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block"/>
                  {animal.status === 'sehat' ? 'Healthy' : animal.status}
                </span>
              </div>
            </div>

            {/* Info grid */}
            <div className="p-4 grid grid-cols-2 gap-3">
              {[
                ['BREED', animal.breed || '—'],
                ['AGE', calcAge(animal.birth_date)],
                ['GENDER', animal.gender || '—'],
                ['STATUS', animal.status],
              ].map(([k, v]) => (
                <div key={k}>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">{k}</p>
                  <p className="text-sm font-semibold text-gray-800 capitalize mt-0.5">{v}</p>
                </div>
              ))}
            </div>

            {/* Biological score */}
            <div className="px-4 pb-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-gray-500">Biological Score</span>
                <span className="text-xs font-bold text-gray-700">94/100</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="bg-barn h-2 rounded-full" style={{ width: '94%' }}/>
              </div>
            </div>

            {/* Biological Identifiers */}
            <div className="px-4 pb-4 border-t border-gray-50 pt-3">
              <p className="text-xs font-semibold text-gray-500 mb-2">Biological Identifiers</p>
              <div className="space-y-1.5">
                {[
                  ['RFID Tag', animal.tag_number],
                  ['Berat', animal.weight_kg ? `${animal.weight_kg} kg` : '—'],
                  ['Tgl Beli', animal.purchase_date || '—'],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between text-sm">
                    <span className="text-gray-400">{k}</span>
                    <span className="font-semibold text-gray-700">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT — Stats + Health Log */}
        <div className="col-span-2 space-y-4">
          {/* Top stat cards */}
        <div className="grid grid-cols-3 gap-3">
          {/* Daily Yield — dari DB + perbandingan nyata vs rata-rata */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">💧</span>
              <span className="text-xs text-gray-500">Daily Yield</span>
            </div>
            <p className="text-xl font-bold text-gray-800">{prodHarian}</p>
            {yieldDiff != null ? (
              <p className={`text-xs mt-1 ${yieldDiff >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {yieldDiff >= 0 ? '↑' : '↓'} {yieldDiff >= 0 ? '+' : ''}{yieldDiff.toFixed(1)} {prodUnit} vs rata-rata
              </p>
            ) : (
              <p className="text-xs text-gray-400 mt-1">Belum ada pembanding</p>
            )}
          </div>

          {/* Current Weight — dari DB */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">⚖</span>
              <span className="text-xs text-gray-500">Current Weight</span>
            </div>
            <p className="text-xl font-bold text-gray-800">{animal.weight_kg ? `${animal.weight_kg} kg` : '—'}</p>
          </div>

          {/* Total Produksi — dari DB (pengganti Feed Intake statis) */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">📦</span>
              <span className="text-xs text-gray-500">Total Produksi</span>
            </div>
            <p className="text-xl font-bold text-gray-800">
              {prodQtys.length ? `${totalProduksi.toFixed(1)} ${prodUnit}` : '—'}
            </p>
            <p className="text-xs text-gray-400 mt-1">{prods.length} catatan produksi</p>
          </div>
        </div>

          {/* Health & Activity Log */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
              <h3 className="font-semibold text-gray-700">Health & Activity Log</h3>
              <div className="flex gap-2">
                <button className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg">⚙</button>
                <button className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg">↓</button>
              </div>
            </div>

            {health.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-sm">Belum ada catatan kesehatan</div>
            ) : (
              <>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-50">
                      {['TANGGAL', 'PENYAKIT / PEMERIKSAAN', 'TINDAKAN', 'OBAT', 'VAKSIN BERIKUTNYA'].map(h => (
                        <th key={h} className="text-left text-xs text-gray-400 font-semibold px-5 py-3 tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {health.map((h) => (
                      <tr key={h.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3 text-sm text-gray-500 whitespace-nowrap">{h.check_date}</td>
                        <td className="px-5 py-3">
                          <p className="text-sm font-semibold text-gray-800">{h.disease || 'Pemeriksaan Rutin'}</p>
                          {h.symptoms && <p className="text-xs text-gray-400 mt-0.5">{h.symptoms}</p>}
                        </td>
                        <td className="px-5 py-3 text-sm text-gray-500">{h.treatment || '—'}</td>
                        <td className="px-5 py-3 text-sm text-gray-500">{h.medicine_name || '—'}</td>
                        <td className="px-5 py-3 text-sm whitespace-nowrap">
                          {h.next_vaccine_date
                            ? <span className="text-gray-600">{h.next_vaccine_date}</span>
                            : <span className="text-gray-300">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="px-5 py-3 text-center">
                  <button className="text-sm text-barn hover:underline">View Full Chronological History</button>
                </div>
              </>
            )}
          </div>

          {/* Chart + Active Insights */}
          <div className="grid grid-cols-3 gap-4">
            {/* Chart */}
            <div className="col-span-3 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-700">Milk Production Trends (30 Days)</h3>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-barn inline-block"/>Current</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-300 inline-block"/>Breed Avg</span>
                </div>
              </div>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={chartData} barSize={12}>
                    <XAxis dataKey="day" tick={{ fontSize: 9 }} tickLine={false} axisLine={false}
                      ticks={['DAY 1', `DAY ${Math.ceil(chartData.length/2)}`, 'TODAY']}
                    />
                    <YAxis hide />
                    <Tooltip contentStyle={{ fontSize: 12 }} />
                    <Bar dataKey="qty" fill="#8B2635" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-40 flex items-center justify-center text-gray-400 text-sm">
                  Belum ada data produksi
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Health Modal */}
      {showHealth && (
        <Modal title="Catat Kesehatan Hewan" onClose={() => setShowHealth(false)}>
          <form onSubmit={saveHealth} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Tanggal Periksa *</label><input type="date" required value={healthForm.check_date} onChange={setHF('check_date')} className="input" /></div>
              <div><label className="label">Nama Penyakit</label><input value={healthForm.disease} onChange={setHF('disease')} className="input" placeholder="Contoh: Flu, Mastitis" /></div>
            </div>
            <div><label className="label">Gejala</label><textarea value={healthForm.symptoms} onChange={setHF('symptoms')} rows={2} className="input resize-none" placeholder="Gejala yang diamati..." /></div>
            <div><label className="label">Tindakan Pengobatan</label><textarea value={healthForm.treatment} onChange={setHF('treatment')} rows={2} className="input resize-none" placeholder="Tindakan yang diberikan..." /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Nama Obat</label><input value={healthForm.medicine_name} onChange={setHF('medicine_name')} className="input" placeholder="Nama obat..." /></div>
              <div><label className="label">Jadwal Vaksin Berikutnya</label><input type="date" value={healthForm.next_vaccine_date} onChange={setHF('next_vaccine_date')} className="input" /></div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowHealth(false)} className="btn-secondary flex-1 justify-center">Batal</button>
              <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">{saving ? 'Menyimpan...' : 'Simpan Catatan'}</button>
            </div>
          </form>
        </Modal>
      )}
      {showEdit && (
        <Modal title="Edit Data Hewan" onClose={() => setShowEdit(false)}>
          <form onSubmit={saveAnimal} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Nomor Tag *</label><input required value={editForm.tag_number} onChange={setEF('tag_number')} className="input" placeholder="Contoh: BV-001" /></div>
              <div><label className="label">Jenis Hewan *</label>
                <select value={editForm.animal_type} onChange={setEF('animal_type')} className="input">
                  {['sapi','kambing','domba','ayam'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Ras/Breed</label><input value={editForm.breed} onChange={setEF('breed')} className="input" placeholder="Contoh: Limousin" /></div>
              <div><label className="label">Jenis Kelamin</label>
                <select value={editForm.gender} onChange={setEF('gender')} className="input">
                  <option value="betina">Betina</option>
                  <option value="jantan">Jantan</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Berat (kg)</label><input type="number" step="0.01" value={editForm.weight_kg} onChange={setEF('weight_kg')} className="input" placeholder="0.00" /></div>
              <div><label className="label">Status</label>
                <select value={editForm.status} onChange={setEF('status')} className="input">
                  {['sehat','sakit','kritis','mati'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Tanggal Lahir</label><input type="date" value={editForm.birth_date} onChange={setEF('birth_date')} className="input" /></div>
              <div><label className="label">Tanggal Beli</label><input type="date" value={editForm.purchase_date} onChange={setEF('purchase_date')} className="input" /></div>
            </div>
            <div><label className="label">Catatan</label><textarea value={editForm.notes} onChange={setEF('notes')} rows={2} className="input resize-none" placeholder="Catatan tambahan..." /></div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowEdit(false)} className="btn-secondary flex-1 justify-center">Batal</button>
              <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">{saving ? 'Menyimpan...' : 'Simpan'}</button>
            </div>
          </form>
        </Modal>
      )}
      </div> )}