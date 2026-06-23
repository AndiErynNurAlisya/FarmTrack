import { useEffect, useState } from 'react'
import api from '../api/axios'
import Modal from './Modal'
import { getErrorMessage } from '../api/error'

const EMPTY = { tag_number: '', animal_type: 'sapi', breed: '', gender: 'betina', status: 'sehat', weight_kg: '', birth_date: '', purchase_date: '', photo_url: '', notes: '' }
// Ubah objek hewan dari API menjadi nilai form (ramah-string).
function toForm(animal) {
  if (!animal) return { ...EMPTY }
  return {
    tag_number:    animal.tag_number || '',
    animal_type:   animal.animal_type || 'sapi',
    breed:         animal.breed || '',
    gender:        animal.gender || 'betina',
    status:        animal.status || 'sehat',
    weight_kg:     animal.weight_kg || '',
    birth_date:    animal.birth_date || '',
    purchase_date: animal.purchase_date || '',
    photo_url:     animal.photo_url || '',
    notes:         animal.notes || '',
  }
}

export default function AnimalFormModal({ open, onClose, animal = null, onSaved }) {
  const [form, setForm] = useState(EMPTY)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

// Upload file foto ke backend, lalu simpan URL-nya ke form.
    const uploadPhoto = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
        const data = new FormData()
        data.append('file', file)
        const r = await api.post('/animals/upload-photo', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
        })
        setForm(p => ({ ...p, photo_url: r.data.photo_url }))
    } catch (err) {
        alert(getErrorMessage(err, 'Gagal mengupload foto'))
    } finally {
        setUploading(false)
        e.target.value = '' // reset agar file sama bisa dipilih lagi
    }
    }

  // Saat dibuka, isi form dari hewan yang diedit (atau kosong untuk tambah baru).
  useEffect(() => {
    if (open) setForm(toForm(animal))
  }, [open, animal])

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const save = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      const payload = { ...form, weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null, photo_url: form.photo_url || null, birth_date: form.birth_date || null, purchase_date: form.purchase_date || null }
      if (animal?.id) await api.put(`/animals/${animal.id}`, payload)
      else await api.post('/animals', payload)
      onClose()
      onSaved?.()
    } catch (err) {
      alert(getErrorMessage(err, 'Gagal menyimpan'))
    } finally { setSaving(false) }
  }

  if (!open) return null

  return (
    <Modal title={animal?.id ? 'Edit Data Hewan' : 'Tambah Hewan Baru'} onClose={onClose}>
      <form onSubmit={save} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">Nomor Tag *</label><input required value={form.tag_number} onChange={set('tag_number')} className="input" placeholder="Contoh: BV-001" /></div>
          <div><label className="label">Jenis Hewan *</label>
            <select value={form.animal_type} onChange={set('animal_type')} className="input">
              {['sapi','kambing','domba','ayam'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">Ras/Breed</label><input value={form.breed} onChange={set('breed')} className="input" placeholder="Contoh: Limousin" /></div>
          <div><label className="label">Jenis Kelamin</label>
            <select value={form.gender} onChange={set('gender')} className="input">
              <option value="betina">Betina</option>
              <option value="jantan">Jantan</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">Berat (kg)</label><input type="number" step="0.01" min="0.01" value={form.weight_kg} onChange={set('weight_kg')} className="input" placeholder="0.00" /></div>
          <div><label className="label">Status</label>
            <select value={form.status} onChange={set('status')} className="input">
              {['sehat','sakit','kritis','mati'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">Tanggal Lahir</label><input type="date" value={form.birth_date} onChange={set('birth_date')} className="input" /></div>
          <div><label className="label">Tanggal Beli</label><input type="date" value={form.purchase_date} onChange={set('purchase_date')} className="input" /></div>
        </div>
        <div>
        <label className="label">Foto Hewan</label>
        <div className="flex items-start gap-3">
            <div className="w-20 h-20 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
            {form.photo_url
                ? <img src={form.photo_url} alt="Pratinjau" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                : <span className="text-2xl text-gray-300">🐄</span>}
            </div>
            <div className="flex-1 space-y-2">
            <input value={form.photo_url} onChange={set('photo_url')} className="input" placeholder="Tempel URL foto (https://...)" />
            <div className="flex items-center gap-2">
                <label className="btn-secondary cursor-pointer text-sm">
                {uploading ? 'Mengupload...' : '⬆ Upload Foto'}
                <input type="file" accept="image/*" onChange={uploadPhoto} disabled={uploading} className="hidden" />
                </label>
                {form.photo_url && (
                <button type="button" onClick={() => setForm(p => ({ ...p, photo_url: '' }))} className="text-xs text-red-400 hover:text-red-600">Hapus foto</button>
                )}
            </div>
            <p className="text-xs text-gray-400">Tempel URL gambar atau upload file (maks. 5 MB).</p>
            </div>
        </div>
        </div>
        <div><label className="label">Catatan</label><textarea value={form.notes} onChange={set('notes')} rows={2} className="input resize-none" placeholder="Catatan tambahan..." /></div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Batal</button>
          <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">{saving ? 'Menyimpan...' : 'Simpan'}</button>
        </div>
      </form>
    </Modal>
  )
}