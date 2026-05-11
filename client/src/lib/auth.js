const TOKEN_KEY = 'smartcitizen_token'
const USER_KEY = 'smartcitizen_user'

export function setAuthSession({ token, user }) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearAuthSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function getAuthUser() {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function isAdmin() {
  const user = getAuthUser()
  return user && (user.user_type === 'official' || user.user_type === 'admin')
}

export function isAuthenticated() {
  return !!getAuthToken()
}
