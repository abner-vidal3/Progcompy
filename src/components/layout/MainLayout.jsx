import { Outlet } from 'react-router-dom'
import TopNavbar from './TopNavbar'

export default function MainLayout() {
  return (
    <div className="h-screen bg-[var(--color-bg)] flex flex-col overflow-hidden">
      <TopNavbar />
      <main className="flex-1 min-h-0">
        <Outlet />
      </main>
    </div>
  )
}
