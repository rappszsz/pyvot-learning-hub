import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { API_BASE_URL } from '../lib/api.js'

function InstructorDashboard() {
  const [materials, setMaterials] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [editingMaterialId, setEditingMaterialId] = useState(null)
  const [editedTitle, setEditedTitle] = useState('')
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [deletingMaterialId, setDeletingMaterialId] = useState(null)

  useEffect(() => {
    const controller = new AbortController()

    async function loadMaterials() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/materials`, {
          signal: controller.signal,
        })
        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.message || 'Unable to load course materials.')
        }
        if (!Array.isArray(result.materials)) {
          throw new Error('The materials response was not in the expected format.')
        }

        setMaterials(result.materials)
      } catch (error) {
        if (!(error instanceof Error && error.name === 'AbortError')) {
          setErrorMessage(error instanceof Error ? error.message : 'Unable to load course materials.')
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    loadMaterials()
    return () => controller.abort()
  }, [])

  async function handleEditSubmit(event, material) {
    event.preventDefault()
    setErrorMessage('')
    setIsSavingEdit(true)

    try {
      const response = await fetch(`${API_BASE_URL}/api/materials/${material.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title: editedTitle }),
      })
      const result = await response.json()

      if (!response.ok) {
        const validationErrors = Object.values(result.errors ?? {}).flat()
        throw new Error(validationErrors.join(' ') || result.message || 'Unable to update this material.')
      }
      if (!result.material || typeof result.material.title !== 'string') {
        throw new Error('The material update response was not in the expected format.')
      }

      setMaterials((currentMaterials) =>
        currentMaterials.map((currentMaterial) =>
          currentMaterial.id === material.id ? result.material : currentMaterial,
        ),
      )
      setEditingMaterialId(null)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to update this material.')
    } finally {
      setIsSavingEdit(false)
    }
  }

  async function handleDelete(material) {
    if (!window.confirm(`Delete "${material.title}"? This cannot be undone.`)) {
      return
    }

    setErrorMessage('')
    setDeletingMaterialId(material.id)

    try {
      const response = await fetch(`${API_BASE_URL}/api/materials/${material.id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Unable to delete this material.')
      }

      setMaterials((currentMaterials) =>
        currentMaterials.filter((currentMaterial) => currentMaterial.id !== material.id),
      )
      if (editingMaterialId === material.id) {
        setEditingMaterialId(null)
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to delete this material.')
    } finally {
      setDeletingMaterialId(null)
    }
  }

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Instructor dashboard</h1>
          <p className="mt-2 text-slate-600">View and manage your course materials.</p>
        </div>
        <Link
          className="rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
          to="/instructor/upload"
        >
          Upload New Material
        </Link>
      </div>

      <section className="mt-10 max-w-3xl">
        <h2 className="text-xl font-semibold">Managed lessons</h2>

        {errorMessage && (
          <p className="mt-4 rounded border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">
            {errorMessage}
          </p>
        )}

        {isLoading ? (
          <p className="mt-4 py-3 text-sm text-slate-600" role="status">Loading course materials…</p>
        ) : materials.length === 0 ? (
          <p className="mt-4 py-3 text-sm text-slate-600">No course materials have been uploaded yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-200 border-y border-slate-200">
            {materials.map((material) => (
              <li key={material.id} className="flex flex-wrap items-center gap-3 py-3 text-sm">
                {material.mime_type.startsWith('video/') ? (
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

                {editingMaterialId === material.id ? (
                  <form
                    className="flex min-w-0 flex-1 flex-wrap items-center gap-2"
                    onSubmit={(event) => handleEditSubmit(event, material)}
                  >
                    <label className="sr-only" htmlFor={`material-title-${material.id}`}>Material title</label>
                    <input
                      autoFocus
                      className="min-w-40 flex-1 rounded border border-slate-300 px-3 py-2"
                      id={`material-title-${material.id}`}
                      maxLength="255"
                      onChange={(event) => setEditedTitle(event.target.value)}
                      required
                      value={editedTitle}
                    />
                    <button
                      className="rounded bg-slate-900 px-3 py-2 font-semibold text-white disabled:opacity-50"
                      disabled={isSavingEdit || deletingMaterialId !== null}
                      type="submit"
                    >
                      {isSavingEdit ? 'Saving…' : 'Save'}
                    </button>
                    <button
                      className="rounded border border-slate-300 px-3 py-2 font-semibold disabled:opacity-50"
                      disabled={isSavingEdit || deletingMaterialId !== null}
                      onClick={() => setEditingMaterialId(null)}
                      type="button"
                    >
                      Cancel
                    </button>
                  </form>
                ) : (
                  <>
                    <a
                      className="min-w-0 flex-1 truncate text-blue-700 hover:underline"
                      href={new URL(material.url, API_BASE_URL).toString()}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {material.title}
                    </a>
                    <button
                      className="rounded border border-slate-300 px-3 py-2 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                      disabled={isSavingEdit || deletingMaterialId !== null}
                      onClick={() => {
                        setEditedTitle(material.title)
                        setEditingMaterialId(material.id)
                        setErrorMessage('')
                      }}
                      type="button"
                    >
                      Edit
                    </button>
                    <button
                      className="rounded border border-red-200 px-3 py-2 font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                      disabled={isSavingEdit || deletingMaterialId !== null}
                      onClick={() => handleDelete(material)}
                      type="button"
                    >
                      {deletingMaterialId === material.id ? 'Deleting…' : 'Delete'}
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  )
}

export default InstructorDashboard
