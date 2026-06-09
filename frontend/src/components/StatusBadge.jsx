const map = {
  sehat:     { cls: 'badge-sehat',   dot: 'bg-green-500',  label: 'Sehat' },
  sakit:     { cls: 'badge-sakit',   dot: 'bg-yellow-500', label: 'Sakit' },
  kritis:    { cls: 'badge-kritis',  dot: 'bg-red-500',    label: 'Kritis' },
  observasi: { cls: 'badge-sakit',   dot: 'bg-yellow-500', label: 'Observasi' },
  mati:      { cls: 'badge-mati',    dot: 'bg-gray-400',   label: 'Mati' },
}
export default function StatusBadge({ status }) {
  const s = map[status?.toLowerCase()] || map.sehat
  return (
    <span className={s.cls}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  )
}
