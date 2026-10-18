import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { API_BASE_URL, fetchWithCsrf } from '../lib/api.js'

function StudentLogin() {
  const navigate = useNavigate()
  const location = useLocation()
  const { setUser } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setIsSubmitting(true)
    setErrorMessage('')

    try {
      const response = await fetchWithCsrf(`${API_BASE_URL}/api/auth/student/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Unable to sign in.')
      }
      if (result.user?.is_instructor !== false) {
        throw new Error('This account cannot sign in to the student portal.')
      }

      window.localStorage.setItem('auth_user', JSON.stringify(result.user))
      setUser(result.user)
      const returnTo = location.state?.from
      const destination = returnTo?.pathname === '/pricing'
        ? `${returnTo.pathname}${returnTo.search || ''}`
        : '/'
      navigate(destination, { replace: true })
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to sign in.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section>
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-purple-700 dark:text-purple-300">Student portal</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">Welcome back</h1>
      <p className="mt-3 text-base text-slate-600 dark:text-slate-400">Sign in to continue learning and explore your courses.</p>
      <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
        <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200" htmlFor="student-email">
          Email
          <input
            autoComplete="username"
            className="mt-2 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal text-slate-900 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500 dark:border-white/10 dark:bg-[#1E1F30] dark:text-white"
            id="student-email"
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
          />
        </label>
        <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200" htmlFor="student-password">
          Password
          <input
            autoComplete="current-password"
            className="mt-2 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal text-slate-900 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500 dark:border-white/10 dark:bg-[#1E1F30] dark:text-white"
            id="student-password"
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
        </label>
        {errorMessage && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-800" role="alert">{errorMessage}</p>}
        <button
          className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? 'Signing in…' : 'Sign In'}
        </button>
      </form>
      <p className="mt-7 text-sm text-slate-600 dark:text-slate-400">
        Are you an instructor?{' '}
        <Link className="font-medium text-purple-600 transition-colors hover:text-purple-700 hover:underline" to="/instructor/login">
          Sign in as Instructor / Admin
        </Link>
      </p>
      <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
        Don&apos;t have an account?{' '}
        <Link className="font-medium text-purple-600 transition-colors hover:text-purple-700 hover:underline" to="/register">
          Register
        </Link>
      </p>
    </section>
  )
}

export default StudentLogin
