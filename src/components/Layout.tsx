import { Outlet } from 'react-router-dom'
import BottomNav from './ui/BottomNav'

export default function Layout() {
  return (
    <div className="layout">
      <div className="layout-content">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  )
}
