// Alias que redirige a HomePassenger o HomeDriver según el rol del usuario
import { useAuth } from '../contexts/AuthContext'
import HomePassenger from './HomePassenger'
import HomeDriver from './HomeDriver'

export default function SearchTrips() {
  const { usuario } = useAuth()
  if (usuario?.rol === 'conductor') return <HomeDriver />
  return <HomePassenger />
}
