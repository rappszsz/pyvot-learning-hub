import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import heroImage from '../assets/hero.png'
import pyvotLogo from '../assets/pyvot-logo.png'
import UserDrawer from '../components/UserDrawer.jsx'
import { useCourseCatalog } from '../context/CourseContext.jsx'
import { API_BASE_URL, fetchWithAuth, fetchWithCsrf } from '../lib/api.js'

const serviceLinks = [
  { label: 'Business Solutions', href: '#course-catalog' },
  { label: 'Growth Services', href: '#course-catalog' },
  { label: 'About Pyvot', href: '#welcome' },
]

function CourseCard({ course }) {
  const lessons = course.materials.filter((material) => material.mime_type.startsWith('video/')).length
  const studyMaterials = course.materials.length - lessons
  const thumbnailUrl = course.thumbnail
    ? new URL(`/storage/${course.thumbnail}`, API_BASE_URL).toString()
    : null

  return (
    <li className="flex flex-col justify-between overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="flex h-40 items-center justify-center bg-gray-50 font-medium text-gray-400 dark:bg-slate-700 dark:text-slate-300">
        {thumbnailUrl ? (
          <img
            alt={course.title}
            className="h-full w-full object-cover"
            src={thumbnailUrl}
          />
        ) : (
          <span>COURSE PREVIEW</span>
        )}
      </div>
      <div className="flex-1 p-5">
        <span className="text-xs font-semibold uppercase tracking-wider text-pink-600">
          {course.category_track || 'COURSE'}
        </span>
        <h3 className="mt-1 text-lg font-bold text-gray-900 dark:text-white">{course.title}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-gray-600 dark:text-slate-300">{course.description}</p>
        <p className="mt-3 text-sm font-medium text-gray-600 dark:text-slate-300">
          {lessons} {lessons === 1 ? 'lesson' : 'lessons'}
          {studyMaterials > 0 && (
            <span className="font-normal text-gray-500 dark:text-slate-400">
              {' '}· {studyMaterials} {studyMaterials === 1 ? 'study material' : 'study materials'}
            </span>
          )}
        </p>
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-gray-100 bg-gray-50 px-5 py-4 dark:border-slate-700 dark:bg-slate-800">
        <Link
          className="flex-1 rounded-xl bg-pink-600 px-3 py-2 text-center text-sm font-medium text-white transition hover:bg-pink-700"
          to={`/courses/${course.id}`}
        >
          View Course
        </Link>
      </div>
    </li>
  )
}

function CatalogPage() {
  const { courses, isLoading, errorMessage } = useCourseCatalog()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [authError, setAuthError] = useState('')
  const [isSigningOut, setIsSigningOut] = useState(false)

  useEffect(() => {
    const controller = new AbortController()

    async function checkStudentSession() {
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
          throw new Error(result.message || 'Unable to verify student sign-in.')
        }

        setUser(result.user || null)
      } catch (error) {
        if (!(error instanceof Error && error.name === 'AbortError')) {
          setAuthError(error instanceof Error ? error.message : 'Unable to verify student sign-in.')
          setUser(null)
        }
      }
    }

    checkStudentSession()
    return () => controller.abort()
  }, [])

  async function handleSignOut() {
    setIsSigningOut(true)
    setAuthError('')

    try {
      const response = await fetchWithCsrf(`${API_BASE_URL}/api/auth/logout`, { method: 'POST' })
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Unable to sign out.')
      }

      window.localStorage.removeItem('auth_token')
      window.localStorage.removeItem('auth_user')
      setUser(null)
      navigate(user?.is_instructor ? '/instructor/login' : '/login', { replace: true })
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Unable to sign out.')
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-text transition-colors dark:bg-slate-900 dark:text-white">
      <header className="border-b border-subtle-border bg-background dark:border-slate-700 dark:bg-slate-900">
        <div className="mx-auto flex min-h-20 w-full max-w-7xl flex-wrap items-center justify-between gap-x-8 gap-y-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link aria-label="Pyvot home" className="flex shrink-0 items-center" to="/">
            <img alt="Pyvot Logo" className="h-12 w-auto object-contain object-left md:h-14 lg:h-16" src={pyvotLogo} />
          </Link>

          <nav aria-label="Main navigation" className="flex flex-1 flex-wrap items-center gap-x-6 gap-y-2 lg:ml-8">
            {serviceLinks.map((item) => (
              <a
                className="text-sm font-medium text-text transition-colors hover:text-primary dark:text-slate-300"
                href={item.href}
                key={item.label}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <a
              className="rounded-pill px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-white/70 dark:hover:bg-slate-800"
              href="#course-catalog"
            >
              Explore Courses
            </a>
            {user ? (
              <UserDrawer
                isSigningOut={isSigningOut}
                onSignOut={handleSignOut}
                user={user}
              />
            ) : (
              <Link
                className="rounded-pill bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-pink-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                to="/login"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
        {authError && <p className="w-full text-right text-sm text-red-700" role="alert">{authError}</p>}
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 pb-16 pt-8 sm:px-6 sm:pt-12 lg:px-8">
        <section
          aria-labelledby="welcome-heading"
          className="relative isolate overflow-hidden rounded-3xl border border-slate-200 bg-slate-900 bg-cover bg-center px-8 py-12 shadow-xl dark:border-slate-800 sm:px-10 sm:py-14 md:px-12 lg:px-14"
          id="welcome"
          style={{
            backgroundImage: `linear-gradient(90deg, rgb(15 23 42 / 92%), rgb(88 28 135 / 78%)), url("${heroImage}")`,
          }}
        >
          <p className="mb-3 text-sm font-bold uppercase tracking-wider text-pink-200">
            Your next step starts here
          </p>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight text-white sm:text-5xl" id="welcome-heading">
            Welcome to Pyvot Learning.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-white/90 sm:text-lg">
            Build practical skills with flexible courses designed to help you grow your career and reach your goals.
          </p>
        </section>

        <div aria-hidden="true" className="my-10 border-b border-gray-200 dark:border-slate-800 md:my-14" />

        <section aria-labelledby="catalog-heading" id="course-catalog">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="mb-2 text-sm font-semibold text-primary">Learn at your pace</p>
              <h2 className="text-2xl font-bold text-primary sm:text-3xl" id="catalog-heading">
                Explore our courses
              </h2>
            </div>
            {!isLoading && !errorMessage && (
              <p className="text-sm text-text dark:text-slate-400">
                {courses.length} {courses.length === 1 ? 'course' : 'courses'} available
              </p>
            )}
          </div>

          {isLoading ? (
            <p className="rounded-2xl bg-subtle-card p-6 text-sm text-text dark:bg-slate-800 dark:text-slate-300" role="status">
              Loading courses…
            </p>
          ) : errorMessage ? (
            <p className="rounded-2xl bg-subtle-card p-6 text-sm text-text dark:bg-slate-800 dark:text-slate-300" role="alert">
              {errorMessage}
            </p>
          ) : courses.length === 0 ? (
            <p className="rounded-2xl bg-subtle-card p-6 text-sm text-text dark:bg-slate-800 dark:text-slate-300">
              No courses are available yet. Please check back soon.
            </p>
          ) : (
            <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <CourseCard course={course} key={course.id} />
              ))}
            </ul>
          )}
        </section>
      </main>

      <footer className="border-t border-subtle-border px-4 py-6 text-center text-sm text-text dark:border-slate-700 dark:text-slate-400 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-7xl">Pyvot © 2026</div>
      </footer>
    </div>
  )
}

export default CatalogPage
