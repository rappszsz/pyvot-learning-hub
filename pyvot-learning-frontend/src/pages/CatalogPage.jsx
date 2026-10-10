import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import pyvotLogo from '../assets/pyvot-logo.png'
import { useCourseCatalog } from '../context/CourseContext.jsx'
import { API_BASE_URL } from '../lib/api.js'

const serviceLinks = [
  { label: 'Business Solutions', href: '#course-catalog' },
  { label: 'Growth Services', href: '#course-catalog' },
  { label: 'About Pyvot', href: '#welcome' },
]

function CourseCard({ course, deleting, onDelete, onEdit }) {
  const navigate = useNavigate()
  const lessons = course.materials.filter((material) => material.mime_type.startsWith('video/')).length
  const studyMaterials = course.materials.length - lessons
  const thumbnailUrl = course.thumbnail
    ? new URL(`/storage/${course.thumbnail}`, API_BASE_URL).toString()
    : null

  return (
    <li className="flex flex-col justify-between overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="flex h-40 items-center justify-center bg-gray-50 font-medium text-gray-400">
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
        <span className="text-xs font-semibold uppercase tracking-wider text-purple-600">
          {course.category_track || 'COURSE'}
        </span>
        <h3 className="mt-1 text-lg font-bold text-gray-900">{course.title}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-gray-600">{course.description}</p>
        <p className="mt-3 text-sm font-medium text-gray-600">
          {lessons} {lessons === 1 ? 'lesson' : 'lessons'}
          {studyMaterials > 0 && (
            <span className="font-normal text-gray-500">
              {' '}· {studyMaterials} {studyMaterials === 1 ? 'study material' : 'study materials'}
            </span>
          )}
        </p>
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-gray-100 bg-gray-50 px-5 py-4">
        <button
          className="flex-1 rounded-xl bg-purple-600 px-3 py-2 text-center text-sm font-medium text-white transition hover:bg-purple-700"
          onClick={() => navigate(`/courses/${course.id}`)}
          type="button"
        >
          View Course
        </button>
        <button
          className="rounded-xl bg-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-300"
          onClick={(event) => {
            event.stopPropagation()
            onEdit(course)
          }}
          type="button"
        >
          Edit
        </button>
        <button
          className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100 disabled:opacity-50"
          disabled={deleting}
          onClick={(event) => {
            event.stopPropagation()
            if (window.confirm('Are you sure you want to delete this course?')) {
              onDelete(course.id)
            }
          }}
          type="button"
        >
          {deleting ? 'Deleting…' : 'Delete'}
        </button>
      </div>
    </li>
  )
}

