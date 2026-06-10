import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'

export function Layout() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <Sidebar />
      <div className="md:pl-60">
        <main className="pt-14 md:pt-0 min-h-screen">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
