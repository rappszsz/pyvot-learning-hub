import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { API_BASE_URL, fetchWithCsrf } from '../lib/api.js'

function Register() {
  const navigate = useNavigate()
  const { setUser } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [isPasswordConfirmationVisible, setIsPasswordConfirmationVisible] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setErrorMessage('')

    if (password !== passwordConfirmation) {
      setErrorMessage('Passwords do not match.')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetchWithCsrf(`${API_BASE_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          password_confirmation: passwordConfirmation,
        }),
      })
      const result = await response.json()

      if (!response.ok) {
        const validationMessages = Object.values(result.errors ?? {}).flat()
        throw new Error(validationMessages.join(' ') || result.message || 'Unable to create your account.')
      }
      if (result.user?.is_instructor !== false) {
        throw new Error('Unable to create a student account.')
      }
      if (typeof result.token !== 'string' || !result.token) {
        throw new Error('Your account was created, but sign-in could not be completed. Please sign in.')
      }

      window.localStorage.setItem('auth_token', result.token)
      window.localStorage.setItem('auth_user', JSON.stringify(result.user))
      setUser(result.user)
      navigate('/pricing', { replace: true })
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to create your account.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section>
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-purple-700 dark:text-purple-300">Student portal</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">Create your account</h1>
      <p className="mt-3 text-base text-slate-600 dark:text-slate-400">Register to explore courses and start learning.</p>
      <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
        <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200" htmlFor="student-name">
          Name
          <input
            autoComplete="name"
            className="mt-2 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal text-slate-900 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500 dark:border-white/10 dark:bg-[#1E1F30] dark:text-white"
            id="student-name"
            onChange={(event) => setName(event.target.value)}
            required
            type="text"
            value={name}
          />
        </label>
        <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200" htmlFor="student-email">
          Email Address
          <input
            autoComplete="email"
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
          <span className="relative mt-2 block">
            <input
              autoComplete="new-password"
              className="block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pr-11 font-normal text-slate-900 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500 dark:border-white/10 dark:bg-[#1E1F30] dark:text-white"
              id="student-password"
              minLength="8"
              onChange={(event) => setPassword(event.target.value)}
              required
              type={isPasswordVisible ? 'text' : 'password'}
              value={password}
            />
            <button
              aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
              aria-pressed={isPasswordVisible}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 transition-colors hover:text-purple-700 dark:text-slate-400"
              onClick={() => setIsPasswordVisible((visible) => !visible)}
              type="button"
            >
              <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                {isPasswordVisible ? (
                  <>
                    <path d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M9.9 5.2A10.8 10.8 0 0112 5c5.2 0 9 5.2 9 7a8.5 8.5 0 01-2.1 3.2M6.2 6.2C4.2 7.6 3 9.6 3 12c0 1.8 3.8 7 9 7 1.2 0 2.3-.3 3.3-.8" strokeLinecap="round" strokeLinejoin="round" />
                  </>
                ) : (
                  <>
                    <path d="M3 12s3.3-7 9-7 9 7 9 7-3.3 7-9 7-9-7-9-7z" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="12" cy="12" r="3" />
                  </>
                )}
              </svg>
            </button>
          </span>
        </label>
        <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200" htmlFor="student-password-confirmation">
          Password Confirmation
          <span className="relative mt-2 block">
            <input
              autoComplete="new-password"
              className="block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pr-11 font-normal text-slate-900 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500 dark:border-white/10 dark:bg-[#1E1F30] dark:text-white"
              id="student-password-confirmation"
              onChange={(event) => setPasswordConfirmation(event.target.value)}
              required
              type={isPasswordConfirmationVisible ? 'text' : 'password'}
              value={passwordConfirmation}
            />
            <button
              aria-label={isPasswordConfirmationVisible ? 'Hide password confirmation' : 'Show password confirmation'}
              aria-pressed={isPasswordConfirmationVisible}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 transition-colors hover:text-purple-700 dark:text-slate-400"
              onClick={() => setIsPasswordConfirmationVisible((visible) => !visible)}
              type="button"
            >
              <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                {isPasswordConfirmationVisible ? (
                  <>
                    <path d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M9.9 5.2A10.8 10.8 0 0112 5c5.2 0 9 5.2 9 7a8.5 8.5 0 01-2.1 3.2M6.2 6.2C4.2 7.6 3 9.6 3 12c0 1.8 3.8 7 9 7 1.2 0 2.3-.3 3.3-.8" strokeLinecap="round" strokeLinejoin="round" />
                  </>
                ) : (
                  <>
                    <path d="M3 12s3.3-7 9-7 9 7 9 7-3.3 7-9 7-9-7-9-7z" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="12" cy="12" r="3" />
                  </>
                )}
              </svg>
            </button>
          </span>
        </label>
        {errorMessage && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-800" role="alert">{errorMessage}</p>}
        <button
          className="btn-primary group w-full disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? 'Registering…' : (
            <>
              Register
              <span aria-hidden="true" className="inline-block transition-transform duration-200 ease-out group-hover:translate-x-1.5">
                →
              </span>
            </>
          )}
        </button>
      </form>
      <p className="mt-6 text-sm text-slate-600 dark:text-slate-400">
        Already have an account?{' '}
        <Link className="font-medium text-purple-600 transition-colors hover:text-purple-700 hover:underline" to="/login">
          Sign In
        </Link>
      </p>
    </section>
  )
}

export default Register
