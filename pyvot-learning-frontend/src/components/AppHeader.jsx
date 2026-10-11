import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import pyvotLogo from '../assets/pyvot-logo.png'
import { API_BASE_URL, fetchWithCsrf } from '../lib/api.js'

const navClass = ({ isActive }) =>
  `rounded-pill px-2 py-2 text-xs font-semibold transition-colors sm:px-4 sm:text-sm ${
    isActive ? 'bg-primary text-white' : 'text-text hover:bg-subtle-card'
  }`

function AppHeader() {
  const location = useLocation()
  const navigate = useNavigate()
  const [logoutError, setLogoutError] = useState('')
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [isStudentSignedIn, setIsStudentSignedIn] = useState(false)
  const isInstructorRoute = location.pathname.startsWith('/instructor/')
  const isInstructorLogin = location.pathname === '/instructor/login'

  useEffect(() => {
    if (isInstructorRoute) {
      return
    }

    const controller = new AbortController()

    async function checkStudentSession() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/user`, {
          credentials: 'include',
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        })
        const result = await response.json()

        if (response.status === 401 || response.status === 403) {
          setIsStudentSignedIn(false)
          return
        }
        if (!response.ok) {
          throw new Error(result.message || 'Unable to verify student sign-in.')
        }

        setIsStudentSignedIn(result.user?.is_instructor === false)
      } catch (error) {
        if (!(error instanceof Error && error.name === 'AbortError')) {
          setLogoutError(error instanceof Error ? error.message : 'Unable to verify student sign-in.')
          setIsStudentSignedIn(false)
        }
      }
    }

    checkStudentSession()
    return () => controller.abort()
  }, [isInstructorRoute, location.pathname])

  async function handleSignOut() {
    setIsSigningOut(true)
    setLogoutError('')

    try {
      const response = await fetchWithCsrf(`${API_BASE_URL}/api/auth/logout`, { method: 'POST' })
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Unable to sign out.')
      }

      setIsStudentSignedIn(false)
      navigate(isInstructorRoute ? '/instructor/login' : '/login', { replace: true })
    } catch (error) {
      setLogoutError(error instanceof Error ? error.message : 'Unable to sign out.')
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <header className="border-b border-subtle-border bg-background">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4">
        <Link aria-label="Pyvot home" className="flex items-center" to="/">
          <img alt="Pyvot Logo" className="h-16 w-auto" src={pyvotLogo} />
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
              <button
                className={navClass({ isActive: false })}
                disabled={isSigningOut}
                onClick={handleSignOut}
                type="button"
              >
                {isSigningOut ? 'Signing out…' : 'Sign out'}
              </button>
            </>
          ) : isInstructorLogin ? (
            <span className="px-2 text-sm font-semibold text-text">Instructor sign-in</span>
          ) : (
            <>
              {isStudentSignedIn && !isInstructorRoute ? (
                <button
                  className={navClass({ isActive: false })}
                  disabled={isSigningOut}
                  onClick={handleSignOut}
                  type="button"
                >
                  {isSigningOut ? 'Signing out…' : 'Sign Out'}
                </button>
              ) : (
                <NavLink className={navClass} to="/login">
                  Sign In
                </NavLink>
              )}
            </>
          )}
        </nav>
        {logoutError && <p className="w-full text-right text-sm text-red-700" role="alert">{logoutError}</p>}
      </div>
    </header>
  )
}

export default AppHeader