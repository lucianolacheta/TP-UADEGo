import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import SearchTrips from './pages/SearchTrips'
import TripDetail from './pages/TripDetail'
import PublishTrip from './pages/PublishTrip'
import DriverPanel from './pages/DriverPanel'
import Profile from './pages/Profile'

function Protegida({ children }: { children: JSX.Element }) {
  const { session, loading } = useAuth()
  if (loading) return <div style={{ padding: 32 }}>Cargando...</div>
  if (!session) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Protegida><Layout /></Protegida>}>
        <Route path="/" element={<SearchTrips />} />
        <Route path="/viaje/:id" element={<TripDetail />} />
        <Route path="/publicar" element={<PublishTrip />} />
        <Route path="/mis-viajes" element={<DriverPanel />} />
        <Route path="/perfil" element={<Profile />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
