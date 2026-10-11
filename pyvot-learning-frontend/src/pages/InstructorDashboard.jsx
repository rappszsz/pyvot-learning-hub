import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCourseCatalog } from '../context/CourseContext.jsx'
import { API_BASE_URL, fetchWithCsrf } from '../lib/api.js'

function InstructorDashboard() {
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
      const response = await fetchWithCsrf(`${API_BASE_URL}/api/courses/${editingCourse.id}`, {
        method: 'POST',
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

    if (!course) return

    removeCourse(courseId)
    setDeletingCourseId(courseId)
    setActionError('')

    try {
      const response = await fetchWithCsrf(`${API_BASE_URL}/api/courses/${courseId}`, {
        method: 'DELETE',
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
    <section>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Instructor studio</p>
          <h1 className="mt-2 text-3xl font-bold">Course management</h1>
          <p className="mt-2 text-slate-600">Create, edit, and manage your courses and learning materials.</p>
        </div>
        <Link
          className="rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
          to="/instructor/courses/create"
        >
          Create a course
        </Link>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link className="text-sm font-semibold text-blue-700 hover:underline" to="/instructor/materials">
          Manage all materials
        </Link>
      </div>

      {actionError && (
        <p className="mt-5 rounded border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">
          {actionError}
        </p>
      )}
      {isLoading ? (
        <p className="mt-6 py-3 text-sm text-slate-600" role="status">Loading courses…</p>
      ) : errorMessage ? (
        <p className="mt-6 rounded border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">{errorMessage}</p>
      ) : courses.length === 0 ? (
        <p className="mt-6 rounded bg-slate-50 p-5 text-sm text-slate-600">No courses have been created yet.</p>
      ) : (
        <ul className="mt-6 divide-y divide-slate-200 border-y border-slate-200">
          {courses.map((course) => (
            <li className="flex flex-wrap items-center justify-between gap-4 py-5" key={course.id}>
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold">{course.title}</h2>
                <p className="mt-1 line-clamp-2 text-sm text-slate-600">{course.description}</p>
                <p className="mt-2 text-xs text-slate-500">
                  {course.materials.length} {course.materials.length === 1 ? 'material' : 'materials'}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  className="rounded border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-50"
                  to={`/instructor/courses/${course.id}`}
                >
                  Manage materials
                </Link>
                <button
                  className="rounded border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-50"
                  onClick={() => openEdit(course)}
                  type="button"
                >
                  Edit
                </button>
                <button
                  className="rounded border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                  disabled={deletingCourseId !== null}
                  onClick={() => {
                    if (window.confirm(`Delete "${course.title}"? This cannot be undone.`)) {
                      handleDelete(course.id)
                    }
                  }}
                  type="button"
                >
                  {String(deletingCourseId) === String(course.id) ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editingCourse && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isSavingEdit) setEditingCourse(null)
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
              {actionError && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-800" role="alert">{actionError}</p>}
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
    </section>
  )
}

export default InstructorDashboard
