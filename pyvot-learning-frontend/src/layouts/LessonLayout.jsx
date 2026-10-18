import { Link, Navigate, Outlet, useParams } from 'react-router-dom'
import { hasCourseAccess, useAuth } from '../context/AuthContext.jsx'
import { useCourses } from '../context/CourseContext.jsx'
import { API_BASE_URL } from '../lib/api.js'

function LessonLayout() {
  const { courseId, lessonId } = useParams()
  const courses = useCourses()
  const course = courses.find((item) => String(item.id) === courseId)
  const { user } = useAuth()

  if (!course) return <Navigate replace to="/" />
  const currentLessonIndex = course.lessons.findIndex((lesson) => lesson.id === lessonId)
  if (currentLessonIndex === -1) {
    return <Navigate replace to={`/courses/${course.id}`} />
  }

  const progress = Math.round(((currentLessonIndex + 1) / course.lessons.length) * 100)
  const resources = course.materials.filter((material) => !material.mime_type.startsWith('video/'))
  const canAccessResources = hasCourseAccess(user)

  return (
    <section className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <div className="min-w-0 lg:col-span-2">
        <Outlet />
      </div>

      <aside aria-label="Course information" className="min-w-0 lg:col-span-1">
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border dark:border-[#2E2A47] dark:bg-[#1A182B]">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Course Progress</h2>
            <span className="text-sm font-semibold text-purple-700 dark:text-pink-300">{progress}% Complete</span>
          </div>
          <div
            aria-label={`${progress}% complete`}
            className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-[#2E2A47]"
            role="progressbar"
            aria-valuemax="100"
            aria-valuemin="0"
            aria-valuenow={progress}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-purple-600 via-fuchsia-500 to-pink-400 shadow-[0_0_14px_rgba(217,70,239,0.65)] transition-[width] duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Lesson {currentLessonIndex + 1} of {course.lessons.length}
          </p>
        </section>

        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border dark:border-[#2E2A47] dark:bg-[#1A182B]">
          <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">{course.title}</h2>
          <ol aria-label="Course lessons" className="space-y-2">
            {course.lessons.map((lesson, index) => {
              const isCurrent = lesson.id === lessonId
              const isCompleted = index < currentLessonIndex

              return (
                <li key={lesson.id}>
                  <Link
                    aria-current={isCurrent ? 'page' : undefined}
                    className={`flex items-center gap-3 rounded-xl border px-3 py-3 text-sm transition-colors ${
                      isCurrent
                        ? 'border-purple-500 bg-purple-500/10 font-semibold text-purple-800 dark:text-pink-200'
                        : 'border-transparent text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-[#232038]'
                    }`}
                    to={`/courses/${course.id}/lessons/${lesson.id}`}
                  >
                    <span
                      aria-hidden="true"
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs ${
                        isCompleted
                          ? 'bg-emerald-100 font-bold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                          : isCurrent
                            ? 'bg-purple-600 text-white'
                            : 'bg-slate-100 text-slate-500 dark:bg-[#25223A] dark:text-slate-400'
                      }`}
                    >
                      {isCompleted ? '✓' : isCurrent ? index + 1 : '▶'}
                    </span>
                    <span className="min-w-0 flex-1">{lesson.title}</span>
                    {isCurrent && <span className="sr-only">Currently playing</span>}
                    {isCompleted && <span className="sr-only">Completed</span>}
                  </Link>
                </li>
              )
            })}
          </ol>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border dark:border-[#2E2A47] dark:bg-[#1A182B]">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Instructor &amp; Downloads</h2>
          <div className="mt-4 flex items-center gap-3">
            <span
              aria-hidden="true"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-pink-500 text-lg font-semibold text-white"
            >
              {course.instructor?.name?.trim()?.charAt(0)?.toUpperCase() || '?'}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                {course.instructor?.name || 'Instructor details unavailable'}
              </p>
              {course.instructor?.bio && (
                <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                  {course.instructor.bio}
                </p>
              )}
            </div>
          </div>

          <div className="mt-5 border-t border-slate-200 pt-4 dark:border-[#2E2A47]">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Course resources</h3>
            {resources.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">No downloadable files available yet.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {resources.map((resource) => {
                  const canDownload = canAccessResources || resource.is_free_preview === true

                  return (
                    <li key={resource.id}>
                      {canDownload ? (
                        <a
                          className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-purple-700 transition-colors hover:bg-purple-50 hover:text-purple-900 dark:text-pink-300 dark:hover:bg-[#232038] dark:hover:text-pink-200"
                          download
                          href={new URL(`/storage/${resource.path}`, API_BASE_URL).toString()}
                          rel="noreferrer"
                          target="_blank"
                        >
                          <span aria-hidden="true">↓</span>
                          <span className="min-w-0 flex-1 truncate">{resource.title}</span>
                          <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400">PDF</span>
                        </a>
                      ) : (
                        <p className="px-2 py-2 text-sm text-slate-500 dark:text-slate-400">
                          {resource.title} — course access required
                        </p>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </section>
      </aside>
    </section>
  )
}

export default LessonLayout