function CatalogPage() {
  const {
    courses,
    isLoading,
    errorMessage,
    updateCourse,
    removeCourse,
    restoreCourse,
  } = useCourseCatalog()
  const [editingCourse, setEditingCourse] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [deletingCourseId, setDeletingCourseId] = useState(null)
  const [actionError, setActionError] = useState('')

  function openEdit(course) {
    setEditingCourse(course)
    setEditTitle(course.title)
    setEditDescription(course.description)
    setActionError('')
  }

  async function handleEditSubmit(event) {
    event.preventDefault()
    setIsSavingEdit(true)
    setActionError('')

    const formData = new FormData()
    formData.append('_method', 'PATCH')
    formData.append('title', editTitle)
    formData.append('description', editDescription)
    const thumbnail = event.currentTarget.elements.namedItem('thumbnail').files[0]
    if (thumbnail) {
      formData.append('thumbnail', thumbnail)
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/courses/${editingCourse.id}`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })
      const result = await response.json()

      if (!response.ok) {
        const validationErrors = Object.values(result.errors ?? {}).flat()
        throw new Error(validationErrors.join(' ') || result.message || 'Unable to update this course.')
      }
      if (!result.course) {
        throw new Error('The course update response was not in the expected format.')
      }

      updateCourse(editingCourse.id, result.course)
      setEditingCourse(null)
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to update this course.')
    } finally {
      setIsSavingEdit(false)
    }
  }

  async function handleDelete(courseId) {
    const courseIndex = courses.findIndex((item) => String(item.id) === String(courseId))
    const course = courses[courseIndex]

    if (!course) {
      return
    }

    removeCourse(courseId)
    setDeletingCourseId(courseId)
    setActionError('')

    try {
      const response = await fetch(`${API_BASE_URL}/api/courses/${courseId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Unable to delete this course.')
      }
    } catch (error) {
      restoreCourse(course, courseIndex)
      setActionError(error instanceof Error ? error.message : 'Unable to delete this course.')
    } finally {
      setDeletingCourseId(null)
    }
  }

  return (
    <div className="min-h-screen bg-background text-text">
      <header className="border-b border-subtle-border bg-background">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-x-8 gap-y-4 px-4 py-5 sm:px-6 lg:px-8">
          <Link aria-label="Pyvot home" className="flex items-center" to="/">
            <img alt="Pyvot Logo" className="h-12 w-auto" src={pyvotLogo} />
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
          <h1 className="max-w-3xl text-4xl font-bold leading-tight text-primary sm:text-5xl" id="welcome-heading">
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
            {!isLoading && !errorMessage && (
              <p className="text-sm text-text">
                {courses.length} {courses.length === 1 ? 'course' : 'courses'} available
              </p>
            )}
          </div>

          {isLoading ? (
            <p className="rounded-2xl bg-subtle-card p-6 text-sm text-text" role="status">
              Loading courses…
            </p>
          ) : errorMessage ? (
            <p className="rounded-2xl bg-subtle-card p-6 text-sm text-text" role="alert">
              {errorMessage}
            </p>
          ) : courses.length === 0 ? (
            <p className="rounded-2xl bg-subtle-card p-6 text-sm text-text">
              No courses are available yet. Please check back soon.
            </p>
          ) : (
            <>
              {actionError && (
                <p className="mb-4 rounded-2xl bg-red-50 p-4 text-sm text-red-800" role="alert">
                  {actionError}
                </p>
              )}
              <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {courses.map((course) => (
                  <CourseCard
                    course={course}
                    deleting={String(deletingCourseId) === String(course.id)}
                    key={course.id}
                    onDelete={handleDelete}
                    onEdit={openEdit}
                  />
                ))}
              </ul>
            </>
          )}
        </section>
      </main>

      {editingCourse && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isSavingEdit) {
              setEditingCourse(null)
            }
          }}
        >
          <section
            aria-labelledby="edit-course-heading"
            aria-modal="true"
            className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl"
            role="dialog"
          >
            <h2 className="text-xl font-bold text-primary" id="edit-course-heading">Edit course</h2>
            <form className="mt-5 space-y-4" onSubmit={handleEditSubmit}>
              <label className="block text-sm font-semibold" htmlFor="edit-course-title">
                Course title
                <input
                  className="mt-1 block w-full rounded-xl border border-subtle-border px-4 py-3 font-normal"
                  id="edit-course-title"
                  maxLength="255"
                  onChange={(event) => setEditTitle(event.target.value)}
                  required
                  value={editTitle}
                />
              </label>
              <label className="block text-sm font-semibold" htmlFor="edit-course-description">
                Description
                <textarea
                  className="mt-1 block w-full rounded-xl border border-subtle-border px-4 py-3 font-normal"
                  id="edit-course-description"
                  onChange={(event) => setEditDescription(event.target.value)}
                  required
                  rows="4"
                  value={editDescription}
                />
              </label>
              <label className="block text-sm font-semibold" htmlFor="edit-course-thumbnail">
                Replace thumbnail (optional)
                <input
                  accept="image/jpeg,image/png,.jpg,.jpeg,.png"
                  className="mt-1 block w-full rounded-xl border border-subtle-border px-4 py-3 font-normal"
                  id="edit-course-thumbnail"
                  name="thumbnail"
                  type="file"
                />
              </label>
              {actionError && (
                <p className="rounded-xl bg-red-50 p-3 text-sm text-red-800" role="alert">
                  {actionError}
                </p>
              )}
              <div className="flex justify-end gap-3">
                <button
                  className="rounded-pill border border-subtle-border px-4 py-2 text-sm font-semibold"
                  disabled={isSavingEdit}
                  onClick={() => setEditingCourse(null)}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="rounded-pill bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  disabled={isSavingEdit}
                  type="submit"
                >
                  {isSavingEdit ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      <footer className="border-t border-subtle-border px-4 py-6 text-center text-sm text-text sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-7xl">Pyvot © 2026</div>
      </footer>
    </div>
  )
}

export default CatalogPage
