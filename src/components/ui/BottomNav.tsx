import { useNavigate, useLocation } from 'react-router-dom'
import { IconSearch, IconPlus, IconCalendar, IconUserCircle } from '@tabler/icons-react'

export default function BottomNav() {
  const nav = useNavigate()
  const { pathname } = useLocation()

  const active = (path: string) => pathname === path || pathname.startsWith(path + '/') ? 'active' : ''
  const exactActive = (path: string) => pathname === path ? 'active' : ''

  return (
    <nav className="bottom-nav">
      <button className={`nav-item ${exactActive('/')}`} onClick={() => nav('/')}>
        <IconSearch size={22} /><span>Buscar</span>
      </button>
      <button className={`nav-item ${exactActive('/publicar')}`} onClick={() => nav('/publicar')}>
        <IconPlus size={22} /><span>Publicar</span>
      </button>
      <button className={`nav-item ${active('/mis-viajes')}`} onClick={() => nav('/mis-viajes')}>
        <IconCalendar size={22} /><span>Mis viajes</span>
      </button>
      <button className={`nav-item ${exactActive('/perfil')}`} onClick={() => nav('/perfil')}>
        <IconUserCircle size={22} /><span>Perfil</span>
      </button>
    </nav>
  )
}
