import { useEffect, useState } from 'react'
import api from '../api/axios'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'

export default function Laporan() {
  const [data, setData] = useState(null)
  const [periode, setPeriode] = useState('mingguan')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.get(`/dashboard/laporan?periode=${periode}`).then(r => setData(r.data)).finally(() => setLoading(false))
  }, [periode])

  const chartData = data?.tren_produksi?.map(d => ({ tanggal: d.tanggal.slice(5), total: d.total })) || []

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Laporan Performa</h2>
          <p className="text-gray-500 text-sm mt-1">Pantau produktivitas dan metrik kesehatan ternak secara berkala</p>
        </div>
        <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1">
          {['mingguan','bulanan'].map(p => (
            <button key={p} onClick={() => setPeriode(p)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold capitalize transition-all ${periode === p ? 'bg-barn text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {loading ? <div className="py-16 flex justify-center"><div className="w-8 h-8 border-4 border-barn border-t-transparent rounded-full animate-spin"/></div> : (
        <>
          {/* KPI cards — total produksi dipindah sepenuhnya ke halaman Data Produksi */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: 'Indeks Kesehatan Rata-rata', val: `${data?.indeks_kesehatan || 0}/100`, icon: '❤', change: '', color: 'text-barn' },
              { label: 'Konsumsi Pakan', val: `${data?.total_konsumsi_pakan_kg?.toFixed(0) || 0} Kg`, icon: '🌾', change: 'Stabil', color: 'text-gray-800' },
            ].map(k => (
              <div key={k.label} className="card border-l-4 border-l-barn">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-2xl">{k.icon}</span>
                  {k.change && <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">{k.change}</span>}
                </div>
                <p className="text-xs text-gray-500 mb-1">{k.label}</p>
                <p className={`text-3xl font-bold ${k.color}`}>{k.val}</p>
              </div>
            ))}
          </div>

          {/* Chart + range */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-700">Tren Produksi {periode === 'mingguan' ? 'Mingguan' : 'Bulanan'}</h3>
                {data?.range && <span className="text-xs text-gray-400">{data.range.dari} – {data.range.sampai}</span>}
              </div>
              {chartData.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-gray-400 text-sm">Belum ada data produksi</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData}>
                    <XAxis dataKey="tanggal" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="total" fill="#8B2635" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Summary table */}
            <div className="card">
              <h3 className="font-semibold text-gray-700 mb-4">Ringkasan Periode</h3>
              <div className="space-y-4">
                {[
                  { label: 'Periode', val: `${data?.range?.dari} s/d ${data?.range?.sampai}` },
                  { label: 'Indeks Kesehatan', val: `${data?.indeks_kesehatan}%` },
                  { label: 'Total Konsumsi Pakan', val: `${data?.total_konsumsi_pakan_kg?.toFixed(1)} kg` },
                ].map(r => (
                  <div key={r.label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <span className="text-sm text-gray-500">{r.label}</span>
                    <span className="text-sm font-semibold text-gray-800">{r.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Export section */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-700">Data Ekspor Laporan</h3>
                <p className="text-xs text-gray-400 mt-0.5">Unduh riwayat data untuk keperluan arsip atau audit</p>
              </div>
              <div className="flex gap-2">
                <button className="btn-primary text-sm">⬇ Ekspor PDF</button>
                <button className="btn-secondary text-sm">⬇ Ekspor CSV</button>
              </div>
            </div>
            <p className="text-sm text-gray-400 text-center py-4">Fitur ekspor akan tersedia di versi berikutnya</p>
          </div>
        </>
      )}
    </div>
  )
}
