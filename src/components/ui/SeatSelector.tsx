interface Props {
  value: number
  min?: number
  max?: number
  label?: string
  onChange: (v: number) => void
}

export default function SeatSelector({ value, min = 1, max = 4, label = 'Cantidad', onChange }: Props) {
  return (
    <div className="seat-display">
      <span style={{ fontSize: 14, color: 'var(--text2)' }}>{label}</span>
      <div className="seat-controls">
        <button className="seat-btn" onClick={() => onChange(value - 1)} disabled={value <= min}>−</button>
        <span className="seat-num">{value}</span>
        <button className="seat-btn" onClick={() => onChange(value + 1)} disabled={value >= max}>+</button>
      </div>
    </div>
  )
}
