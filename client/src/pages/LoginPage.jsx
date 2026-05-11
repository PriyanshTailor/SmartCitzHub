import { Link } from 'react-router-dom'
import { SignInForm } from '@/components/auth/sign-in-form'

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img
            src="/logo_smartcitizen.png"
            alt="SmartCitizen"
            className="h-18 w-auto mx-auto mb-2"
          />
          <p className="text-muted-foreground">Making cities smarter, one report at a time</p>
        </div>

        <div className="bg-card rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-semibold mb-6 text-center">Welcome back</h2>
          <SignInForm />
        </div>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Need help?{' '}
          <Link to="#" className="text-primary hover:underline">
            Contact support
          </Link>
        </div>
      </div>
    </main>
  )
}
