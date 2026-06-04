interface Props {
  kg: number
}

export default function Co2Card({ kg }: Props) {
  const arboles = (kg * 0.083).toFixed(1)
  return (
    <div className="co2-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 24 }}>🌱</span>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#166534' }}>Impacto ambiental</div>
      </div>
      <div className="co2-number">{kg.toFixed(1)} kg</div>
      <div className="co2-label">de CO₂ ahorrado en este viaje</div>
      <div style={{ fontSize: 12, color: '#166534', marginTop: 6 }}>
        Equivalente a plantar {arboles} árboles 🌳
      </div>
    </div>
  )
}
