// Sumber tunggal konstanta produk. Dipakai oleh Dashboard, Produksi, dll.
import milkIcon from '../assets/milk.svg'
import eggIcon from '../assets/egg.svg'
import woolIcon from '../assets/wool.svg'
import beefIcon from '../assets/beef.svg'

export const PRODUCT_TYPES = ['susu', 'telur', 'wol', 'daging']

export const PRODUCT_LABELS = { susu: 'Susu', telur: 'Telur', wol: 'Wol', daging: 'Daging' }
export const PRODUCT_UNITS  = { susu: 'liter', telur: 'butir', wol: 'kg', daging: 'kg' }
export const PRODUCT_ICONS  = { susu: milkIcon, telur: eggIcon, wol: woolIcon, daging: beefIcon }

// Pemetaan jenis hewan -> produk yang sah + satuannya (selaras dengan backend).
export const PRODUCT_CONFIG = {
  sapi:    [{ value: 'susu', label: 'Susu', unit: 'liter' }, { value: 'daging', label: 'Daging', unit: 'kg' }],
  kambing: [{ value: 'susu', label: 'Susu', unit: 'liter' }, { value: 'daging', label: 'Daging', unit: 'kg' }],
  ayam:    [{ value: 'telur', label: 'Telur', unit: 'butir' }, { value: 'daging', label: 'Daging', unit: 'kg' }],
  domba:   [{ value: 'wol', label: 'Wol', unit: 'kg' }, { value: 'daging', label: 'Daging', unit: 'kg' }],
}