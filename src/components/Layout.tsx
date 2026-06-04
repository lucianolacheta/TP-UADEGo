import { Outlet } from 'react-router-dom'
import BottomNav from './ui/BottomNav'

export default function Layout() {
  return (
    <>
      <Outlet />
      <BottomNav />
    </>
  )
}
