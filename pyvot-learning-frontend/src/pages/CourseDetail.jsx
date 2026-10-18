import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import AuthPromptModal from '../components/AuthPromptModal.jsx'
import LockedContent from '../components/LockedContent.jsx'
import { hasCourseAccess, useAuth } from '../context/AuthContext.jsx'
import { useCourseCatalog } from '../context/CourseContext.jsx'
import { API_BASE_URL } from '../lib/api.js'

function CourseDetail() {
  const { courseId } = useParams()
  const { courses, isLoading, errorMessage } = useCourseCatalog()
  const { user, isLoading: isAuthLoading } = useAuth()
  const [isAuthPromptOpen, setIsAuthPromptOpen] = useState(false)
  const course = courses.find((item) => String(item.id) === courseId)
  const hasAccess = hasCourseAccess(user)

  if (isLoading) {
    return <p className="py-8 text-sm text-slate-600 dark:text-slate-400" role="status">Loading course…</p>
  }

  if (errorMessage) {
    return <p className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">{errorMessage}</p>
  }

  if (!course) return <Navigate replace to="/" />
  if (isAuthLoading) {
    return <p className="py-8 text-sm text-slate-600 dark:text-slate-400" role="status">Checking sign-in…</p>
  }

  const posterUrl = course.thumbnail
    ? new URL(`/storage/${course.thumbnail}`, API_BASE_URL).toString()
    : undefined
  const firstLesson = course.lessons[0]

  function promptForAuth() {
    if (!isAuthLoading && !user) {
      setIsAuthPromptOpen(true)
    }
  }

  return (
    <article>
      <Link className="text-sm font-semibold text-purple-700 hover:underline dark:text-[#FF7A68]" to="/">
        Back to courses
      </Link>
      {course.category_track && (
        <p className="mt-6 text-xs font-bold uppercase tracking-widest text-[#FF7A68]">
          {course.category_track}
        </p>
      )}
      <h1 className="mt-2 text-3xl font-bold">{course.title}</h1>
      <p className="mt-3 text-slate-600 dark:text-slate-300">{course.description}</p>

      {!user ? (
        <section className="mt-8 rounded-3xl border border-[#F0EBE1] bg-white p-6 shadow-sm dark:border dark:border-[#383254] dark:bg-[#1A182B]/80">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Preview this course</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Sign in or create a free account to access the lessons and study materials.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              className="btn-primary disabled:cursor-wait disabled:opacity-60"
              disabled={isAuthLoading}
              onClick={promptForAuth}
              type="button"
            >
              Start Lesson
            </button>
            <button
              className="rounded-xl border border-[#F0EBE1] bg-[#FFFDF9] px-5 py-3 text-sm font-semibold text-slate-800 transition-colors hover:bg-amber-50 disabled:cursor-wait disabled:opacity-60 dark:border-[#2E2A47] dark:bg-[#181628] dark:text-white dark:hover:bg-[#231F3A]"
              disabled={isAuthLoading}
              onClick={promptForAuth}
              type="button"
            >
              Enroll
            </button>
          </div>
          {isAuthLoading && (
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400" role="status">
              Checking sign-in…
            </p>
          )}
        </section>
      ) : (
        <section className="mt-10" aria-labelledby="course-materials-heading">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-xl font-semibold" id="course-materials-heading">Lessons and study materials</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {course.materials.length} {course.materials.length === 1 ? 'item' : 'items'}
            </p>
          </div>

          {firstLesson && (
            <Link
              className="btn-primary mt-4"
              to={`/courses/${course.id}/lessons/${firstLesson.id}`}
            >
              Start Lesson
            </Link>
          )}

          {course.materials.length === 0 ? (
            <p className="mt-4 rounded-2xl bg-slate-50 p-5 text-sm text-slate-600 dark:border dark:border-[#2E2A47] dark:bg-[#181628] dark:text-slate-300">
              Materials for this course have not been added yet.
            </p>
          ) : (
            <ol className="mt-4 space-y-6">
              {course.materials.map((material, index) => {
                const canPreview = material.is_free_preview === true
                const canAccessMaterial = hasAccess || canPreview
                const materialUrl = new URL(`/storage/${material.path}`, API_BASE_URL).toString()
                const isVideo = material.mime_type.startsWith('video/')

                return (
                  <li className="rounded-3xl border border-slate-200 bg-white p-4 dark:border dark:border-purple-500/20 dark:bg-[#1A182B]/80 dark:shadow-2xl sm:p-6" key={material.id}>
                    <div className="mb-4">
                      <h3 className="font-semibold">
                        <span className="mr-2 text-slate-500 dark:text-slate-400">{index + 1}.</span>
                        {material.title}
                      </h3>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        {isVideo ? 'Video lesson' : 'PDF study material'}
                      </p>
                    </div>

                    {canAccessMaterial && isVideo ? (
                      <video className="aspect-video w-full rounded bg-slate-950" controls muted={false} poster={posterUrl} preload="metadata">
                        <source src={materialUrl} type={material.mime_type} />
                        Your browser does not support video playback.
                      </video>
                    ) : canAccessMaterial ? (
                      <div>
                        <iframe
                          className="h-[32rem] w-full rounded-3xl border border-slate-200 dark:border-purple-500/20"
                          loading="lazy"
                          src={materialUrl}
                          title={`PDF study material: ${material.title}`}
                        />
                        <a
                          className="mt-3 inline-block text-sm font-semibold text-purple-700 hover:underline dark:text-pink-300"
                          href={materialUrl}
                          rel="noreferrer"
                          target="_blank"
                        >
                          Open PDF in a new tab
                        </a>
                      </div>
                    ) : (
                      <LockedContent />
                    )}
                  </li>
                )
              })}
            </ol>
          )}
          {!hasAccess && course.materials.length > 0 && (
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
              Free previews are available where marked. Subscribe to unlock all other course materials.
            </p>
          )}
        </section>
      )}
      {isAuthPromptOpen && <AuthPromptModal onClose={() => setIsAuthPromptOpen(false)} />}
    </article>
  )
}

export default CourseDetail
