import { useState, useEffect } from 'react'
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Menu, X, BarChart3, FileText, Users, AlertCircle, LogOut, Home, Trash2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { clearAuthSession, isAdmin, isAuthenticated, getAuthUser } from '@/lib/auth'

const adminLinks = [
  { href: '/admin', label: 'Dashboard', icon: BarChart3, exact: true },
  { href: '/admin/reports', label: 'Reports', icon: FileText },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/waste', label: 'Waste Management', icon: Trash2 },
  { href: '/admin/moderation', label: 'Moderation', icon: AlertCircle },
]

export default function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const user = getAuthUser()

  useEffect(() => {
    // Check if user is authenticated and has admin access
    if (!isAuthenticated()) {
      navigate('/login')
    } else if (!isAdmin()) {
      // Redirect regular users to dashboard
      navigate('/dashboard')
    }
  }, [navigate])

  const handleLogout = () => {
    clearAuthSession()
    navigate('/')
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 md:hidden z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-card border-r border-border z-40 transform transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 md:static flex flex-col`}
      >
        <div className="py-3 px-7 border-b border-border">
          <img
            src="/logo_smartcitizen.png"
            alt="SmartCitizen"
            className="h-16 w-auto"
          />
          <p className="text-xs text-muted-foreground mt-1">Admin Panel</p>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {adminLinks.map((link) => {
            const Icon = link.icon
            const isActive = link.exact 
              ? location.pathname === link.href
              : location.pathname.startsWith(link.href)
            
            return (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Icon size={20} />
                <span>{link.label}</span>
              </Link>
            )
          })}
          
          <div className="h-px bg-border my-2"></div>
          
          <Link
            to="/dashboard"
            className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 transition-all"
          >
            <Home size={20} />
            <span>Citizen View</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-border">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Sign out</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to sign out of the admin panel?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white">
                  Yes, Logout
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-2 hover:bg-muted rounded-lg"
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <Link to="/dashboard/profile" className="flex items-center gap-4 ml-auto hover:bg-blue-200/50 p-2 rounded-lg transition-colors">
            <div className="text-right hidden md:block">
              <p className="text-sm font-medium">{user?.full_name || 'Admin'}</p>
              <p className="text-xs text-muted-foreground capitalize">{user?.user_type || 'official'}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
              {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'A'}
            </div>
          </Link>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
