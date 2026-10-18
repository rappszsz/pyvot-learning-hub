import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import heroImage from '../assets/hero.png'
import pyvotLogo from '../assets/pyvot-logo.png'
import AuthPromptModal from '../components/AuthPromptModal.jsx'
import UserDrawer from '../components/UserDrawer.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useCourseCatalog } from '../context/CourseContext.jsx'
import { API_BASE_URL, fetchWithCsrf } from '../lib/api.js'

const serviceLinks = [
  { label: 'Business Solutions', href: '#course-catalog' },
  { label: 'Growth Services', href: '#course-catalog' },
  { label: 'About Pyvot', href: '#welcome' },
]

const courseCategories = ['All Courses', 'Virtual Assistant', 'Technical', 'Administrative']

function CourseCard({ course, isAuthLoading, onViewCourse }) {
  const lessons = course.materials.filter((material) => material.mime_type.startsWith('video/')).length
  const studyMaterials = course.materials.length - lessons
  const thumbnailUrl = course.thumbnail
    ? new URL(`/storage/${course.thumbnail}`, API_BASE_URL).toString()
    : null

  return (
    <li className="flex flex-col justify-between overflow-hidden rounded-3xl border border-[#F0EBE1] bg-white shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl dark:border dark:border-purple-500/20 dark:bg-[#1A182B]/80 dark:shadow-2xl">
      <div className="relative flex h-40 items-center justify-center bg-[#FFFDF9] font-medium text-gray-400 dark:rounded-t-3xl dark:bg-[#231F3A] dark:text-slate-300">
        {thumbnailUrl ? (
          <img
            alt={course.title}
            className="h-full w-full object-cover"
            src={thumbnailUrl}
          />
        ) : (
          <span>COURSE PREVIEW</span>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-gray-700 shadow-sm dark:bg-[#322338] dark:text-[#FF7A68] dark:border dark:border-[#53304B]">
          {course.difficulty || course.level || 'Beginner'}
        </span>
      </div>
      <div className="flex-1 p-5">
        <span className="text-xs font-bold uppercase tracking-widest text-pink-600 dark:text-[#FF7A68]">
          {course.category_track || 'COURSE'}
        </span>
        <h3 className="mt-1 text-lg font-bold text-gray-900 dark:text-white">{course.title}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-gray-600 dark:text-slate-300">{course.description}</p>
      </div>
      <div className="border-t border-[#F0EBE1] bg-[#FFFDF9] px-5 py-4 dark:border-white/10 dark:bg-[#181628]">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm">
          <p className="font-medium text-gray-600 dark:text-slate-300">
            {lessons} {lessons === 1 ? 'lesson' : 'lessons'}
            {studyMaterials > 0 && (
              <span className="font-normal text-gray-500 dark:text-slate-400">
                {' '}· {studyMaterials} {studyMaterials === 1 ? 'study material' : 'study materials'}
              </span>
            )}
          </p>
          <span className="rounded-full bg-purple-100 px-2.5 py-1 text-xs font-semibold text-purple-700 dark:bg-pink-500/15 dark:text-pink-300">
            {course.is_pro ? 'Pro' : 'Included in Plan'}
          </span>
        </div>
        <button
          className="btn-primary w-full px-3 py-2 text-sm disabled:cursor-wait disabled:opacity-60"
          disabled={isAuthLoading}
          onClick={onViewCourse}
          type="button"
        >
          View Course
        </button>
      </div>
    </li>
  )
}

function CatalogPage() {
  const { courses, isLoading, errorMessage } = useCourseCatalog()
  const { user, setUser, isLoading: isAuthLoading, errorMessage: authErrorMessage } = useAuth()
  const navigate = useNavigate()
  const [authError, setAuthError] = useState('')
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeCategory, setActiveCategory] = useState('All Courses')
  const [isAuthPromptOpen, setIsAuthPromptOpen] = useState(false)
  const canAccessInstructorStudio =
    user?.role === 'admin' || user?.is_admin || user?.is_instructor
  const isAdmin = user?.role === 'admin' || user?.is_admin

  const normalizedSearchTerm = searchTerm.trim().toLowerCase()
  const filteredCourses = courses.filter((course) => {
    const matchesCategory =
      activeCategory === 'All Courses' ||
      course.category_track?.trim().toLowerCase() === activeCategory.toLowerCase()
    const searchableText = [course.title, course.description, course.category_track]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    return matchesCategory && searchableText.includes(normalizedSearchTerm)
  })

  function handleViewCourse(courseId) {
    if (isAuthLoading) return
    if (!user) {
      setIsAuthPromptOpen(true)
      return
    }

    navigate(`/courses/${courseId}`)
  }

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
    <div className="min-h-screen bg-[#FAF7F2] text-slate-900 transition-colors dark:bg-[#12111D] dark:text-slate-100">
      <header className="border-b border-[#F0EBE1] bg-[#FAF7F2] dark:border-b dark:border-white/5 dark:bg-[#12111D]/90 dark:backdrop-blur-md">
        <div className="mx-auto flex min-h-20 w-full max-w-7xl flex-wrap items-center justify-between gap-x-8 gap-y-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link aria-label="Pyvot home" className="flex shrink-0 items-center" to="/">
            <img alt="Pyvot Logo" className="h-12 w-auto object-contain object-left md:h-14 lg:h-16" src={pyvotLogo} />
          </Link>

          <nav aria-label="Main navigation" className="flex flex-1 flex-wrap items-center gap-x-6 gap-y-2 lg:ml-8">
            {canAccessInstructorStudio && (
              <>
                <NavLink
                  className={({ isActive }) =>
                    `${isActive ? 'btn-primary' : 'btn-secondary'} px-3 py-2 text-sm`
                  }
                  end
                  to="/courses"
                >
                  Preview Catalog
                </NavLink>
                <Link className="btn-primary px-3 py-2 text-sm" to="/instructor/dashboard">
                  Instructor Dashboard
                </Link>
                <Link className="btn-secondary px-3 py-2 text-sm" to="/instructor/courses/create">
                  Create Course
                </Link>
              </>
            )}
            {!canAccessInstructorStudio && serviceLinks.map((item) => (
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
              className="btn-secondary group px-4 py-2 text-sm"
              href="#course-catalog"
            >
              Explore Courses
              <span aria-hidden="true" className="inline-block transition-transform duration-200 ease-out group-hover:translate-x-1.5">
                →
              </span>
            </a>
            {user ? (
              <UserDrawer
                isSigningOut={isSigningOut}
                onSignOut={handleSignOut}
                user={user}
              />
            ) : (
              <Link
                className="btn-primary px-4 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                to="/login"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
        {(authError || authErrorMessage) && (
          <p className="w-full text-right text-sm text-red-700" role="alert">
            {authError || authErrorMessage}
          </p>
        )}
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 pb-16 pt-8 sm:px-6 sm:pt-12 lg:px-8">
        {isAdmin && (
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-purple-200 bg-purple-50 px-4 py-3 text-sm text-purple-900 dark:border-purple-900/50 dark:bg-purple-950/40 dark:text-purple-100">
            <p>🛠️ Admin Mode: You are viewing the student catalog view.</p>
            <Link
              className="btn-primary px-4 py-2 text-sm"
              to="/instructor/dashboard"
            >
              Back to Instructor Studio
            </Link>
          </div>
        )}
        {!isAuthLoading && !user && (
          <p className="mb-5 rounded-xl border border-purple-100 bg-purple-50 px-4 py-3 text-sm text-purple-900 dark:border-purple-900/50 dark:bg-purple-950/40 dark:text-purple-100">
            👋 You&apos;re in preview mode. Sign in to access full course materials.
          </p>
        )}
        <section
          aria-labelledby="welcome-heading"
          className="relative isolate overflow-hidden rounded-3xl border border-slate-200 bg-slate-900 bg-cover bg-center px-8 py-12 shadow-xl dark:border dark:border-[#383254] dark:bg-[#1A182B]/80 sm:px-10 sm:py-14 md:px-12 lg:px-14"
          id="welcome"
          style={{
            backgroundImage: `linear-gradient(90deg, rgb(15 23 42 / 92%), rgb(88 28 135 / 78%)), url("${heroImage}")`,
          }}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-10 left-1/2 h-64 w-3/4 -translate-x-1/2 rounded-full bg-purple-600/15 blur-[120px]"
          />
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

        <section
          aria-label="Learning platform highlights"
          className="my-6 grid grid-cols-1 gap-3 rounded-2xl border border-[#F0EBE1] bg-white/60 p-4 shadow-sm dark:border dark:border-[#2E2A47] dark:bg-[#181628] sm:grid-cols-3"
        >
          <div className="rounded-xl px-3 py-2 text-center">
            <p className="text-lg font-bold text-gray-900 dark:text-white">500+</p>
            <p className="text-sm text-gray-600 dark:text-slate-300">Active Students</p>
          </div>
          <div className="rounded-xl px-3 py-2 text-center">
            <p className="text-lg font-bold text-gray-900 dark:text-white">Self-Paced</p>
            <p className="text-sm text-gray-600 dark:text-slate-300">Modules</p>
          </div>
          <div className="rounded-xl px-3 py-2 text-center">
            <p className="text-lg font-bold text-gray-900 dark:text-white">Verified</p>
            <p className="text-sm text-gray-600 dark:text-slate-300">Certificates</p>
          </div>
        </section>

        <div aria-hidden="true" className="my-10 border-b border-[#F0EBE1] dark:border-[#2E2A47] md:my-14" />

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
                {filteredCourses.length} {filteredCourses.length === 1 ? 'course' : 'courses'} available
              </p>
            )}
          </div>

          <div className="mb-6">
            <label className="sr-only" htmlFor="course-search">Search courses</label>
            <div className="relative max-w-xl">
              <svg
                aria-hidden="true"
                className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-4-4" strokeLinecap="round" />
              </svg>
              <input
                className="w-full rounded-2xl border border-[#F0EBE1] bg-white py-3 pl-12 pr-4 text-sm text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 dark:border dark:border-white/10 dark:bg-[#1E1F30] dark:text-slate-200 dark:placeholder:text-slate-400 dark:focus:border-pink-500 dark:focus:ring-pink-500/20"
                id="course-search"
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search courses..."
                type="search"
                value={searchTerm}
              />
            </div>
            <div aria-label="Filter courses by category" className="mt-4 flex flex-wrap gap-2" role="group">
              {courseCategories.map((category) => {
                const isActive = activeCategory === category

                return (
                  <button
                    aria-pressed={isActive}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 ${
                      isActive
                        ? 'bg-purple-600 text-white dark:bg-pink-600'
                        : 'bg-white text-gray-600 hover:bg-purple-50 dark:border dark:border-white/10 dark:bg-[#1E1F30] dark:text-slate-200 dark:hover:bg-[#231F3A]'
                    }`}
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    type="button"
                  >
                    {category}
                  </button>
                )
              })}
            </div>
          </div>

          {isLoading ? (
            <p className="rounded-2xl bg-subtle-card p-6 text-sm text-text dark:border dark:border-[#383254] dark:bg-[#1A182B]/80 dark:text-slate-300" role="status">
              Loading courses…
            </p>
          ) : errorMessage ? (
            <p className="rounded-2xl bg-subtle-card p-6 text-sm text-text dark:border dark:border-[#383254] dark:bg-[#1A182B]/80 dark:text-slate-300" role="alert">
              {errorMessage}
            </p>
          ) : courses.length === 0 ? (
            <p className="rounded-2xl bg-subtle-card p-6 text-sm text-text dark:border dark:border-[#383254] dark:bg-[#1A182B]/80 dark:text-slate-300">
              No courses are available yet. Please check back soon.
            </p>
          ) : filteredCourses.length === 0 ? (
            <p className="rounded-2xl bg-subtle-card p-6 text-sm text-text dark:border dark:border-[#383254] dark:bg-[#1A182B]/80 dark:text-slate-300">
              No courses match your search. Try another keyword or category.
            </p>
          ) : (
            <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredCourses.map((course) => (
                <CourseCard
                  course={course}
                  isAuthLoading={isAuthLoading}
                  key={course.id}
                  onViewCourse={() => handleViewCourse(course.id)}
                />
              ))}
            </ul>
          )}
        </section>
      </main>

      <footer className="border-t border-[#F0EBE1] px-4 py-6 text-center text-sm text-slate-900 dark:border-[#2E2A47] dark:text-slate-400 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-7xl">Pyvot © 2026</div>
      </footer>
      {isAuthPromptOpen && <AuthPromptModal onClose={() => setIsAuthPromptOpen(false)} />}
    </div>
  )
}

export default CatalogPage
