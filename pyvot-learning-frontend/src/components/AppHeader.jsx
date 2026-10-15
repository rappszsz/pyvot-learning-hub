import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import pyvotLogo from '../assets/pyvot-logo.png'
import UserDrawer from './UserDrawer.jsx'
import { API_BASE_URL, fetchWithAuth, fetchWithCsrf } from '../lib/api.js'

const navClass = ({ isActive }) =>
  `rounded-pill px-2 py-2 text-xs font-semibold transition-colors sm:px-4 sm:text-sm ${
    isActive ? 'bg-primary text-white' : 'text-text hover:bg-subtle-card dark:text-slate-300 dark:hover:bg-slate-800'
  }`

function AppHeader() {
  const location = useLocation()
  const navigate = useNavigate()
  const [logoutError, setLogoutError] = useState('')
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [user, setUser] = useState(null)
  const isInstructorRoute = location.pathname.startsWith('/instructor/')
  const isInstructorLogin = location.pathname === '/instructor/login'

  useEffect(() => {
    const controller = new AbortController()

    async function checkUserSession() {
      try {
        const response = await fetchWithAuth(`${API_BASE_URL}/api/auth/user`, {
          signal: controller.signal,
        })
        const result = await response.json()

        if (response.status === 401 || response.status === 403) {
          setUser(null)
          return
        }
        if (!response.ok) {
          throw new Error(result.message || 'Unable to verify sign-in.')
        }

        setUser(result.user || null)
      } catch (error) {
        if (!(error instanceof Error && error.name === 'AbortError')) {
          setLogoutError(error instanceof Error ? error.message : 'Unable to verify sign-in.')
          setUser(null)
        }
      }
    }

    checkUserSession()
    return () => controller.abort()
  }, [location.pathname])

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
    <header className="border-b border-subtle-border bg-background transition-colors dark:border-slate-700 dark:bg-slate-900">
      <div className="mx-auto flex min-h-20 max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-3">
        <Link aria-label="Pyvot home" className="flex shrink-0 items-center" to="/">
          <img alt="Pyvot Logo" className="h-12 w-auto object-contain object-left md:h-14 lg:h-16" src={pyvotLogo} />
        </Link>
        <nav aria-label="Main navigation" className="flex w-full items-center gap-0 sm:w-auto sm:gap-2">
          <NavLink className={navClass} end to="/">
            {isInstructorRoute ? 'Preview Catalog' : 'Courses'}
          </NavLink>
          {isInstructorRoute && !isInstructorLogin ? (
            <>
              <NavLink className={navClass} to="/instructor/dashboard">
                Instructor dashboard
              </NavLink>
              <NavLink className={navClass} to="/instructor/courses/create">
                Create course
              </NavLink>
            </>
          ) : isInstructorLogin ? (
            <span className="px-2 text-sm font-semibold text-text dark:text-slate-200">Instructor sign-in</span>
          ) : (
            <>
              {!user && (
                <NavLink className={navClass} to="/login">
                  Sign In
                </NavLink>
              )}
            </>
          )}
          {user && (
            <UserDrawer
              isSigningOut={isSigningOut}
              onSignOut={handleSignOut}
              user={user}
            />
          )}
        </nav>
        {logoutError && <p className="w-full text-right text-sm text-red-700" role="alert">{logoutError}</p>}
      </div>
    </header>
  )
}

export default AppHeader