import { useNavigate, useLocation } from 'react-router-dom'
import { IconHome, IconSearch, IconMessage, IconUserCircle, IconPlus, IconCalendar } from '@tabler/icons-react'
import { useAuth } from '../../contexts/AuthContext'

export default function BottomNav() {
  const nav = useNavigate()
  const { pathname } = useLocation()
  const { usuario } = useAuth()
  const esConductor = usuario?.rol === 'conductor' || usuario?.rol === 'ambos'

  const active = (path: string) => pathname === path ? 'active' : ''

  if (esConductor) {
    return (
      <nav className="bottom-nav">
        <button className={`nav-item ${active('/')}`} onClick={() => nav('/')}>
          <IconHome size={22} /><span>Inicio</span>
        </button>
        <button className={`nav-item ${active('/publicar')}`} onClick={() => nav('/publicar')}>
          <IconPlus size={22} /><span>Publicar</span>
        </button>
        <button className={`nav-item ${active('/mensajes')}`} onClick={() => nav('/mensajes')}>
          <div className="nav-badge"><IconMessage size={22} /></div>
          <span>Mensajes</span>
        </button>
        <button className={`nav-item ${active('/perfil')}`} onClick={() => nav('/perfil')}>
          <IconUserCircle size={22} /><span>Perfil</span>
        </button>
      </nav>
    )
  }

  return (
    <nav className="bottom-nav">
      <button className={`nav-item ${active('/')}`} onClick={() => nav('/')}>
        <IconSearch size={22} /><span>Buscar</span>
      </button>
      <button className={`nav-item ${active('/mis-viajes')}`} onClick={() => nav('/mis-viajes')}>
        <IconCalendar size={22} /><span>Mis viajes</span>
      </button>
      <button className={`nav-item ${active('/mensajes')}`} onClick={() => nav('/mensajes')}>
        <div className="nav-badge"><IconMessage size={22} /></div>
        <span>Mensajes</span>
      </button>
      <button className={`nav-item ${active('/perfil')}`} onClick={() => nav('/perfil')}>
        <IconUserCircle size={22} /><span>Perfil</span>
      </button>
    </nav>
  )
}
