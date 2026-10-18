import { useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import pyvotLogo from '../assets/pyvot-logo.png'
import UserDrawer from './UserDrawer.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { API_BASE_URL, fetchWithCsrf } from '../lib/api.js'

const navClass = ({ isActive }) =>
  `rounded-pill px-2 py-2 text-xs font-semibold transition-colors sm:px-4 sm:text-sm ${
    isActive ? 'bg-primary text-white' : 'text-text hover:bg-subtle-card dark:text-slate-300 dark:hover:bg-slate-800'
  }`

const instructorLinkClass =
  'btn-primary px-3 py-2 text-xs sm:px-4 sm:text-sm'

function AppHeader() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, setUser, errorMessage: authErrorMessage } = useAuth()
  const [logoutError, setLogoutError] = useState('')
  const [isSigningOut, setIsSigningOut] = useState(false)
  const isInstructorRoute = location.pathname.startsWith('/instructor/')
  const isInstructorLogin = location.pathname === '/instructor/login'
  const canAccessInstructorStudio =
    user?.role === 'admin' || user?.is_admin || user?.is_instructor

  async function handleSignOut() {
    setIsSigningOut(true)
    setLogoutError('')

    try {
      const response = await fetchWithCsrf(`${API_BASE_URL}/api/auth/logout`, { method: 'POST' })
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Unable to sign out.')
      }

      window.localStorage.removeItem('auth_token')
      window.localStorage.removeItem('auth_user')
      setUser(null)
      navigate(isInstructorRoute ? '/instructor/login' : '/login', { replace: true })
    } catch (error) {
      setLogoutError(error instanceof Error ? error.message : 'Unable to sign out.')
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <header className="border-b border-[#F0EBE1] bg-[#FAF7F2] transition-colors dark:border-b dark:border-white/5 dark:bg-[#12111D]/90 dark:backdrop-blur-md">
      <div className="mx-auto flex min-h-20 max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-3">
        <Link aria-label="Pyvot home" className="flex shrink-0 items-center py-2" to="/">
          <img alt="Pyvot Logo" className="h-10 w-auto object-contain transition-all duration-200 md:h-12" src={pyvotLogo} />
        </Link>
        <nav aria-label="Main navigation" className="flex w-full flex-wrap items-center gap-0 sm:w-auto sm:gap-2">
          {canAccessInstructorStudio ? (
            <>
              <NavLink className={navClass} end to="/courses">
                Preview Catalog
              </NavLink>
              <NavLink className={instructorLinkClass} to="/instructor/dashboard">
                Instructor Dashboard
              </NavLink>
              <NavLink className={navClass} to="/instructor/payment-approvals">
                Payment Approvals
              </NavLink>
              <NavLink className="btn-secondary px-3 py-2 text-xs sm:px-4 sm:text-sm" to="/instructor/courses/create">
                Create Course
              </NavLink>
            </>
          ) : (
            <>
              <NavLink className={navClass} end to="/">
                Courses
              </NavLink>
              {!isInstructorLogin && (
                <NavLink className={navClass} to="/pricing">
                  Pricing
                </NavLink>
              )}
              {!user && (
                <NavLink className="btn-primary px-3 py-2 text-xs sm:px-4 sm:text-sm" to="/login">
                  Sign In
                </NavLink>
              )}
            </>
          )}
          {isInstructorLogin && !canAccessInstructorStudio && (
            <span className="px-2 text-sm font-semibold text-text dark:text-slate-200">Instructor sign-in</span>
          )}
          {user && (
            <UserDrawer
              isSigningOut={isSigningOut}
              onSignOut={handleSignOut}
              user={user}
            />
          )}
        </nav>
        {(logoutError || authErrorMessage) && (
          <p className="w-full text-right text-sm text-red-700" role="alert">
            {logoutError || authErrorMessage}
          </p>
        )}
      </div>
    </header>
  )
}

export default AppHeader