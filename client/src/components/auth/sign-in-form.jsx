import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { apiFetch } from '@/lib/api'
import { setAuthSession } from '@/lib/auth'

export function SignInForm() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSignIn = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const data = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      setAuthSession({ token: data.token, user: data.user })
      
      // Redirect based on user type
      if (data.user.user_type === 'official' || data.user.user_type === 'admin') {
        navigate('/admin')
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      setError(err?.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSignIn} className="space-y-4 w-full max-w-md">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
        />
      </div>

      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
        />
      </div>

      {error && (
        <div className="p-3 bg-destructive/20 text-destructive text-sm rounded-md">
          {error}
        </div>
      )}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Signing in...' : 'Sign In'}
      </Button>
    </form>
  )
}
