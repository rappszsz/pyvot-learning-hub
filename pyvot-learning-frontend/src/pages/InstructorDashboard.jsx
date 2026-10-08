import { useEffect, useRef, useState } from 'react'

function InstructorDashboard() {
  const [materials, setMaterials] = useState([
    { id: 'react-intro', name: 'React intro.mp4', type: 'video' },
    { id: 'components', name: 'Components.mp4', type: 'video' },
  ])
  const downloadUrls = useRef(new Set())

  useEffect(
    () => () => {
      downloadUrls.current.forEach((url) => URL.revokeObjectURL(url))
    },
    [],
  )

  function handleUpload(event) {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)
    const uploads = [
      { file: formData.get('lesson-video'), type: 'video' },
      { file: formData.get('lesson-material'), type: 'pdf' },
    ].filter(({ file }) => file instanceof File && file.size > 0)

    if (!uploads.length) return

    setMaterials((currentMaterials) => [
      ...currentMaterials,
      ...uploads.map(({ file, type }) => {
        const url = type === 'pdf' ? URL.createObjectURL(file) : undefined
        if (url) downloadUrls.current.add(url)
        return { id: crypto.randomUUID(), name: file.name, type, url }
      }),
    ])
    form.reset()
  }

  return (
    <section>
      <h1 className="text-3xl font-bold">Instructor dashboard</h1>
      <p className="mt-2 text-slate-600">Upload and manage lesson videos and PDF materials.</p>

      <form
        className="mt-8 flex max-w-xl flex-col items-start gap-4 rounded border border-slate-200 bg-white p-5"
        onSubmit={handleUpload}
      >
        <label className="w-full text-sm font-medium">
          Lesson video
          <input
            accept="video/*"
            className="mt-2 block w-full text-sm"
            name="lesson-video"
            type="file"
          />
        </label>
        <label className="w-full text-sm font-medium">
          Lesson materials (PDF)
          <input
            accept="application/pdf,.pdf"
            className="mt-2 block w-full text-sm"
            name="lesson-material"
            type="file"
          />
        </label>
        <button
          className="rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
          type="submit"
        >
          Add materials
        </button>
      </form>

      <section className="mt-10 max-w-xl">
        <h2 className="text-xl font-semibold">Managed lessons</h2>
        <ul className="mt-4 divide-y divide-slate-200 border-y border-slate-200">
          {materials.map((material) => (
            <li key={material.id} className="flex items-center gap-3 py-3 text-sm">
              {material.type === 'video' ? (
                <svg aria-hidden="true" className="size-5 shrink-0 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                  <rect x="3" y="5" width="13" height="14" rx="2" />
                  <path d="m16 10 5-3v10l-5-3" />
                </svg>
              ) : (
                <svg aria-hidden="true" className="size-5 shrink-0 text-red-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                  <path d="M6 3h8l5 5v13H6z" />
                  <path d="M14 3v6h5M8 15h8M8 18h6" />
                </svg>
              )}
              {material.type === 'pdf' && material.url ? (
                <a className="min-w-0 truncate text-blue-700 hover:underline" href={material.url} download={material.name}>
                  {material.name} <span className="text-slate-500">(PDF download)</span>
                </a>
              ) : (
                <span className="min-w-0 truncate">{material.name}</span>
              )}
            </li>
          ))}
        </ul>
      </section>
    </section>
  )
}

export default InstructorDashboard