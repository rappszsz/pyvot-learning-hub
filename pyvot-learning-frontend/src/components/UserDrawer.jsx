import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTheme } from '../context/useTheme.js'

function UserDrawer({ user, onSignOut, isSigningOut }) {
  const [isOpen, setIsOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const initials = user.name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  function closeDrawer() {
    setIsOpen(false)
  }

  function switchToInstructorStudio() {
    closeDrawer()
    navigate('/instructor/dashboard')
  }

  return (
    <>
      <button
        aria-label="Open user menu"
        aria-expanded={isOpen}
        className="group flex items-center gap-2 rounded-full p-1.5 text-text transition-colors hover:bg-subtle-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        onClick={() => setIsOpen(true)}
        type="button"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-white transition-transform group-hover:scale-105">
          {initials || 'U'}
        </span>
        <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
          <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
        </svg>
      </button>

      <div
        aria-hidden={!isOpen}
        className={`fixed inset-0 z-50 transition-opacity duration-300 ease-in-out ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <div
          className="absolute inset-0 bg-slate-950/50"
          onClick={closeDrawer}
        />
        <aside
          aria-label="User menu"
          aria-modal="true"
          className={`absolute right-0 top-0 flex h-full w-full max-w-sm flex-col bg-white text-slate-900 shadow-2xl transition-transform transform duration-300 ease-in-out dark:bg-slate-800 dark:text-white ${
            isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          inert={!isOpen}
          role="dialog"
        >
          <div className="flex items-start justify-between border-b border-slate-200 px-6 py-6 dark:border-slate-700">
            <div className="min-w-0">
              <h2 className="truncate text-lg font-bold text-slate-900 dark:text-white">{user.name}</h2>
              <p className="mt-1 truncate text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
              <span
                className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                  user.is_subscribed
                    ? 'bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-200'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                }`}
              >
                {user.is_subscribed ? 'Pro Subscriber' : 'Inactive'}
              </span>
            </div>
            <button
              aria-label="Close user menu"
              className="ml-4 rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white"
              onClick={closeDrawer}
              type="button"
            >
              <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
                <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
              </svg>
            </button>
          </div>

          <nav aria-label="Account" className="flex-1 space-y-1 px-4 py-5">
            <Link
              className="block rounded-xl px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-950 dark:text-slate-200 dark:hover:bg-slate-700 dark:hover:text-white"
              onClick={closeDrawer}
              to="/profile"
            >
              My Profile &amp; Settings
            </Link>
            <Link
              className="block rounded-xl px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-950 dark:text-slate-200 dark:hover:bg-slate-700 dark:hover:text-white"
              onClick={closeDrawer}
              to="/my-courses"
            >
              My Enrolled Courses
            </Link>
            <Link
              className="block rounded-xl px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-950 dark:text-slate-200 dark:hover:bg-slate-700 dark:hover:text-white"
              onClick={closeDrawer}
              to="/pricing"
            >
              Subscription &amp; Billing
            </Link>

            <div className="mt-2 flex items-center justify-between rounded-xl px-4 py-3">
              <span className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                <span aria-hidden="true">☀️</span>
                Dark Mode
                <span aria-hidden="true">🌙</span>
              </span>
              <button
                aria-checked={theme === 'dark'}
                aria-label="Dark Mode"
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                  theme === 'dark' ? 'bg-pink-600' : 'bg-slate-300'
                }`}
                onClick={toggleTheme}
                role="switch"
                type="button"
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    theme === 'dark' ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            {user.is_instructor && (
              <button
                className="mt-5 w-full rounded-xl border border-pink-200 px-4 py-3 text-left text-sm font-semibold text-pink-700 transition-colors hover:bg-pink-50 dark:border-pink-800 dark:text-pink-300 dark:hover:bg-slate-700"
                onClick={switchToInstructorStudio}
                type="button"
              >
                Switch to Instructor Studio
              </button>
            )}
          </nav>

          <div className="border-t border-slate-200 p-4 dark:border-slate-700">
            <button
              className="w-full rounded-xl px-4 py-3 text-left text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60 dark:text-red-400 dark:hover:bg-red-950/40 dark:hover:text-red-300"
              disabled={isSigningOut}
              onClick={onSignOut}
              type="button"
            >
              {isSigningOut ? 'Signing out…' : 'Sign Out'}
            </button>
          </div>
        </aside>
      </div>
    </>
  )
}

export default UserDrawer
