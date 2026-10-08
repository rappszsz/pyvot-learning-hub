import { Link, NavLink } from 'react-router-dom'
import pyvotLogo from '../assets/pyvot-logo.png'

const navClass = ({ isActive }) =>
  `rounded-pill px-2 py-2 text-xs font-semibold transition-colors sm:px-4 sm:text-sm ${
    isActive ? 'bg-primary text-white' : 'text-text hover:bg-subtle-card'
  }`

function AppHeader() {
  return (
    <header className="border-b border-subtle-border bg-background">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4">
        <Link aria-label="Pyvot home" className="flex items-center" to="/">
          <img alt="Pyvot Logo" className="h-16 w-auto" src={pyvotLogo} />
        </Link>
        <nav aria-label="Main navigation" className="flex w-full items-center gap-0 sm:w-auto sm:gap-2">
          <NavLink className={navClass} end to="/">
            Courses
          </NavLink>
          <NavLink className={navClass} end to="/instructor">
            Instructor
          </NavLink>
          <NavLink className={navClass} to="/instructor/upload">
            Upload materials
          </NavLink>
        </nav>
      </div>
    </header>
  )
}

export default AppHeader