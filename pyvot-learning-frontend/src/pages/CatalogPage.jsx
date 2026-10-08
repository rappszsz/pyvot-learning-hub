import { Link } from 'react-router-dom'
import pyvotLogo from '../assets/pyvot-logo.png'
import { useCourses } from '../context/CourseContext.jsx'

const serviceLinks = [
  { label: 'Business Solutions', href: '#course-catalog' },
  { label: 'Growth Services', href: '#course-catalog' },
  { label: 'About Pyvot', href: '#welcome' },
]

function CatalogPage() {
  const courses = useCourses()

  return (
    <div className="min-h-screen bg-background text-text">
      <header className="border-b border-subtle-border bg-background">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-x-8 gap-y-4 px-4 py-5 sm:px-6 lg:px-8">
          <Link aria-label="Pyvot home" className="flex items-center" to="/">
            <img alt="Pyvot Logo" className="h-10 w-auto" src={pyvotLogo} />
          </Link>

          <nav aria-label="Main navigation" className="flex flex-1 flex-wrap items-center gap-x-6 gap-y-2 lg:ml-8">
            {serviceLinks.map((item) => (
              <a
                className="text-sm font-medium text-text transition-colors hover:text-primary"
                href={item.href}
                key={item.label}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <a
              className="rounded-pill px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-white/70"
              href="#course-catalog"
            >
              My Courses
            </a>
            <Link
              className="rounded-pill bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              to="/instructor"
            >
              Instructor Dashboard
            </Link>
            <button
              className="rounded-pill bg-register-gradient px-5 py-2 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
              type="button"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 pb-16 pt-8 sm:px-6 sm:pt-12 lg:px-8">
        <section
          aria-labelledby="welcome-heading"
          className="rounded-3xl bg-subtle-card px-6 py-10 sm:px-10 sm:py-14 lg:px-14"
          id="welcome"
        >
          <p className="mb-3 text-sm font-bold uppercase tracking-wider text-primary">
            Your next step starts here
          </p>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight text-primary sm:text-5xl">
            Welcome to Pyvot Learning.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-text sm:text-lg">
            Build practical skills with flexible courses designed to help you grow your career and reach your goals.
          </p>
        </section>

        <section aria-labelledby="catalog-heading" className="pt-12 sm:pt-16" id="course-catalog">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="mb-2 text-sm font-semibold text-primary">Learn at your pace</p>
              <h2 className="text-2xl font-bold text-primary sm:text-3xl" id="catalog-heading">
                Explore our courses
              </h2>
            </div>
            <p className="text-sm text-text">{courses.length} courses available</p>
          </div>

          <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course, index) => (
              <li
                className="overflow-hidden rounded-3xl border border-subtle-border bg-white p-4 shadow-sm sm:p-5"
                key={course.id}
              >
                <div
                  aria-hidden="true"
                  className="flex aspect-[16/9] items-center justify-center rounded-2xl bg-subtle-card"
                >
                  <span className="text-sm font-semibold uppercase tracking-wider text-primary/60">
                    Course preview {String(index + 1).padStart(2, '0')}
                  </span>
                </div>

                <div className="px-1 pb-1 pt-5">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <span className="rounded-pill bg-primary px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                      Certificate track
                    </span>
                    <span className="text-xs text-text">{course.lessons.length} lessons</span>
                  </div>

                  <h3 className="text-xl font-bold leading-snug text-primary">
                    {course.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-text">
                    {course.description}
                  </p>
                  <p className="mt-3 text-xs font-medium text-text">
                    Instructor: {course.instructor}
                  </p>

                  <Link
                    className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-pill bg-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    to={`/courses/${course.id}`}
                  >
                    View Course
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="border-t border-subtle-border px-4 py-6 text-center text-sm text-text sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-7xl">Pyvot © 2026</div>
      </footer>
    </div>
  )
}

export default CatalogPage