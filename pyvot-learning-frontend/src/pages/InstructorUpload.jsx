import { useRef, useState } from 'react'

function FileDropzone({ accept, file, label, name, onChange, onDrop }) {
  const inputRef = useRef(null)

  function handleDrop(event) {
    event.preventDefault()
    const droppedFile = event.dataTransfer.files[0]
    if (droppedFile) onDrop(droppedFile)
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
          name={name}
          onChange={(event) => onChange(event.target.files[0] ?? null)}
          type="file"
        />
        <div aria-hidden="true" className="mx-auto mb-3 grid size-10 place-items-center rounded-full bg-[#f2eafa] text-primary">
          <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0L8 8m4-4 4 4M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" />
          </svg>
        </div>
        <p className="text-sm font-medium text-text">
          {file ? file.name : 'Drop a file here or'}{' '}
          {!file && (
            <button
              className="font-semibold text-primary underline decoration-primary/40 underline-offset-4 hover:decoration-primary"
              onClick={() => inputRef.current?.click()}
              type="button"
            >
              browse
            </button>
          )}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          {file ? `${(file.size / (1024 * 1024)).toFixed(1)} MB selected` : 'Choose a file from your device'}
        </p>
        {file && (
          <button
            className="mt-2 text-xs font-semibold text-primary hover:underline"
            onClick={() => {
              onChange(null)
              if (inputRef.current) inputRef.current.value = ''
            }}
            type="button"
          >
            Remove file
          </button>
        )}
      </div>
    </div>
  )
}

function InstructorUpload() {
  const [video, setVideo] = useState(null)
  const [pdf, setPdf] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setIsSubmitting(true)
    setSuccessMessage('')
    setErrorMessage('')

    const formData = new FormData(event.currentTarget)

    if (video) {
      formData.set('lessonVideo', video)
    } else {
      formData.delete('lessonVideo')
    }

    if (pdf) {
      formData.set('studyMaterial', pdf)
    } else {
      formData.delete('studyMaterial')
    }

    try {
      const response = await fetch('http://localhost:8000/api/courses', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      })
      const result = await response.json()

      if (!response.ok) {
        const validationErrors = Object.values(result.errors ?? {}).flat()
        throw new Error(validationErrors.join(' ') || result.message || 'Upload failed. Please try again.')
      }

      setSuccessMessage(result.message || 'Course material uploaded successfully.')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Upload failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleChange(setFile) {
    return (file) => {
      setFile(file)
      setSuccessMessage('')
      setErrorMessage('')
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
                  <span className="grid size-9 place-items-center rounded-full bg-[#f2eafa] text-sm font-bold text-primary">01</span>
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
              </section>

              <section className="rounded-2xl border border-subtle-border bg-white p-6 shadow-[0_12px_35px_rgba(61,40,72,0.05)] sm:p-8">
                <div className="mb-6 flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-full bg-[#f2eafa] text-sm font-bold text-primary">02</span>
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
                  accept="video/*"
                  file={video}
                  label="Video lesson"
                  name="lessonVideo"
                  onChange={handleChange(setVideo)}
                  onDrop={handleChange(setVideo)}
                />
                <FileDropzone
                  accept="application/pdf,.pdf"
                  file={pdf}
                  label="Study material (PDF)"
                  name="studyMaterial"
                  onChange={handleChange(setPdf)}
                  onDrop={handleChange(setPdf)}
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
                className="mt-6 w-full rounded-pill bg-primary px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#5b21b6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting ? 'Uploading...' : 'Save course material'}
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