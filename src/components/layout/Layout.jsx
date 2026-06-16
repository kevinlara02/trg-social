import { Outlet } from 'react-router-dom'
import { Suspense } from 'react'
import { Sidebar } from './Sidebar'

function PageLoading() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-accent-500" />
    </div>
  )
}

export function Layout() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <Sidebar />
      <div className="md:pl-60">
        <main className="pt-14 md:pt-0 min-h-screen">
          <Suspense fallback={<PageLoading />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  )
}
