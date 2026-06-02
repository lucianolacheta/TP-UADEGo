import { Link, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Layout() {
  const { usuario, signOut } = useAuth()
  return (
    <div>
      <nav className="navbar">
        <Link to="/" className="logo">UADE<span style={{ color: 'var(--accent)' }}>CarPool</span></Link>
        <Link to="/">Buscar viajes</Link>
        <Link to="/publicar">Publicar</Link>
        <Link to="/mis-viajes">Mis viajes</Link>
        <div className="spacer" />
        <Link to="/perfil">{usuario?.nombre ?? 'Perfil'}</Link>
        <button className="secondary" onClick={signOut}>Salir</button>
      </nav>
      <main className="container">
        <Outlet />
      </main>
    </div>
  )
}
