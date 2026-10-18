import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate } from 'react-router-dom'
import { useTheme } from '../context/useTheme.js'

const linkClassName =
  'block rounded-xl px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-purple-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:text-slate-200 dark:hover:bg-[#232038] dark:hover:text-pink-400'

const accountLinks = [
  { label: 'My Profile & Settings', to: '/profile' },
  { label: 'My Enrolled Courses', to: '/my-courses' },
  { label: 'Subscription & Billing', to: '/pricing' },
]

const instructorLinks = [
  { label: 'Dashboard', to: '/instructor/dashboard' },
  { label: 'Course Management', to: '/instructor/dashboard#course-management' },
  { label: 'Analytics', to: '/instructor/dashboard#analytics' },
]

function UserDrawer({ user, onSignOut, isSigningOut }) {
  const [isOpen, setIsOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const canAccessInstructorStudio =
    user?.role === 'admin' || user?.is_admin || user?.is_instructor
  const name = user?.name?.trim() || 'Learner'
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

  useEffect(() => {
    if (!isOpen) return undefined

    function handleKeyDown(event) {
      if (event.key === 'Escape') setIsOpen(false)
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
        className="group flex items-center gap-2 rounded-full p-1.5 text-text transition-colors hover:bg-subtle-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:text-slate-200 dark:hover:bg-slate-800"
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

      {createPortal(
        <div
        aria-hidden={!isOpen}
        className={`fixed !inset-0 !z-[9999] !h-screen !w-screen overflow-hidden transition-opacity duration-300 ease-in-out ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        inert={!isOpen}
      >
        <button
          aria-label="Close user menu"
          className="absolute inset-0 h-full w-full cursor-default bg-slate-950/50"
          onClick={closeDrawer}
          tabIndex={-1}
          type="button"
        />
        <aside
          aria-labelledby="user-menu-heading"
          aria-modal={isOpen || undefined}
          className={`fixed top-0 right-0 z-[10000] h-screen w-80 max-w-full bg-white dark:bg-[#1A182B] text-slate-900 dark:text-slate-100 shadow-2xl flex flex-col justify-between border-l border-slate-200 dark:border-[#2E2A47] transition-transform duration-300 ${
            isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          role="dialog"
        >
          <div className="flex-1 space-y-6 overflow-y-auto p-6">
            <div className="flex items-start justify-between border-b border-slate-200 pb-6 dark:border-[#2E2A47]">
              <div className="min-w-0">
                <h2 className="truncate text-lg font-semibold text-slate-900 dark:text-white" id="user-menu-heading">
                  {name}
                </h2>
                <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
                  {user?.email || ''}
                </p>
                <span className="mt-3 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-[#25223A] dark:text-slate-300">
                  {user?.is_subscribed ? 'Pro Subscriber' : 'Inactive'}
                </span>
              </div>
              <button
                aria-label="Close user menu"
                className="ml-4 rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:hover:bg-[#232038] dark:hover:text-white"
                onClick={closeDrawer}
                type="button"
              >
                <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
                </svg>
              </button>
            </div>

            <nav aria-label="Account" className="space-y-1">
              {accountLinks.map(({ label, to }) => (
                <Link className={linkClassName} key={to} onClick={closeDrawer} to={to}>
                  {label}
                </Link>
              ))}

              {canAccessInstructorStudio && (
                <section
                  aria-labelledby="instructor-shortcuts-heading"
                  className="mt-5 border-t border-slate-200 pt-4 dark:border-[#2E2A47]"
                >
                  <h3
                    className="px-4 pb-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                    id="instructor-shortcuts-heading"
                  >
                    Instructor Shortcuts
                  </h3>
                  {instructorLinks.map(({ label, to }) => (
                    <Link className={linkClassName} key={to} onClick={closeDrawer} to={to}>
                      {label}
                    </Link>
                  ))}
                </section>
              )}

              <div className="mt-2 flex items-center justify-between rounded-xl px-4 py-3">
                <span className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                  <span aria-hidden="true">☀️</span>
                  Dark Mode
                  <span aria-hidden="true">🌙</span>
                </span>
                <button
                  aria-checked={theme === 'dark'}
                  aria-label="Dark mode"
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

              {canAccessInstructorStudio && (
                <button
                  className="btn-secondary mt-5 w-full text-sm"
                  onClick={switchToInstructorStudio}
                  type="button"
                >
                  Switch to Instructor Studio
                </button>
              )}
            </nav>
          </div>

          <div className="border-t border-slate-200 p-6 dark:border-[#2E2A47]">
            <button
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 hover:text-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:opacity-60 dark:text-red-400 dark:hover:bg-red-950/30 dark:hover:text-red-300"
              disabled={isSigningOut}
              onClick={onSignOut}
              type="button"
            >
              {isSigningOut ? 'Signing out…' : 'Sign Out'}
            </button>
          </div>
        </aside>
        </div>,
        document.body,
      )}
    </>
  )
}

export default UserDrawer
