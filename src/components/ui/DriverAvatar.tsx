import { IconCheck } from '@tabler/icons-react'

interface Props {
  nombre: string
  size?: number
  color?: string
  bg?: string
  validadoUade?: boolean
  rating?: number
  showRating?: boolean
}

function initials(nombre: string) {
  return nombre.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()
}

const PALETTE = [
  { bg: '#FFF0EB', color: '#FF6B35' },
  { bg: '#E8F1FE', color: '#1A6FE8' },
  { bg: '#DCFCE7', color: '#16A34A' },
  { bg: '#EEF2FF', color: '#4F46E5' },
  { bg: '#FDF4FF', color: '#9333EA' },
]

function pickColor(nombre: string) {
  const idx = nombre.charCodeAt(0) % PALETTE.length
  return PALETTE[idx]
}

export default function DriverAvatar({ nombre, size = 44, validadoUade, rating, showRating }: Props) {
  const { bg, color } = pickColor(nombre)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div style={{ position: 'relative' }}>
        <div
          className="avatar-initials"
          style={{ width: size, height: size, background: bg, color, fontSize: size * 0.35 }}
        >
          {initials(nombre)}
        </div>
        {validadoUade && (
          <div style={{
            position: 'absolute', bottom: 0, right: -2,
            background: '#1A6FE8', borderRadius: '50%', width: 16, height: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid white',
          }}>
            <IconCheck size={9} color="white" strokeWidth={3} />
          </div>
        )}
      </div>
      {showRating && rating !== undefined && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <span style={{ color: '#F59E0B', fontSize: 12 }}>★</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)' }}>{rating.toFixed(1)}</span>
        </div>
      )}
    </div>
  )
}

export { initials, pickColor }
