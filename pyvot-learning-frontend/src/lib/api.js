export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/+$/, '')

export async function fetchWithCsrf(url, options = {}) {
  const csrfResponse = await fetch(`${API_BASE_URL}/api/auth/csrf`, {
    credentials: 'include',
    headers: { Accept: 'application/json' },
  })
  const csrfResult = await csrfResponse.json()

  if (!csrfResponse.ok || typeof csrfResult.token !== 'string') {
    throw new Error(csrfResult.message || 'Unable to start a secure request.')
  }

  const headers = new Headers(options.headers)
  headers.set('Accept', 'application/json')
  headers.set('X-CSRF-TOKEN', csrfResult.token)

  return fetch(url, {
    ...options,
    credentials: 'include',
    headers,
  })
}
