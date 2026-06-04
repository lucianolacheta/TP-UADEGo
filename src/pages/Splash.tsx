import { useNavigate } from 'react-router-dom'
import { IconCar } from '@tabler/icons-react'

export default function Splash() {
  const nav = useNavigate()
  return (
    <div className="splash-screen">
      <div style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          width: 80, height: 80, background: 'rgba(255,255,255,0.15)', borderRadius: 24,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px', backdropFilter: 'blur(10px)',
        }}>
          <IconCar size={40} color="white" />
        </div>
        <div style={{ fontSize: 32, fontWeight: 800, color: 'white', letterSpacing: -0.5 }}>UADE CarPool</div>
        <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', marginTop: 6 }}>Movilidad universitaria segura</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 40, textAlign: 'center', lineHeight: 1.6 }}>
          Exclusivo para estudiantes verificados<br />de Universidad Argentina de la Empresa
        </div>
      </div>
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button className="btn btn-white" onClick={() => nav('/registro')}>Comenzar →</button>
        <button className="btn btn-ghost" onClick={() => nav('/login')}>Ya tengo cuenta</button>
      </div>
    </div>
  )
}
