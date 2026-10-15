import { useRef, useState } from 'react'
import { useCourseCatalog } from '../context/CourseContext.jsx'
import { API_BASE_URL, fetchWithCsrf } from '../lib/api.js'

function FileDropzone({ accept, files, label, name, onChange, onRemove }) {
  const inputRef = useRef(null)

  function handleDrop(event) {
    event.preventDefault()
    onChange(event.dataTransfer.files)
  }

  return (
    <div>
      <span className="mb-2 block text-sm font-semibold text-text">{label}</span>
      <div
        className="rounded-2xl border-2 border-dashed border-subtle-border bg-white px-5 py-6 text-center transition-colors hover:border-primary"
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          accept={accept}
          className="sr-only"
          multiple
          name={name}
          onChange={(event) => {
            onChange(event.target.files ?? [])
            event.target.value = ''
          }}
          type="file"
        />
        <div aria-hidden="true" className="mx-auto mb-3 grid size-10 place-items-center rounded-full bg-pink-100 text-primary">
          <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0L8 8m4-4 4 4M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" />
          </svg>
        </div>
        <p className="text-sm font-medium text-text">
          Drop files here or{' '}
          <button
            className="font-semibold text-primary underline decoration-primary/40 underline-offset-4 hover:decoration-primary"
            onClick={() => inputRef.current?.click()}
            type="button"
          >
            browse
          </button>
        </p>
        <p className="mt-1 text-xs text-slate-500">
          {files.length ? `${files.length} file${files.length === 1 ? '' : 's'} selected` : 'Choose one or more files from your device'}
        </p>
        {files.length > 0 && (
          <ul aria-label={`Selected ${label.toLowerCase()} files`} className="mt-4 max-h-40 space-y-2 overflow-y-auto text-left">
            {files.map((file, index) => (
              <li className="flex items-center justify-between gap-3 rounded-xl bg-background px-3 py-2 text-xs" key={`${file.name}-${file.lastModified}-${index}`}>
                <span className="min-w-0 flex-1 truncate" title={file.name}>
                  {file.name} <span className="text-slate-500">({(file.size / (1024 * 1024)).toFixed(1)} MB)</span>
                </span>
                <button
                  className="shrink-0 font-semibold text-primary hover:underline"
                  onClick={() => onRemove(index)}
                  type="button"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function InstructorUpload() {
  const { refreshCourses } = useCourseCatalog()
  const [videoFiles, setVideoFiles] = useState([])
  const [pdfFiles, setPdfFiles] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    const form = event.currentTarget
    setIsSubmitting(true)
    setSuccessMessage('')
    setErrorMessage('')

    const formData = new FormData(form)
    formData.delete('videos[]')
    formData.delete('pdfs[]')
    formData.delete('thumbnail')
    const thumbnail = form.elements.namedItem('thumbnail').files[0]
    if (thumbnail) {
      formData.append('thumbnail', thumbnail)
    }
    videoFiles.forEach((file) => formData.append('videos[]', file))
    pdfFiles.forEach((file) => formData.append('pdfs[]', file))

    try {
      const response = await fetchWithCsrf(`${API_BASE_URL}/api/courses`, {
        method: 'POST',
        body: formData,
      })
      const result = await response.json()

      if (!response.ok) {
        const validationErrors = Object.values(result.errors ?? {}).flat()
        throw new Error(validationErrors.join(' ') || result.message || 'Upload failed. Please try again.')
      }

      refreshCourses()
      setSuccessMessage(result.message || 'Course material uploaded successfully.')
      setVideoFiles([])
      setPdfFiles([])
      form.reset()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Upload failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleChange(setFiles) {
    return (newFiles) => {
      const incomingFiles = Array.from(newFiles)
      setFiles((previousFiles) => [...previousFiles, ...incomingFiles])
      setSuccessMessage('')
      setErrorMessage('')
    }
  }

  function handleRemove(setFiles) {
    return (indexToRemove) => {
      setFiles((previousFiles) => previousFiles.filter((_, index) => index !== indexToRemove))
    }
  }

  return (
    <section className="-mx-5 -my-10 min-h-[calc(100vh-73px)] bg-background px-5 py-10 sm:py-14">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-primary">Instructor studio</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#30263a] sm:text-4xl">Upload course material</h1>
          <p className="mt-3 max-w-2xl text-text/75">Add course details, shape a module, and attach the lesson files your learners need.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.9fr)]">
            <div className="space-y-6">
              <section className="rounded-2xl border border-subtle-border bg-white p-6 shadow-[0_12px_35px_rgba(61,40,72,0.05)] sm:p-8">
                <div className="mb-6 flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-full bg-pink-100 text-sm font-bold text-primary">01</span>
                  <div>
                    <h2 className="font-bold text-[#30263a]">Course details</h2>
                    <p className="text-sm text-slate-500">Set the title and overview.</p>
                  </div>
                </div>
                <label className="mb-5 block text-sm font-semibold text-text" htmlFor="course-title">
                  Course title
                  <input
                    className="mt-2 block w-full rounded-pill border border-subtle-border bg-background px-4 py-3 font-normal outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                    id="course-title"
                    name="courseTitle"
                    placeholder="e.g. Foundations of Product Design"
                    required
                  />
                </label>
                <label className="mb-5 block text-sm font-semibold text-text" htmlFor="course-track">
                  Category or track
                  <input
                    className="mt-2 block w-full rounded-pill border border-subtle-border bg-background px-4 py-3 font-normal outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                    id="course-track"
                    name="category_track"
                    placeholder="e.g. Product Design"
                  />
                </label>
                <label className="block text-sm font-semibold text-text" htmlFor="course-description">
                  Description
                  <textarea
                    className="mt-2 block min-h-28 w-full resize-y rounded-2xl border border-subtle-border bg-background px-4 py-3 font-normal outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                    id="course-description"
                    name="courseDescription"
                    placeholder="What will learners be able to do after this course?"
                    required
                    rows="4"
                  />
                </label>
                <label className="mt-5 block text-sm font-semibold text-text" htmlFor="course-thumbnail">
                  Course Thumbnail Image
                  <input
                    accept="image/jpeg,image/png,.jpg,.jpeg,.png"
                    className="mt-2 block w-full rounded-xl border border-subtle-border bg-background px-4 py-3 font-normal file:mr-4 file:rounded-pill file:border-0 file:bg-pink-100 file:px-4 file:py-2 file:font-semibold file:text-primary"
                    id="course-thumbnail"
                    name="thumbnail"
                    type="file"
                  />
                  <span className="mt-1 block text-xs font-normal text-slate-500">
                    JPG or PNG, up to 2 MB.
                  </span>
                </label>
              </section>

              <section className="rounded-2xl border border-subtle-border bg-white p-6 shadow-[0_12px_35px_rgba(61,40,72,0.05)] sm:p-8">
                <div className="mb-6 flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-full bg-pink-100 text-sm font-bold text-primary">02</span>
                  <div>
                    <h2 className="font-bold text-[#30263a]">Module details</h2>
                    <p className="text-sm text-slate-500">Give this learning section a clear focus.</p>
                  </div>
                </div>
                <label className="mb-5 block text-sm font-semibold text-text" htmlFor="module-title">
                  Module title
                  <input
                    className="mt-2 block w-full rounded-pill border border-subtle-border bg-background px-4 py-3 font-normal outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                    id="module-title"
                    name="moduleTitle"
                    placeholder="e.g. Research and discovery"
                    required
                  />
                </label>
                <label className="block text-sm font-semibold text-text" htmlFor="module-description">
                  Module description
                  <textarea
                    className="mt-2 block min-h-24 w-full resize-y rounded-2xl border border-subtle-border bg-background px-4 py-3 font-normal outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                    id="module-description"
                    name="moduleDescription"
                    placeholder="Briefly describe what this module covers."
                    required
                    rows="3"
                  />
                </label>
              </section>
            </div>

            <aside className="h-fit rounded-2xl border border-subtle-border bg-[#f8f0e8] p-6 sm:p-8">
              <div className="mb-6 flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-full bg-white text-sm font-bold text-primary">03</span>
                <div>
                  <h2 className="font-bold text-[#30263a]">Lesson files</h2>
                  <p className="text-sm text-slate-500">Add video and study materials.</p>
                </div>
              </div>
              <div className="space-y-5">
                <FileDropzone
                  accept="video/mp4,video/quicktime,video/x-msvideo,.mp4,.mov,.avi"
                  files={videoFiles}
                  label="Video lessons"
                  name="videos[]"
                  onChange={handleChange(setVideoFiles)}
                  onRemove={handleRemove(setVideoFiles)}
                />
                <FileDropzone
                  accept="application/pdf,.pdf"
                  files={pdfFiles}
                  label="Study materials (PDF)"
                  name="pdfs[]"
                  onChange={handleChange(setPdfFiles)}
                  onRemove={handleRemove(setPdfFiles)}
                />
              </div>
              {successMessage && (
                <p aria-live="polite" className="mt-5 rounded-xl bg-white px-4 py-3 text-sm font-medium text-green-800">
                  {successMessage}
                </p>
              )}
              {errorMessage && (
                <p aria-live="assertive" className="mt-5 rounded-xl bg-white px-4 py-3 text-sm font-medium text-red-700" role="alert">
                  {errorMessage}
                </p>
              )}
              <button
                className="mt-6 w-full rounded-pill bg-primary px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-pink-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting ? 'Uploading...' : 'Save course'}
              </button>
              <p className="mt-3 text-center text-xs text-slate-500">Your lesson files will be uploaded to the course storage.</p>
            </aside>
          </div>
        </form>
      </div>
    </section>
  )
}

export default InstructorUpload