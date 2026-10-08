import { Outlet } from 'react-router-dom'
import AppHeader from '../components/AppHeader.jsx'

function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <AppHeader />
      <main className="mx-auto w-full max-w-6xl px-5 py-10">
        <Outlet />
      </main>
    </div>
  )
}

export default AppLayout