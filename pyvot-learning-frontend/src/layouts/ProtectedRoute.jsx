import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { API_BASE_URL, fetchWithAuth } from '../lib/api.js'

function ProtectedRoute() {
  const location = useLocation()
  const [status, setStatus] = useState('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    async function checkStudentSession() {
      try {
        const response = await fetchWithAuth(`${API_BASE_URL}/api/auth/user`, {
          signal: controller.signal,
        })
        const result = await response.json()

        if (response.status === 401 || response.status === 403) {
          setStatus('unauthenticated')
          return
        }
        if (!response.ok) {
          throw new Error(result.message || 'Unable to verify student sign-in.')
        }
        if (result.user?.is_instructor !== false) {
          setStatus(result.user?.is_instructor === true ? 'instructor' : 'unauthenticated')
          return
        }

        setStatus('authenticated')
      } catch (error) {
        if (!(error instanceof Error && error.name === 'AbortError')) {
          setErrorMessage(error instanceof Error ? error.message : 'Unable to verify student sign-in.')
          setStatus('error')
        }
      }
    }

    checkStudentSession()
    return () => controller.abort()
  }, [attempt])

  if (status === 'loading') {
    return <p className="py-8 text-sm text-slate-600" role="status">Checking sign-in…</p>
  }
  if (status === 'error') {
    return (
      <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">
        <p>{errorMessage}</p>
        <button className="mt-3 font-semibold underline" onClick={() => setAttempt((value) => value + 1)} type="button">
          Try again
        </button>
      </div>
    )
  }
  if (status === 'instructor' && location.pathname !== '/' && location.pathname !== '/profile') {
    return <Navigate replace to="/instructor/dashboard" />
  }
  if (status === 'unauthenticated') {
    return <Navigate replace to="/login" />
  }

  return <Outlet />
}

export default ProtectedRoute
