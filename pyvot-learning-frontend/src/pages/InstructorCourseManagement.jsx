import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useCourseCatalog } from '../context/CourseContext.jsx'
import { API_BASE_URL, fetchWithCsrf } from '../lib/api.js'

async function readResponse(response, fallbackMessage) {
  const result = await response.json()

  if (!response.ok) {
    const validationErrors = Object.values(result.errors ?? {}).flat()
    throw new Error(validationErrors.join(' ') || result.message || fallbackMessage)
  }

  return result
}

function InstructorCourseManagement() {
  const { courseId } = useParams()
  const {
    courses,
    isLoading,
    errorMessage,
    updateCourse,
    addCourseMaterials,
    updateCourseMaterial,
    removeCourseMaterial,
  } = useCourseCatalog()
  const course = courses.find((item) => String(item.id) === courseId)
  const [isEditingCourse, setIsEditingCourse] = useState(false)
  const [courseTitle, setCourseTitle] = useState('')
  const [courseDescription, setCourseDescription] = useState('')
  const [videoFiles, setVideoFiles] = useState([])
  const [pdfFiles, setPdfFiles] = useState([])
  const [editingMaterialId, setEditingMaterialId] = useState(null)
  const [editedMaterialTitle, setEditedMaterialTitle] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [deletingMaterialId, setDeletingMaterialId] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  if (isLoading) {
    return <p className="py-8 text-sm text-slate-600" role="status">Loading course…</p>
  }

  if (errorMessage) {
    return <p className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">{errorMessage}</p>
  }

  if (!course) return <Navigate replace to="/" />

  const posterUrl = course.thumbnail
    ? new URL(`/storage/${course.thumbnail}`, API_BASE_URL).toString()
    : undefined

  function openCourseEditor() {
    setCourseTitle(course.title)
    setCourseDescription(course.description)
    setVideoFiles([])
    setPdfFiles([])
    setError('')
    setNotice('')
    setIsEditingCourse(true)
  }

  async function handleCourseSubmit(event) {
    event.preventDefault()
    setIsSaving(true)
    setError('')
    setNotice('')

    try {
      if (courseTitle !== course.title || courseDescription !== course.description) {
        const response = await fetchWithCsrf(`${API_BASE_URL}/api/courses/${course.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: courseTitle, description: courseDescription }),
        })
        const result = await readResponse(response, 'Unable to update this course.')

        if (!result.course) {
          throw new Error('The course update response was not in the expected format.')
        }

        updateCourse(course.id, result.course)
      }

      if (videoFiles.length > 0 || pdfFiles.length > 0) {
        const formData = new FormData()
        videoFiles.forEach((file) => formData.append('videos[]', file))
        pdfFiles.forEach((file) => formData.append('pdfs[]', file))

        const response = await fetchWithCsrf(`${API_BASE_URL}/api/courses/${course.id}/materials`, {
          method: 'POST',
          body: formData,
        })
        const result = await readResponse(response, 'Unable to add course materials.')

        if (!Array.isArray(result.materials)) {
          throw new Error('The course materials response was not in the expected format.')
        }

        addCourseMaterials(course.id, result.materials)
      }

      setVideoFiles([])
      setPdfFiles([])
      setIsEditingCourse(false)
      setNotice('Course changes saved.')
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to save course changes.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleMaterialTitleSubmit(event, material) {
    event.preventDefault()
    setIsSaving(true)
    setError('')
    setNotice('')

    try {
      const response = await fetchWithCsrf(`${API_BASE_URL}/api/materials/${material.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editedMaterialTitle }),
      })
      const result = await readResponse(response, 'Unable to update this material.')

      if (!result.material) {
        throw new Error('The material update response was not in the expected format.')
      }

      updateCourseMaterial(course.id, result.material)
      setEditingMaterialId(null)
      setNotice('Material title updated.')
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to update this material.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleMaterialDelete(material) {
    if (!window.confirm(`Delete "${material.title}"? This cannot be undone.`)) {
      return
    }

    setDeletingMaterialId(material.id)
    setError('')
    setNotice('')

    try {
      const response = await fetchWithCsrf(`${API_BASE_URL}/api/materials/${material.id}`, {
        method: 'DELETE',
      })
      await readResponse(response, 'Unable to delete this material.')
      removeCourseMaterial(course.id, material.id)
      setNotice(`"${material.title}" was deleted.`)
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete this material.')
    } finally {
      setDeletingMaterialId(null)
    }
  }

  return (
    <article>
      <Link className="text-sm font-semibold text-blue-700 hover:underline" to="/">
        Back to courses
      </Link>
      {course.category_track && (
        <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-slate-500">
          {course.category_track}
        </p>
      )}
      <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">{course.title}</h1>
        <button
          className="rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
          onClick={openCourseEditor}
          type="button"
        >
          Edit Course
        </button>
      </div>
      <p className="mt-3 text-slate-600">{course.description}</p>

      {error && (
        <p className="mt-5 rounded border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p aria-live="polite" className="mt-5 rounded border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          {notice}
        </p>
      )}

      {isEditingCourse && (
        <form className="mt-6 space-y-4 rounded border border-slate-200 bg-slate-50 p-5" onSubmit={handleCourseSubmit}>
          <h2 className="text-lg font-semibold">Edit course and add materials</h2>
          <label className="block text-sm font-semibold" htmlFor="edit-course-title">
            Course title
            <input
              className="mt-1 block w-full rounded border border-slate-300 bg-white px-3 py-2 font-normal"
              id="edit-course-title"
              maxLength="255"
              onChange={(event) => setCourseTitle(event.target.value)}
              required
              value={courseTitle}
            />
          </label>
          <label className="block text-sm font-semibold" htmlFor="edit-course-description">
            Description
            <textarea
              className="mt-1 block w-full rounded border border-slate-300 bg-white px-3 py-2 font-normal"
              id="edit-course-description"
              onChange={(event) => setCourseDescription(event.target.value)}
              required
              rows="4"
              value={courseDescription}
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold" htmlFor="add-videos">
              Add videos
              <input
                accept="video/mp4,video/quicktime,video/x-msvideo,.mp4,.mov,.avi"
                className="mt-1 block w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm font-normal"
                id="add-videos"
                multiple
                onChange={(event) => setVideoFiles(Array.from(event.target.files ?? []))}
                type="file"
              />
            </label>
            <label className="block text-sm font-semibold" htmlFor="add-pdfs">
              Add PDFs
              <input
                accept="application/pdf,.pdf"
                className="mt-1 block w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm font-normal"
                id="add-pdfs"
                multiple
                onChange={(event) => setPdfFiles(Array.from(event.target.files ?? []))}
                type="file"
              />
            </label>
          </div>
          <p className="text-sm text-slate-600">
            Remove existing files using the Delete button on each material below.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              className="btn-primary text-sm disabled:opacity-50"
              disabled={isSaving}
              type="submit"
            >
              {isSaving ? 'Saving…' : 'Save Changes'}
            </button>
            <button
              className="rounded border border-slate-300 px-4 py-2 text-sm font-semibold disabled:opacity-50"
              disabled={isSaving}
              onClick={() => setIsEditingCourse(false)}
              type="button"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <section className="mt-10" aria-labelledby="course-materials-heading">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-xl font-semibold" id="course-materials-heading">Lessons and study materials</h2>
          <p className="text-sm text-slate-500">
            {course.materials.length} {course.materials.length === 1 ? 'item' : 'items'}
          </p>
        </div>

        {course.materials.length === 0 ? (
          <p className="mt-4 rounded bg-slate-50 p-5 text-sm text-slate-600">
            Materials for this course have not been added yet.
          </p>
        ) : (
          <ol className="mt-4 space-y-6">
            {course.materials.map((material, index) => {
              const materialUrl = new URL(`/storage/${material.path}`, API_BASE_URL).toString()
              const isVideo = material.mime_type.startsWith('video/')
              const isEditingMaterial = String(editingMaterialId) === String(material.id)

              return (
                <li className="rounded border border-slate-200 bg-white p-4 sm:p-6" key={material.id}>
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <span aria-hidden="true" className="pt-0.5 text-sm font-semibold text-slate-500">
                        {index + 1}.
                      </span>
                      <div className="min-w-0">
                        {isEditingMaterial ? (
                          <form
                            className="flex flex-wrap gap-2"
                            onSubmit={(event) => handleMaterialTitleSubmit(event, material)}
                          >
                            <label className="sr-only" htmlFor={`material-title-${material.id}`}>
                              Material title
                            </label>
                            <input
                              autoFocus
                              className="min-w-48 rounded border border-slate-300 px-3 py-2 text-sm"
                              id={`material-title-${material.id}`}
                              maxLength="255"
                              onChange={(event) => setEditedMaterialTitle(event.target.value)}
                              required
                              value={editedMaterialTitle}
                            />
                            <button
                              className="rounded bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                              disabled={isSaving}
                              type="submit"
                            >
                              {isSaving ? 'Saving…' : 'Save'}
                            </button>
                            <button
                              className="rounded border border-slate-300 px-3 py-2 text-sm font-semibold"
                              onClick={() => setEditingMaterialId(null)}
                              type="button"
                            >
                              Cancel
                            </button>
                          </form>
                        ) : (
                          <h3 className="font-semibold">
                            {isVideo ? (
                              <Link
                                className="hover:text-blue-700 hover:underline"
                                to={`/courses/${course.id}/lessons/${material.id}`}
                              >
                                {material.title}
                              </Link>
                            ) : material.title}
                          </h3>
                        )}
                        <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          {isVideo ? 'Video lesson' : 'PDF study material'}
                        </p>
                      </div>
                    </div>
                    {!isEditingMaterial && (
                      <div className="flex shrink-0 gap-2">
                        <button
                          className="rounded border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
                          disabled={isSaving || deletingMaterialId !== null}
                          onClick={() => {
                            setEditedMaterialTitle(material.title)
                            setEditingMaterialId(material.id)
                            setError('')
                            setNotice('')
                          }}
                          type="button"
                        >
                          Edit
                        </button>
                        <button
                          className="rounded border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                          disabled={isSaving || deletingMaterialId !== null}
                          onClick={() => handleMaterialDelete(material)}
                          type="button"
                        >
                          {deletingMaterialId === material.id ? 'Deleting…' : 'Delete'}
                        </button>
                      </div>
                    )}
                  </div>

                  {isVideo ? (
                    <video className="aspect-video w-full rounded bg-slate-950" controls muted={false} poster={posterUrl} preload="metadata">
                      <source src={materialUrl} type={material.mime_type} />
                      Your browser does not support video playback.
                    </video>
                  ) : (
                    <div>
                      <iframe
                        className="h-[32rem] w-full rounded border border-slate-200"
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

export default InstructorCourseManagement
