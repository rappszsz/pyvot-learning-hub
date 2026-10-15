import { Link, Navigate, useParams } from 'react-router-dom'
import { useCourseCatalog } from '../context/CourseContext.jsx'
import { API_BASE_URL } from '../lib/api.js'

function CourseDetail() {
  const { courseId } = useParams()
  const { courses, isLoading, errorMessage } = useCourseCatalog()
  const course = courses.find((item) => String(item.id) === courseId)

  if (isLoading) {
    return <p className="py-8 text-sm text-slate-600 dark:text-slate-400" role="status">Loading course…</p>
  }

  if (errorMessage) {
    return <p className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">{errorMessage}</p>
  }

  if (!course) return <Navigate replace to="/" />

  const posterUrl = course.thumbnail
    ? new URL(`/storage/${course.thumbnail}`, API_BASE_URL).toString()
    : undefined

  return (
    <article>
      <Link className="text-sm font-semibold text-blue-700 hover:underline" to="/">
        Back to courses
      </Link>
      {course.category_track && (
        <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {course.category_track}
        </p>
      )}
      <h1 className="mt-2 text-3xl font-bold">{course.title}</h1>
      <p className="mt-3 text-slate-600 dark:text-slate-300">{course.description}</p>

      <section className="mt-10" aria-labelledby="course-materials-heading">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-xl font-semibold" id="course-materials-heading">Lessons and study materials</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {course.materials.length} {course.materials.length === 1 ? 'item' : 'items'}
          </p>
        </div>

        {course.materials.length === 0 ? (
          <p className="mt-4 rounded bg-slate-50 p-5 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            Materials for this course have not been added yet.
          </p>
        ) : (
          <ol className="mt-4 space-y-6">
            {course.materials.map((material, index) => {
              const materialUrl = new URL(`/storage/${material.path}`, API_BASE_URL).toString()
              const isVideo = material.mime_type.startsWith('video/')

              return (
                <li className="rounded border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800 sm:p-6" key={material.id}>
                  <div className="mb-4">
                    <h3 className="font-semibold">
                      <span className="mr-2 text-slate-500 dark:text-slate-400">{index + 1}.</span>
                      {material.title}
                    </h3>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {isVideo ? 'Video lesson' : 'PDF study material'}
                    </p>
                  </div>

                  {isVideo ? (
                    <video className="aspect-video w-full rounded bg-slate-950" controls muted={false} poster={posterUrl} preload="metadata">
                      <source src={materialUrl} type={material.mime_type} />
                      Your browser does not support video playback.
                    </video>
                  ) : (
                    <div>
                      <iframe
                        className="h-[32rem] w-full rounded border border-slate-200 dark:border-slate-700"
                        loading="lazy"
                        src={materialUrl}
                        title={`PDF study material: ${material.title}`}
                      />
                      <a
                        className="mt-3 inline-block text-sm font-semibold text-blue-700 hover:underline"
                        href={materialUrl}
                        rel="noreferrer"
                        target="_blank"
                      >
                        Open PDF in a new tab
                      </a>
                    </div>
                  )}
                </li>
              )
            })}
          </ol>
        )}
      </section>
    </article>
  )
}

export default CourseDetail
