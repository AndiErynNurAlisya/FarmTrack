// Ekstraksi pesan error dari respons axios secara terpusat.
// Menangani `detail` berupa string MAUPUN array (error validasi FastAPI),
// sehingga tidak pernah lagi muncul "[object Object]".
export function getErrorMessage(err, fallback = 'Terjadi kesalahan. Coba lagi.') {
  const d = err?.response?.data?.detail
  if (Array.isArray(d)) return d.map(x => x?.msg || String(x)).join(', ')
  if (typeof d === 'string') return d
  return err?.message || fallback
}