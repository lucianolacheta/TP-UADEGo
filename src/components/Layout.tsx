import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const tabs = [
  { to: '/', label: 'Buscar', end: true },
  { to: '/publicar', label: 'Publicar' },
  { to: '/mis-viajes', label: 'Mis viajes' },
  { to: '/perfil', label: 'Perfil' },
] as const

export default function Layout() {
  const { usuario } = useAuth()

  return (
    <div className="app-shell">
      <header className="app-header">
        <Link to="/" className="logo">
          UADE<span className="logo-accent">CarPool</span>
        </Link>
        {usuario?.validado_uade && <span className="header-badge">✓ UADE</span>}
      </header>

      <main className="container">
        <Outlet />
      </main>

      <nav className="bottom-nav" aria-label="Navegación principal">
        {tabs.map(tab => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={'end' in tab ? tab.end : false}
            className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
