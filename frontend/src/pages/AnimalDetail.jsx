import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import Modal from '../components/Modal'
import StatusBadge from '../components/StatusBadge'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const HEALTH_EMPTY = { check_date: '', disease: '', symptoms: '', treatment: '', medicine_name: '', next_vaccine_date: '' }

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
  const [saving, setSaving] = useState(false)

  const fetchAll = async () => {
    setLoading(true)
    const [a, h, p] = await Promise.all([
      api.get(`/animals/${id}`),
      api.get('/health-records', { params: { animal_id: id } }),
      api.get('/productions', { params: { animal_id: id } }),
    ])
    setAnimal(a.data); setHealth(h.data); setProds(p.data)
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [id])

  const setHF = k => e => setHealthForm(p => ({ ...p, [k]: e.target.value }))

  const saveHealth = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      await api.post('/health-records', { ...healthForm, animal_id: parseInt(id), handled_by: user.id })
      setShowHealth(false); setHealthForm(HEALTH_EMPTY); fetchAll()
    } catch (err) { alert(err.response?.data?.detail || 'Gagal') }
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
              onClick={() => navigate('/ternak')}
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
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">💧</span>
                <span className="text-xs text-gray-500">Daily Yield</span>
              </div>
              <p className="text-xl font-bold text-gray-800">{prodHarian}</p>
              <p className="text-xs text-green-600 mt-1">↑ +1.2L vs avg</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">⚖</span>
                <span className="text-xs text-gray-500">Current Weight</span>
              </div>
              <p className="text-xl font-bold text-gray-800">{animal.weight_kg ? `${animal.weight_kg} kg` : '—'}</p>
              <p className="text-xs text-gray-400 mt-1">Stable since Mar</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">🍽</span>
                <span className="text-xs text-gray-500">Feed Intake</span>
              </div>
              <p className="text-xl font-bold text-gray-800">18 kg/d</p>
              <p className="text-xs text-gray-400 mt-1">Mix: Alfalfa/Grain</p>
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
                      {['DATE', 'EVENT / ACTIVITY', 'PROVIDER', 'STATUS', 'ACTION'].map(h => (
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
                        <td className="px-5 py-3 text-sm text-gray-500">{h.medicine_name || 'Farm Clinic'}</td>
                        <td className="px-5 py-3">
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColor('Completed')}`}>
                            Completed
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <button className="text-sm text-barn font-medium hover:underline">Details</button>
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
            <div className="col-span-2 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
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

            {/* Active Insights */}
            <div className="bg-barn rounded-2xl p-4 text-white shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-yellow-300">💡</span>
                  <span className="text-sm font-semibold">Active Insights</span>
                </div>
                <button className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-xs hover:bg-white/30">+</button>
              </div>
              <div className="space-y-2">
                <div className="bg-white/10 rounded-xl p-3">
                  <p className="text-xs font-semibold text-white">Insemination Window</p>
                  <p className="text-xs text-white/70 mt-1">Estimated window starts in 4 days. Monitor for behavioral changes in the paddock.</p>
                </div>
                <div className="bg-white/10 rounded-xl p-3">
                  <p className="text-xs font-semibold text-white">Feed Adjustment</p>
                  <p className="text-xs text-white/70 mt-1">Yield is exceeding expectation. Consider increasing grain ratio by 0.5kg/day.</p>
                </div>
              </div>
              <button className="w-full mt-3 bg-white text-barn text-xs font-semibold py-2 rounded-xl hover:bg-gray-50 transition-colors">
                Add Observation Note
              </button>
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
    </div>
  )
}