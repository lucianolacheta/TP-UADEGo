import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'

// Auth / Onboarding
import AuthCallback from './pages/AuthCallback'
import Splash from './pages/Splash'
import Login from './pages/Login'
import VerifyEmail from './pages/VerifyEmail'
import Welcome from './pages/Welcome'
import RoleSelection from './pages/RoleSelection'
import ProfileSetup from './pages/ProfileSetup'
import DriverData from './pages/DriverData'
import Zones from './pages/Zones'

// Pasajero / Conductor (home según rol)
import SearchTrips from './pages/SearchTrips'
import Search from './pages/Search'
import Results from './pages/Results'
import TripDetail from './pages/TripDetail'
import RequestConfirm from './pages/RequestConfirm'
import PublishTrip from './pages/PublishTrip'
import DriverPanel from './pages/DriverPanel'
import ManageRequest from './pages/ManageRequest'

// Coordinar
import Messages from './pages/Messages'
import Chat from './pages/Chat'
import Finish from './pages/Finish'
import Rate from './pages/Rate'
import TripSummary from './pages/TripSummary'

// Perfil
import Profile from './pages/Profile'

function Protegida({ children }: { children: JSX.Element }) {
  const { session, loading } = useAuth()
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', background: 'var(--bg)' }}><p style={{ color: 'var(--text3)' }}>Cargando...</p></div>
  if (!session) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      {/* Públicas */}
      <Route path="/splash" element={<Splash />} />
      <Route path="/login" element={<Login />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/registro" element={<Navigate to="/login" replace />} />
      <Route path="/verificar-email" element={<VerifyEmail />} />
      <Route path="/bienvenida" element={<Welcome />} />

      {/* Onboarding (requiere auth) */}
      <Route path="/elegir-rol" element={<Protegida><RoleSelection /></Protegida>} />
      <Route path="/completar-perfil" element={<Protegida><ProfileSetup /></Protegida>} />
      <Route path="/datos-conductor" element={<Protegida><DriverData /></Protegida>} />
      <Route path="/zonas" element={<Protegida><Zones /></Protegida>} />

      {/* App principal con BottomNav */}
      <Route element={<Protegida><Layout /></Protegida>}>
        <Route path="/" element={<SearchTrips />} />
        <Route path="/buscar" element={<Search />} />
        <Route path="/resultados" element={<Results />} />
        <Route path="/viaje/:id" element={<TripDetail />} />
        <Route path="/confirmacion" element={<RequestConfirm />} />
        <Route path="/publicar" element={<PublishTrip />} />
        <Route path="/mis-viajes" element={<DriverPanel />} />
        <Route path="/solicitud/:id" element={<ManageRequest />} />
        <Route path="/mensajes" element={<Messages />} />
        <Route path="/chat/:id?" element={<Chat />} />
        <Route path="/finalizar" element={<Finish />} />
        <Route path="/calificar" element={<Rate />} />
        <Route path="/resumen-viaje" element={<TripSummary />} />
        <Route path="/perfil" element={<Profile />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
