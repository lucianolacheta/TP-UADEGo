import { useNavigate, useLocation } from 'react-router-dom'
import { IconSearch, IconPlus, IconCalendar, IconMessageCircle, IconUserCircle } from '@tabler/icons-react'

export default function BottomNav() {
  const nav = useNavigate()
  const { pathname } = useLocation()

  const active = (path: string) => pathname === path || pathname.startsWith(path + '/') ? 'active' : ''
  const exactActive = (path: string) => pathname === path ? 'active' : ''
  const chatsActive = pathname.startsWith('/mensajes') || pathname.startsWith('/chat') ? 'active' : ''

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
      <button className={`nav-item ${chatsActive}`} onClick={() => nav('/mensajes')}>
        <IconMessageCircle size={22} /><span>Chats</span>
      </button>
      <button className={`nav-item ${exactActive('/perfil')}`} onClick={() => nav('/perfil')}>
        <IconUserCircle size={22} /><span>Perfil</span>
      </button>
    </nav>
  )
}
