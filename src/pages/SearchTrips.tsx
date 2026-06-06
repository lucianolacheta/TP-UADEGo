import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import HomePassenger from './HomePassenger'

export default function SearchTrips() {
  const { usuario } = useAuth()
  // Primer login: redirigir a completar perfil si no tiene turno seteado
  if (usuario && !usuario.horario_habitual) {
    return <Navigate to="/completar-perfil" replace />
  }
  return <HomePassenger />
}
