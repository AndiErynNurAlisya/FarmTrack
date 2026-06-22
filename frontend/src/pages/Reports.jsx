import { useEffect, useState } from 'react'
import api from '../api/axios'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function Reports() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.get('/dashboard/laporan').then(r => setData(r.data)).finally(() => setLoading(false))
  }, [])

  const ICONS = { susu: '💧', telur: '🥚', daging: '🥩', wol: '🧶' }
  const rupiah = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID')
  const pendapatanData = data?.tren_pendapatan?.map(d => ({ tanggal: d.tanggal.slice(5), total: d.total })) || []
  const perJenis = data?.produksi_per_jenis || []

  const kpiCards = [
    { label: 'Indeks Kesehatan Rata-rata', val: `${data?.indeks_kesehatan || 0}/100`, icon: '❤️', color: 'text-barn' },
    { label: 'Total Pendapatan Tercatat', val: rupiah(data?.total_pendapatan), icon: '💰', color: 'text-barn' },
    { label: 'Estimasi Kebutuhan Pakan Bulanan', val: `${data?.total_konsumsi_pakan_kg?.toFixed(0) || 0} Kg`, icon: '🌾', color: 'text-gray-800' },
  ]
  // Susun baris laporan dari data yang sedang tampil
  const buildRows = () => {
    const d = data || {}
    const rows = []
    rows.push(['Laporan Performa FarmTrack'])
    rows.push(['Dibuat', new Date().toLocaleString('id-ID')])
    if (d.range) rows.push(['Periode', `${d.range.dari} – ${d.range.sampai}`])
    rows.push([])
    rows.push(['Ringkasan'])
    rows.push(['Indeks Kesehatan Rata-rata', `${d.indeks_kesehatan || 0}/100`])
    rows.push(['Estimasi Kebutuhan Pakan (Kg)', d.total_konsumsi_pakan_kg?.toFixed(0) || 0])
    rows.push(['Total Pendapatan Tercatat (Rp)', d.total_pendapatan || 0])
    if (perJenis.length) {
      rows.push([])
      rows.push(['Produksi & Estimasi Pendapatan per Jenis'])
      rows.push(['Jenis', 'Jumlah', 'Satuan', 'Estimasi Pendapatan (Rp)'])
      perJenis.forEach(p => rows.push([p.jenis, p.qty, p.unit, p.pendapatan || 0]))
    }
    if (pendapatanData.length) {
      rows.push([])
      rows.push(['Tren Estimasi Pendapatan'])
      rows.push(['Tanggal', 'Estimasi Pendapatan (Rp)'])
      data.tren_pendapatan.forEach(t => rows.push([t.tanggal, t.total]))
    }
    return rows
  }

  const handleExportCSV = () => {
    const rows = buildRows()
    const esc = (v) => {
      const s = String(v ?? '')
      return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
    }
    const csv = '\uFEFF' + rows.map(r => r.map(esc).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `laporan-performa-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const handleExportPDF = () => {
    const rows = buildRows()
    const safe = (v) => String(v ?? '').replace(/</g, '&lt;')
    const body = rows.map(r =>
      r.length === 0
        ? '<tr><td class="sp" colspan="4"></td></tr>'
        : r.length === 1
          ? `<tr><td class="hd" colspan="4">${safe(r[0])}</td></tr>`
          : `<tr>${r.map(c => `<td>${safe(c)}</td>`).join('')}</tr>`
    ).join('')
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Laporan Performa</title>` +
      `<style>body{font-family:Arial,Helvetica,sans-serif;color:#333;padding:24px}` +
      `h1{font-size:18px;margin:0 0 12px}table{border-collapse:collapse;width:100%;font-size:12px}` +
      `td{border:1px solid #ddd;padding:6px 8px}` +
      `td.hd{background:#8B2635;color:#fff;font-weight:bold;border-color:#8B2635}` +
      `td.sp{border:none;height:8px}</style></head>` +
      `<body><h1>🐄 Laporan Performa FarmTrack</h1><table>${body}</table>` +
      `<script>window.onload=function(){window.print()}<\/script></body></html>`
    const w = window.open('', '_blank')
    if (!w) { alert('Mohon izinkan pop-up agar PDF bisa diunduh.'); return }
    w.document.write(html)
    w.document.close()
  }

return (
    <div className="space-y-6 fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Laporan Performa</h2>
          <p className="text-gray-500 text-sm mt-1">Pantau produktivitas dan metrik kesehatan ternak secara berkala</p>
        </div>
      </div>

      {loading ? (
        <div className="py-16 flex justify-center">
          <div className="w-8 h-8 border-4 border-barn border-t-transparent rounded-full animate-spin"/>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {kpiCards.map(k => (
              <div key={k.label} className="card border-l-4 border-l-barn">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-2xl">{k.icon}</span>
                </div>
                <p className="text-xs text-gray-500 mb-1">{k.label}</p>
                <p className={`text-3xl font-bold ${k.color}`}>{k.val}</p>
              </div>
            ))}
          </div>

          {/* Chart + Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Tren Pendapatan */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-700">Tren Estimasi Pendapatan</h3>
                {data?.range && (
                  <span className="text-xs text-gray-400">{data.range.dari} – {data.range.sampai}</span>
                )}
              </div>
              {pendapatanData.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
                  Belum ada data produksi
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={pendapatanData}>
                    <XAxis dataKey="tanggal" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                    <Tooltip formatter={(v) => [rupiah(v), 'Estimasi']} />
                    <Bar dataKey="total" fill="#8B2635" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Breakdown per Jenis */}
            <div className="card">
              <h3 className="font-semibold text-gray-700 mb-4">Produksi & Estimasi Pendapatan per Jenis</h3>
              {perJenis.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
                  Belum ada data produksi
                </div>
              ) : (
                <div className="space-y-1">
                  {perJenis.map(p => (
                    <div key={p.jenis} className="flex items-center justify-between py-2 border-b border-gray-50">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{ICONS[p.jenis] || '📦'}</span>
                        <div>
                          <p className="text-sm font-semibold text-gray-800 capitalize">{p.jenis}</p>
                          <p className="text-xs text-gray-400">{p.qty} {p.unit}</p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-barn">{rupiah(p.pendapatan)}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-3">
                    <span className="text-sm font-semibold text-gray-700">Total Estimasi Pendapatan</span>
                    <span className="text-base font-bold text-barn">{rupiah(data?.total_pendapatan)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Export */}
          {/* Export */}
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-700">Data Ekspor Laporan</h3>
                <p className="text-xs text-gray-400 mt-0.5">Unduh riwayat data untuk keperluan arsip atau audit</p>
              </div>
              <div className="flex gap-2">
                <button onClick={handleExportPDF} disabled={!data} className="btn-primary text-sm disabled:opacity-50">⬇ Ekspor PDF</button>
                <button onClick={handleExportCSV} disabled={!data} className="btn-secondary text-sm disabled:opacity-50">⬇ Ekspor CSV</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}