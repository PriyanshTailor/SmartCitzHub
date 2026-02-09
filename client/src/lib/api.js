import { getAuthToken } from './auth.js'

export async function apiFetch(path, options = {}) {
  const token = getAuthToken()
  const headers = {
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers || {}),
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  // Prepend API URL if appropriate
  const API_URL = import.meta.env.VITE_API_URL || ''
  const url = path.startsWith('http') ? path : `${API_URL}${path}`

  const response = await fetch(url, {
    ...options,
    headers,
  })

  const contentType = response.headers.get('content-type') || ''
  const data = contentType.includes('application/json') ? await response.json() : null

  if (!response.ok) {
    const error = new Error(data?.error || 'Request failed')
    error.status = response.status
    error.data = data
    throw error
  }

  return data
}
