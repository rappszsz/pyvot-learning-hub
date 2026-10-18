import { Outlet } from 'react-router-dom'
import AppHeader from '../components/AppHeader.jsx'

function AppLayout() {
  return (
    <div className="min-h-screen bg-[#FAF7F2] text-slate-900 transition-colors dark:bg-[#12111D] dark:text-slate-100">
      <AppHeader />
      <main className="mx-auto w-full max-w-6xl px-5 py-10">
        <Outlet />
      </main>
    </div>
  )
}

export default AppLayout