import { useEffect, useState } from 'react'
import api from '../api/axios'
import Modal from './Modal'
import { getErrorMessage } from '../api/error'

const EMPTY = { tag_number: '', animal_type: 'sapi', breed: '', gender: 'betina', status: 'sehat', weight_kg: '', birth_date: '', purchase_date: '', notes: '' }

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
    notes:         animal.notes || '',
  }
}

export default function AnimalFormModal({ open, onClose, animal = null, onSaved }) {
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  // Saat dibuka, isi form dari hewan yang diedit (atau kosong untuk tambah baru).
  useEffect(() => {
    if (open) setForm(toForm(animal))
  }, [open, animal])

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const save = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      const payload = { ...form, weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null }
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
        <div><label className="label">Catatan</label><textarea value={form.notes} onChange={set('notes')} rows={2} className="input resize-none" placeholder="Catatan tambahan..." /></div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Batal</button>
          <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">{saving ? 'Menyimpan...' : 'Simpan'}</button>
        </div>
      </form>
    </Modal>
  )
}