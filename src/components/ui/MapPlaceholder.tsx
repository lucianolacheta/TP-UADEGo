interface Props {
  origen: string
  destino?: string
  duracion?: string
}

export default function MapPlaceholder({ origen, destino = 'UADE', duracion }: Props) {
  return (
    <div className="map-placeholder">
      <div className="map-route-line" />
      <div className="map-dot map-dot-a" />
      <div className="map-dot map-dot-b" />
      <div className="map-label map-label-a">📍 {origen}</div>
      <div className="map-label map-label-b">🏫 {destino}</div>
      {duracion && (
        <div style={{
          position: 'absolute', bottom: 10, right: 10, background: 'white',
          borderRadius: 8, padding: '5px 10px', fontSize: 12, fontWeight: 700, color: 'var(--text2)',
        }}>
          ~{duracion}
        </div>
      )}
    </div>
  )
}
