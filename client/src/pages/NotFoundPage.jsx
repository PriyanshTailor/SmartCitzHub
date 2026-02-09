import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 text-center">
      <h1 className="text-6xl font-bold mb-4">404</h1>
      <p className="text-muted-foreground mb-6">The page you are looking for does not exist.</p>
      <Link to="/">
        <Button>Return Home</Button>
      </Link>
    </div>
  )
}
