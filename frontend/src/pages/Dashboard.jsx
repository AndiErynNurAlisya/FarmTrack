import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

const PRODUCT_LABELS = { susu: 'Susu', telur: 'Telur', wol: 'Wol', daging: 'Daging' }
const PRODUCT_UNITS = { susu: 'L', telur: 'butir', wol: 'kg', daging: 'kg' }

export default function Dashboard() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [jadwal, setJadwal] = useState([])
  const [recentHealth, setRecentHealth] = useState([])
  const [loading, setLoading] = useState(true)

  const isVet = user?.role === 'veterinary'
  const isOwner = user?.role === 'owner'

  useEffect(() => {
    const requests = [
      api.get('/dashboard/summary'),
      api.get('/health-records'),
    ]

    Promise.all(requests).then(([summaryRes, healthRes]) => {
      setData(summaryRes.data)

      const today = new Date()
      const upcoming = healthRes.data
        .filter(r => r.next_vaccine_date && new Date(r.next_vaccine_date) >= today)
        .sort((a, b) => new Date(a.next_vaccine_date) - new Date(b.next_vaccine_date))
        .slice(0, 3)
        .map(r => {
          const d = new Date(r.next_vaccine_date)
          return {
            tgl: d.getDate().toString(),
            bln: d.toLocaleString('id-ID', { month: 'short' }).toUpperCase(),
            judul: `Vaksinasi — ${r.disease || 'Jadwal Rutin'}`,
            tim: 'Dokter Hewan'
          }
        })
      setJadwal(upcoming)

      // Recent health records untuk vet
      const recent = healthRes.data.slice(0, 4)
      setRecentHealth(recent)
    }).finally(() => setLoading(false))
  }, [])

  const greet = () => {
    const h = new Date().getHours()
    if (h < 11) return 'Selamat pagi'
    if (h < 15) return 'Selamat siang'
    if (h < 18) return 'Selamat sore'
    return 'Selamat malam'
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-barn border-t-transparent rounded-full animate-spin"/>
    </div>
  )

  const produksiEntries = Object.entries(data?.produksi_hari_ini || {})
  const sehat = data?.per_status?.sehat || 0
  const observasi = (data?.per_status?.sakit || 0) + (data?.per_status?.observasi || 0)
  const karantina = data?.per_status?.kritis || 0
  const persenSehat = data?.total_animals > 0 ? Math.round((sehat / data.total_animals) * 100) : 0
  const butuhPerhatian = observasi + karantina

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Ringkasan Dashboard</h2>
        <p className="text-gray-500 text-sm mt-0.5">
          {greet()}, {user?.name}. Berikut adalah status terkini operasional peternakan Anda.
        </p>
      </div>

      {/* Stats Row */}
      <div className={`grid gap-4 ${isVet ? 'grid-cols-4' : 'grid-cols-3'}`}>
        {/* Card 1 - Total Hewan */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center">
              <span className="text-xl">🐾</span>
            </div>
          </div>
          <p className="text-sm text-gray-500">Total Hewan Ternak</p>
          <p className="text-4xl font-bold text-gray-800 mt-1">
            {data?.total_animals?.toLocaleString() ?? '0'}
          </p>
          <div className="flex gap-3 mt-3">
            {Object.entries(data?.per_type || {}).map(([type, count]) => (
              <span key={type} className="text-xs text-gray-400 capitalize">
                {count} {type.charAt(0).toUpperCase() + type.slice(1)}
              </span>
            ))}
          </div>
        </div>

        {/* Card 2 - Produksi (disembunyikan untuk vet) / Status Kesehatan ringkas (untuk vet) */}
        {isVet ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                <span className="text-xl">💚</span>
              </div>
            </div>
            <p className="text-sm text-gray-500">Kondisi Prima</p>
            <p className="text-4xl font-bold text-gray-800 mt-1">
              {persenSehat}<span className="text-xl font-normal text-gray-400 ml-0.5">%</span>
            </p>
            <p className="text-xs text-gray-400 mt-3">{sehat} dari {data?.total_animals ?? 0} hewan sehat</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                <span className="text-xl">📊</span>
              </div>
            </div>
            <p className="text-sm text-gray-500">Produksi Hari Ini</p>
            {produksiEntries.length > 0 ? (
              <div className="mt-2 space-y-1.5">
                {produksiEntries.map(([type, val]) => (
                  <div key={type} className="flex items-baseline justify-between">
                    <span className="text-xs text-gray-400 capitalize">{PRODUCT_LABELS[type] || type}</span>
                    <span className="text-lg font-bold text-gray-800">
                      {Number(val).toLocaleString()}
                      <span className="text-xs font-normal text-gray-400 ml-1">{PRODUCT_UNITS[type] || ''}</span>
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-4xl font-bold text-gray-800 mt-1">
                0<span className="text-xl font-normal text-gray-400 ml-1">hari ini</span>
              </p>
            )}
          </div>
        )}

        {/* Card 3 - Hewan Butuh Perhatian (vet) / Stok Pakan (owner/staff) */}
        {isVet ? (
          butuhPerhatian > 0 ? (
            <div className="bg-barn rounded-2xl p-5 text-white shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <span className="text-xl">⚠️</span>
                </div>
                <Link to="/ternak"
                  className="text-xs font-semibold border border-white/40 px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors">
                  Periksa
                </Link>
              </div>
              <p className="text-white/70 text-xs mt-2">Butuh Perhatian</p>
              <p className="text-4xl font-bold mt-0.5">{butuhPerhatian}</p>
              <p className="text-white/70 text-xs mt-2">
                {observasi} observasi · {karantina} karantina
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center mb-4">
                <span className="text-xl">✅</span>
              </div>
              <p className="text-sm text-gray-500">Kondisi Hewan</p>
              <p className="text-xl font-bold text-green-600 mt-1">Semua Prima</p>
              <p className="text-xs text-gray-400 mt-1">Tidak ada hewan yang perlu perhatian.</p>
            </div>
          )
        ) : (
          data?.stok_kritis?.length > 0 ? (
            <div className="bg-barn rounded-2xl p-5 text-white shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <span className="text-xl">⚠️</span>
                </div>
                <Link to="/stok-pakan"
                  className="text-xs font-semibold border border-white/40 px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors">
                  Pesan Sekarang
                </Link>
              </div>
              <p className="text-white/70 text-xs mt-2">Stok Pakan Menipis</p>
              <p className="text-xl font-bold mt-0.5">
                {data.stok_kritis[0]?.feed_name}
                {data.stok_kritis.length > 1 && (
                  <span className="ml-2 align-middle px-2 py-0.5 bg-white/20 rounded-full text-xs font-semibold">
                    +{data.stok_kritis.length - 1} lainnya
                  </span>
                )}
              </p>
              <p className="text-white/70 text-xs mt-2">
                Sisa {data.stok_kritis[0]?.current_stock_kg} kg — batas minimum {data.stok_kritis[0]?.min_stock_alert} kg
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center mb-4">
                <span className="text-xl">✅</span>
              </div>
              <p className="text-sm text-gray-500">Stok Pakan</p>
              <p className="text-xl font-bold text-green-600 mt-1">Semua Aman</p>
              <p className="text-xs text-gray-400 mt-1">Stok pakan di atas batas minimum.</p>
            </div>
          )
        )}

        {/* Card 4 - Health Record Terakhir (hanya vet) */}
        {isVet && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <span className="text-xl">📋</span>
              </div>
              <Link to="/health-records" className="text-xs text-barn font-medium hover:underline">
                Lihat Semua
              </Link>
            </div>
            <p className="text-sm text-gray-500">Catatan Terakhir</p>
            {recentHealth.length > 0 ? (
              <>
                <p className="text-lg font-bold text-gray-800 mt-1 truncate">
                  {recentHealth[0]?.disease || 'Pemeriksaan Rutin'}
                </p>
                <p className="text-xs text-gray-400 mt-1">{recentHealth[0]?.check_date}</p>
                <p className="text-xs text-barn font-medium mt-2">{recentHealth.length} catatan bulan ini</p>
              </>
            ) : (
              <>
                <p className="text-lg font-bold text-gray-800 mt-1">Belum ada</p>
                <p className="text-xs text-gray-400 mt-1">Belum ada catatan kesehatan</p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Jadwal + Status Kesehatan */}
      <div className="grid grid-cols-2 gap-4">
        {/* Jadwal Vaksinasi */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-700">Jadwal Vaksinasi Terdekat</h3>
            <Link to="/vaksinasi" className="text-xs text-barn font-medium hover:underline">
              Lihat Semua
            </Link>
          </div>
          <div className="space-y-2">
            {jadwal.length === 0 ? (
              <div className="text-center py-6 text-gray-400 text-sm">
                Tidak ada jadwal vaksinasi mendatang
              </div>
            ) : jadwal.map((j, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer group transition-colors">
                <div className="text-center w-10 flex-shrink-0">
                  <p className="text-xs text-gray-400 leading-none">{j.bln}</p>
                  <p className="text-xl font-bold text-barn leading-tight">{j.tgl}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{j.judul}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{j.tim}</p>
                </div>
                <span className="text-gray-300 group-hover:text-barn transition-colors">›</span>
              </div>
            ))}
          </div>
        </div>

        {/* Status Kesehatan */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-700">Status Kesehatan</h3>
            <span className="text-gray-300 text-lg">♥</span>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center mb-4">
            <div>
              <p className="text-3xl font-bold text-barn">{persenSehat}%</p>
              <p className="text-xs text-gray-400 mt-1">Kondisi Prima</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-700">{observasi}</p>
              <p className="text-xs text-gray-400 mt-1">Masa Observasi</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-red-500">{karantina}</p>
              <p className="text-xs text-gray-400 mt-1">Karantina</p>
            </div>
          </div>

          {karantina > 0 ? (
            <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2.5 flex items-center gap-2">
              <span className="text-red-400 flex-shrink-0">⚠</span>
              <p className="text-xs text-red-600">{karantina} hewan dalam kondisi kritis, segera periksa.</p>
            </div>
          ) : observasi > 0 ? (
            <div className="bg-yellow-50 border border-yellow-100 rounded-xl px-3 py-2.5 flex items-center gap-2">
              <span className="text-yellow-500 flex-shrink-0">⚠</span>
              <p className="text-xs text-yellow-700">{observasi} hewan sedang dalam masa observasi.</p>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-100 rounded-xl px-3 py-2.5 flex items-center gap-2">
              <span className="text-green-500 flex-shrink-0">✓</span>
              <p className="text-xs text-green-700">Semua hewan dalam kondisi sehat.</p>
            </div>
          )}
        </div>
      </div>

      {/* Tabel Aktivitas */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-700">Aktivitas Ternak Terakhir</h3>
          <div className="flex gap-2">
            <button className="text-sm border border-gray-200 px-4 py-1.5 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
              Filter
            </button>
            {/* Tombol Unduh Laporan hanya untuk owner/staff */}
            {!isVet && (
              <button className="text-sm bg-barn text-white px-4 py-1.5 rounded-lg hover:bg-barn/90 transition-colors font-medium">
                Unduh Laporan
              </button>
            )}
          </div>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              {['ID TERNAK', 'KATEGORI', 'STATUS', 'BERAT (KG)', 'AKSI'].map(h => (
                <th key={h} className="text-left text-xs text-gray-400 font-semibold pb-3 tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data?.aktivitas_terakhir?.map((a) => (
              <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="py-3.5 text-sm font-bold text-barn">#{a.tag_number}</td>
                <td className="py-3.5">
                  <span className="text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full capitalize">
                    {a.animal_type}
                  </span>
                </td>
                <td className="py-3.5">
                  <span className={`text-xs flex items-center gap-1.5 font-medium ${
                    a.status === 'sehat' ? 'text-green-600' :
                    a.status === 'sakit' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      a.status === 'sehat' ? 'bg-green-500' :
                      a.status === 'sakit' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}/>
                    {a.status.charAt(0).toUpperCase() + a.status.slice(1)}
                  </span>
                </td>
                <td className="py-3.5 text-sm text-gray-600">{a.weight_kg ?? '—'}</td>
                <td className="py-3.5">
                  <Link to={`/ternak/${a.id}`} className="text-gray-400 hover:text-barn text-lg transition-colors">↗</Link>
                </td>
              </tr>
            ))}
            {!data?.aktivitas_terakhir?.length && (
              <tr>
                <td colSpan={5} className="py-10 text-center text-gray-400 text-sm">Belum ada data hewan</td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="text-center mt-4">
          <Link to="/ternak" className="text-sm text-barn hover:underline font-medium">Tampilkan Lebih Banyak</Link>
        </div>
      </div>

      {/* FAB — berbeda tujuan berdasarkan role */}
      {isVet ? (
        <Link to="/health-records?new=1"
          className="fixed bottom-6 right-6 w-12 h-12 bg-barn text-white rounded-full flex items-center justify-center shadow-lg hover:bg-barn/90 transition-colors text-2xl"
          title="Catat Health Record">
          🩺
        </Link>
      ) : (
        <Link to="/ternak"
          className="fixed bottom-6 right-6 w-12 h-12 bg-barn text-white rounded-full flex items-center justify-center shadow-lg hover:bg-barn/90 transition-colors text-2xl">
          +
        </Link>
      )}
    </div>
  )
}