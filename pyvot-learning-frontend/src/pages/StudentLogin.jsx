import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { API_BASE_URL, fetchWithCsrf } from '../lib/api.js'

function StudentLogin() {
  const navigate = useNavigate()
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

      navigate('/', { replace: true })
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to sign in.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <p className="text-sm font-semibold uppercase tracking-wide text-primary">Student portal</p>
      <h1 className="mt-2 text-2xl font-bold">Student Sign In</h1>
      <p className="mt-2 text-sm text-slate-600">Sign in to continue learning and explore your courses.</p>
      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <label className="block text-sm font-semibold" htmlFor="student-email">
          Email
          <input
            autoComplete="username"
            className="mt-1 block w-full rounded border border-slate-300 px-3 py-2 font-normal"
            id="student-email"
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
          />
        </label>
        <label className="block text-sm font-semibold" htmlFor="student-password">
          Password
          <input
            autoComplete="current-password"
            className="mt-1 block w-full rounded border border-slate-300 px-3 py-2 font-normal"
            id="student-password"
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
        </label>
        {errorMessage && <p className="rounded bg-red-50 p-3 text-sm text-red-800" role="alert">{errorMessage}</p>}
        <button
          className="w-full rounded bg-slate-900 px-4 py-2 font-semibold text-white disabled:opacity-50"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? 'Signing in…' : 'Sign In'}
        </button>
      </form>
      <p className="mt-5 text-sm text-slate-600">
        Are you an instructor?{' '}
        <Link className="font-semibold text-blue-700 hover:underline" to="/instructor/login">
          Sign in as Instructor / Admin
        </Link>
      </p>
    </section>
  )
}

export default StudentLogin
