import { Link, useLocation } from 'react-router-dom'
import {
    LayoutDashboard,
    FileText,
    Map,
    Users,
    Trash2,
    Lightbulb,
    MessageSquare,
    Bell,
    LogOut,
    Menu,
    X,
    ShieldCheck,
    Bus
} from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import { clearAuthSession, getAuthUser, isAdmin } from '@/lib/auth'

export function Sidebar({ open, setOpen, onLogout }) {
    const user = getAuthUser()
    const showAdminLink = isAdmin()

    return (
        <>
            {/* Mobile Overlay */}
            {open && (
                <div
                    className="fixed inset-0 bg-black/50 md:hidden z-30"
                    onClick={() => setOpen(false)}
                />
            )}

            <aside
                className={`fixed left-0 top-0 h-screen w-64 bg-card border-r border-border z-40 transform transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full'
                    } md:translate-x-0 md:static flex flex-col`}
            >
                <Link to="/dashboard" className="py-3 px-7 border-b border-border block hover:opacity-80 transition-opacity">
                    <img
                        src="/logo_smartcitizen.png"
                        alt="SmartCitizen"
                        className="h-16 w-auto"
                    />
                </Link>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {showAdminLink && (
                        <>
                            <Link
                                to="/admin"
                                className="flex items-center gap-3 px-4 py-3 mb-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium hover:from-blue-700 hover:to-blue-800 transition-all"
                            >
                                <ShieldCheck size={20} />
                                Admin Panel
                            </Link>
                            <div className="h-px bg-border my-2"></div>
                        </>
                    )}
                    <SidebarLink to="/dashboard" label="Dashboard" icon={<LayoutDashboard size={20} />} exact />
                    <SidebarLink to="/dashboard/reports" label="My Reports" icon={<FileText size={20} />} />
                    <SidebarLink to="/dashboard/map" label="City Map" icon={<Map size={20} />} />
                    <SidebarLink to="/dashboard/crowd-insights" label="Crowd Insights" icon={<Users size={20} />} />
                    <SidebarLink to="/dashboard/transit" label="Transit System" icon={<Bus size={20} />} />
                    <SidebarLink to="/dashboard/waste-management" label="Waste Management" icon={<Trash2 size={20} />} />
                    <SidebarLink to="/dashboard/initiatives" label="Initiatives" icon={<Lightbulb size={20} />} />
                    <SidebarLink to="/dashboard/community" label="Community" icon={<MessageSquare size={20} />} />
                    <SidebarLink to="/dashboard/notifications" label="Notifications" icon={<Bell size={20} />} />
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
                                    Are you sure you want to sign out of your account?
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={onLogout} className="bg-red-600 hover:bg-red-700 text-white">
                                    Yes, Logout
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </aside>
        </>
    )
}

function SidebarLink({ to, label, icon, exact }) {
    const location = useLocation()
    const isActive = exact
        ? location.pathname === to
        : location.pathname.startsWith(to)

    return (
        <Link
            to={to}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
        >
            {icon}
            {label}
        </Link>
    )
}
