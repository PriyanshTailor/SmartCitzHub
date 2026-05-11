import { useState } from 'react'
import { Outlet, useNavigate, Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { clearAuthSession, getAuthUser } from '@/lib/auth'
import { Sidebar } from '@/components/layout/Sidebar'
import SmartChatbot from '@/components/SmartChatbot'

export default function DashboardLayout() {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const user = getAuthUser()

  const handleLogout = () => {
    clearAuthSession()
    navigate('/')
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} onLogout={handleLogout} />

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


          <Link to="/dashboard/profile" className="flex items-center gap-4 ml-auto p-2 rounded-lg hover:bg-blue-200/50 transition-colors">
            <div className="text-right hidden md:block">
              <p className="text-sm font-medium">{user?.full_name || 'User'}</p>
              <p className="text-xs text-muted-foreground capitalize">{user?.user_type || 'citizen'}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
              {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
            </div>
          </Link>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
        <SmartChatbot />
      </div>
    </div>
  )
}
