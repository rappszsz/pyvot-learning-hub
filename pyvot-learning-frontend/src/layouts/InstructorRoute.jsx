import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { API_BASE_URL } from '../lib/api.js'

function InstructorRoute() {
  const location = useLocation()
  const [status, setStatus] = useState('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    async function checkInstructorSession() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/user`, {
          credentials: 'include',
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        })
        const result = await response.json()

        if (response.status === 401 || response.status === 403) {
          setStatus('unauthenticated')
          return
        }
        if (!response.ok) {
          throw new Error(result.message || 'Unable to verify instructor access.')
        }
        if (result.user?.is_instructor !== true) {
          setStatus('unauthenticated')
          return
        }

        setStatus('authenticated')
      } catch (error) {
        if (!(error instanceof Error && error.name === 'AbortError')) {
          setErrorMessage(error instanceof Error ? error.message : 'Unable to verify instructor access.')
          setStatus('error')
        }
      }
    }

    checkInstructorSession()
    return () => controller.abort()
  }, [attempt])

  if (status === 'loading') {
    return <p className="py-8 text-sm text-slate-600" role="status">Verifying instructor access…</p>
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
  if (status === 'unauthenticated') {
    return <Navigate replace state={{ from: location }} to="/instructor/login" />
  }

  return <Outlet />
}

export default InstructorRoute
