import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { apiFetch } from '@/lib/api'
import { setAuthSession } from '@/lib/auth'

export function SignUpForm() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [userType, setUserType] = useState('citizen')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [retryCountdown, setRetryCountdown] = useState(0)

  const handleSignUp = async (e) => {
    e.preventDefault()
    setError(null)

    if (retryCountdown > 0) {
      setError(`Please wait ${retryCountdown} seconds before trying again.`)
      return
    }

    if (!fullName.trim()) {
      setError('Full name is required')
      return
    }

    if (!email.trim()) {
      setError('Email is required')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      const data = await apiFetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          fullName,
          role: userType,
        }),
      })

      if (data?.token) {
        setAuthSession({ token: data.token, user: data.user })
      }

      // Redirect based on user type
      if (data.user.user_type === 'official' || data.user.user_type === 'admin') {
        navigate('/admin')
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      if (err?.status === 429) {
        setRetryCountdown(60)
        const interval = setInterval(() => {
          setRetryCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(interval)
              return 0
            }
            return prev - 1
          })
        }, 1000)
      }
      setError(err?.message || 'An error occurred during signup')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSignUp} className="space-y-4 w-full max-w-md">
      <div>
        <Label htmlFor="fullName">Full Name</Label>
        <Input
          id="fullName"
          type="text"
          placeholder="Your full name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          disabled={loading}
        />
      </div>

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
          minLength={6}
        />
      </div>

      <div>
        <Label htmlFor="userType">I am a</Label>
        <select
          id="userType"
          value={userType}
          onChange={(e) => setUserType(e.target.value)}
          disabled={loading}
          className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
        >
          <option value="citizen">Citizen</option>
          <option value="official">City Official</option>
        </select>
      </div>

      {error && (
        <div className="p-3 bg-destructive/20 text-destructive text-sm rounded-md border border-destructive/30">
          <p className="font-medium mb-2">{error}</p>
          {error.includes('wait') && retryCountdown > 0 && (
            <p className="text-xs opacity-90 mt-2">
              Retry available in {retryCountdown}s
            </p>
          )}
        </div>
      )}

      <Button
        type="submit"
        disabled={loading || retryCountdown > 0}
        className="w-full"
      >
        {loading ? 'Creating account...' : retryCountdown > 0 ? `Wait ${retryCountdown}s` : 'Sign Up'}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <a href="/login" className="text-primary hover:underline">
          Sign in
        </a>
      </p>
    </form>
  )
}
