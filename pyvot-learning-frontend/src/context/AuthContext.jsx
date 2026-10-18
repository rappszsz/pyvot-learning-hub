import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { API_BASE_URL, fetchWithAuth } from '../lib/api.js'

const AuthContext = createContext({
  user: null,
  setUser: () => {},
  isLoading: true,
  errorMessage: '',
})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const requestVersion = useRef(0)

  const setAuthUser = useCallback((nextUser) => {
    requestVersion.current += 1
    setUser(nextUser)
    setErrorMessage('')
    setIsLoading(false)
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    async function loadUser() {
      const version = ++requestVersion.current

      try {
        const response = await fetchWithAuth(`${API_BASE_URL}/api/auth/user`, {
          signal: controller.signal,
        })
        const result = await response.json()
        if (version !== requestVersion.current) return

        if (response.status === 401 || response.status === 403) {
          setUser(null)
          setErrorMessage('')
          return
        }
        if (!response.ok) {
          throw new Error(result.message || 'Unable to verify sign-in.')
        }

        setUser(result.user || null)
        setErrorMessage('')
      } catch (error) {
        if (version === requestVersion.current && !(error instanceof Error && error.name === 'AbortError')) {
          setUser(null)
          setErrorMessage(error instanceof Error ? error.message : 'Unable to verify sign-in.')
        }
      } finally {
        if (version === requestVersion.current && !controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    loadUser()
    return () => controller.abort()
  }, [])

  return (
    <AuthContext.Provider value={{ user, setUser: setAuthUser, isLoading, errorMessage }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext)
}

// eslint-disable-next-line react-refresh/only-export-components
export function isUserSubscribed(user) {
  if (!user) return false
  if (typeof user.is_subscribed === 'boolean') return user.is_subscribed
  if (user.subscription_status !== 'active') return false
  if (!user.subscription_ends_at) return true

  const expirationTime = Date.parse(user.subscription_ends_at)
  return Number.isFinite(expirationTime) && expirationTime > Date.now()
}

// eslint-disable-next-line react-refresh/only-export-components
export function hasCourseAccess(user) {
  return Boolean(
    user?.role === 'admin' ||
    user?.is_admin ||
    user?.is_instructor ||
    isUserSubscribed(user),
  )
}
