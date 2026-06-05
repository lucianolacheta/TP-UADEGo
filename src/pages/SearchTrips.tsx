import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import HomePassenger from './HomePassenger'
import HomeDriver from './HomeDriver'

export default function SearchTrips() {
  const { usuario } = useAuth()

  // HU 2: primer login sin onboarding → redirigir
  if (usuario && !usuario.horario_habitual) {
    return <Navigate to="/elegir-rol" replace />
  }

  if (usuario?.rol === 'conductor') return <HomeDriver />
  return <HomePassenger />
}
