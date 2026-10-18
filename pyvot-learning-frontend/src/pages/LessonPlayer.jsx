import { useRef, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import LockedContent from '../components/LockedContent.jsx'
import { hasCourseAccess, useAuth } from '../context/AuthContext.jsx'
import { useCourses } from '../context/CourseContext.jsx'
import { API_BASE_URL } from '../lib/api.js'

const tabs = ['About Lesson', 'Discussion/Notes', 'Resources']

function LessonPlayer() {
  const { courseId, lessonId } = useParams()
  const course = useCourses().find((item) => String(item.id) === courseId)
  const lesson = course?.lessons.find((item) => item.id === lessonId)
  const { user, isLoading: isAuthLoading } = useAuth()
  const videoRef = useRef(null)
  const [activeTab, setActiveTab] = useState(tabs[0])
  const [notes, setNotes] = useState('')
  const [playbackError, setPlaybackError] = useState('')

  if (!lesson) return <Navigate replace to="/" />
  if (isAuthLoading) {
    return <p className="py-8 text-sm text-slate-600 dark:text-slate-400" role="status">Checking sign-in…</p>
  }

  const videoUrl = new URL(`/storage/${lesson.path}`, API_BASE_URL).toString()
  const posterUrl = course.thumbnail
    ? new URL(`/storage/${course.thumbnail}`, API_BASE_URL).toString()
    : undefined
  const hasAccess = hasCourseAccess(user) || lesson.is_free_preview === true
  const resources = course.materials.filter((material) => !material.mime_type.startsWith('video/'))

  async function startLesson() {
    if (!videoRef.current) return
    setPlaybackError('')

    try {
      await videoRef.current.play()
      videoRef.current.focus()
    } catch {
      setPlaybackError('Unable to start video playback. Please try using the video player controls.')
    }
  }

  return (
    <article>
      <Link
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition-colors hover:text-purple-700 dark:text-slate-300 dark:hover:text-pink-300"
        to={`/courses/${course.id}`}
      >
        <span aria-hidden="true">←</span>
        Back to course overview
      </Link>

      {course.category_track && (
        <p className="mt-6 text-xs font-bold uppercase tracking-widest text-purple-700 dark:text-pink-300">
          {course.category_track}
        </p>
      )}
      <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">{lesson.title}</h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{course.title}</p>

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 shadow-xl dark:border-[#2E2A47]">
        {hasAccess ? (
          <video
            className="aspect-video w-full bg-slate-950"
            controls
            muted={false}
            poster={posterUrl}
            preload="metadata"
            ref={videoRef}
            tabIndex="-1"
          >
            <source src={videoUrl} type={lesson.mime_type} />
            Your browser does not support video playback.
          </video>
        ) : (
          <div className="bg-white dark:bg-[#1A182B]">
            <LockedContent />
          </div>
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          className="btn-primary"
          disabled={!hasAccess}
          onClick={startLesson}
          type="button"
        >
          <span aria-hidden="true">▶</span>
          Start Lesson
        </button>
        {playbackError && (
          <p className="text-sm text-red-700 dark:text-red-300" role="alert">
            {playbackError}
          </p>
        )}
      </div>

      <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-[#2E2A47] dark:bg-[#1A182B]">
        <div aria-label="Lesson details" className="flex overflow-x-auto border-b border-slate-200 dark:border-[#2E2A47]" role="tablist">
          {tabs.map((tab) => (
            <button
              aria-selected={activeTab === tab}
              className={`shrink-0 border-b-2 px-4 py-3 text-sm font-semibold transition-colors sm:px-5 ${
                activeTab === tab
                  ? 'border-purple-600 text-purple-700 dark:border-pink-400 dark:text-pink-300'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
              id={`tab-${tabs.indexOf(tab)}`}
              key={tab}
              onClick={() => setActiveTab(tab)}
              role="tab"
              type="button"
            >
              {tab}
            </button>
          ))}
        </div>

        <div
          aria-labelledby={`tab-${tabs.indexOf(activeTab)}`}
          className="min-h-36 p-5"
          role="tabpanel"
        >
          {activeTab === 'About Lesson' && (
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">About this lesson</h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600 dark:text-slate-300">
                {course.description || 'No lesson description is available yet.'}
              </p>
            </div>
          )}
          {activeTab === 'Discussion/Notes' && (
            <div>
              <label className="text-base font-semibold text-slate-900 dark:text-white" htmlFor="lesson-notes">
                Your lesson notes
              </label>
              <textarea
                className="mt-3 min-h-28 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-[#383254] dark:bg-[#181628] dark:text-slate-100"
                id="lesson-notes"
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Write notes as you learn…"
                value={notes}
              />
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Notes are saved for this session only.
              </p>
            </div>
          )}
          {activeTab === 'Resources' && (
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Lesson resources</h2>
              {resources.length === 0 ? (
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">No downloadable files available yet.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {resources.map((resource) => {
                    const canDownload = hasCourseAccess(user) || resource.is_free_preview === true

                    return (
                      <li key={resource.id}>
                        {canDownload ? (
                          <a
                            className="inline-flex items-center gap-2 text-sm font-medium text-purple-700 hover:underline dark:text-pink-300"
                            download
                            href={new URL(`/storage/${resource.path}`, API_BASE_URL).toString()}
                            rel="noreferrer"
                            target="_blank"
                          >
                            <span aria-hidden="true">↓</span>
                            {resource.title}
                          </a>
                        ) : (
                          <span className="text-sm text-slate-500 dark:text-slate-400">
                            {resource.title} — course access required
                          </span>
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )}
        </div>
      </section>
    </article>
  )
}

export default LessonPlayer
