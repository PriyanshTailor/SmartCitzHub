import { Link } from 'react-router-dom'
import { SignUpForm } from '@/components/auth/sign-up-form'

export default function SignupPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img
            src="/logo_smartcitizen.png"
            alt="SmartCitizen"
            className="h-18 w-auto mx-auto mb-2"
          />
          <p className="text-muted-foreground">Join our community. Make your city smarter.</p>
        </div>

        <div className="bg-card rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-semibold mb-6 text-center">Create your account</h2>
          <SignUpForm />
        </div>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          By signing up, you agree to our{' '}
          <Link to="#" className="text-primary hover:underline">
            Terms of Service
          </Link>
          {' '}and{' '}
          <Link to="#" className="text-primary hover:underline">
            Privacy Policy
          </Link>
        </div>
      </div>
    </main>
  )
}
