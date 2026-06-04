import { useNavigate } from 'react-router-dom'
import { IconSchool } from '@tabler/icons-react'

export default function Welcome() {
  const nav = useNavigate()
  return (
    <div className="screen" style={{ alignItems: 'center', justifyContent: 'center', padding: '20px 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', marginBottom: 10, lineHeight: 1.2 }}>
        ¡Ya sos parte de<br />la comunidad!
      </div>
      <div style={{ fontSize: 15, color: 'var(--text2)', marginBottom: 12, lineHeight: 1.6 }}>
        Tu identidad como estudiante UADE fue verificada. Ahora podés viajar seguro.
      </div>
      <div className="verified" style={{ marginBottom: 32 }}>
        <IconSchool size={14} /> Estudiante UADE verificado
      </div>
      <div style={{ width: '100%' }}>
        <button className="btn btn-primary" onClick={() => nav('/elegir-rol')}>Completar mi perfil →</button>
      </div>
    </div>
  )
}
