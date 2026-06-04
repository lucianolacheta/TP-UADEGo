interface Props {
  emoji?: string
  titulo: string
  subtitulo?: string
  children?: React.ReactNode
}

export default function EmptyState({ emoji = '🚗', titulo, subtitulo, children }: Props) {
  return (
    <div className="empty-state">
      <div style={{ fontSize: 64, marginBottom: 16 }}>{emoji}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>{titulo}</div>
      {subtitulo && <div style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 20 }}>{subtitulo}</div>}
      {children}
    </div>
  )
}
