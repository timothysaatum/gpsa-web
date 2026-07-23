import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  BarChart3, BookOpen, Briefcase, CalendarDays, FileText, Home, Image,
  LayoutDashboard, LogOut, Mail, Newspaper, ScrollText, Settings, Shield, Users,
} from 'lucide-react'
import gpsaLogo from '@/assets/gpsa-logo.jpg'
import { Button } from '@/components/ui'
import { useAuthStore } from '@/store/authStore'
import { cn, initials } from '@/utils'

type AdminNavLink = {
  to: string
  label: string
  icon: typeof BarChart3
  adminOnly?: boolean
}

const navGroups: { label: string; links: AdminNavLink[] }[] = [
  {
    label: 'Content',
    links: [
      { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/admin/home', label: 'Home Page', icon: Home },
      { to: '/admin/about', label: 'About Page', icon: FileText },
      { to: '/admin/leadership', label: 'Leadership', icon: Users },
      { to: '/admin/legacy', label: 'Past Leadership', icon: ScrollText },
      { to: '/admin/impact', label: 'Impact', icon: BarChart3 },
      { to: '/admin/governance', label: 'Documents & FAQs', icon: FileText },
      { to: '/admin/news', label: 'News', icon: Newspaper },
      { to: '/admin/events', label: 'Events', icon: CalendarDays },
      { to: '/admin/opportunities', label: 'Opportunities', icon: Briefcase },
      { to: '/admin/gallery', label: 'Gallery', icon: Image },
      { to: '/admin/contact', label: 'Contact Enquiries', icon: Mail },
    ],
  },
  {
    label: 'Services',
    links: [
      { to: '/admin/academics', label: 'Academics', icon: BookOpen },
      { to: '/admin/welfare', label: 'Welfare', icon: Shield },
    ],
  },
  {
    label: 'Administration',
    links: [
      { to: '/admin/users', label: 'Users', icon: Users, adminOnly: true },
      { to: '/admin/audit-logs', label: 'Audit Logs', icon: ScrollText, adminOnly: true },
      { to: '/admin/settings', label: 'Settings', icon: Settings, adminOnly: true },
    ],
  },
]

export function AdminLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const signOut = async () => {
    await logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-cream-dark lg:grid lg:grid-cols-[280px_1fr]">
      <aside className="sticky top-0 z-40 h-auto lg:h-screen border-b lg:border-b-0 lg:border-r border-cream-dark bg-white">
        <div className="h-16 lg:h-[76px] flex items-center justify-between px-5 border-b border-cream-dark">
          <Link to="/admin/dashboard" className="flex items-center gap-3">
            <img src={gpsaLogo} alt="GPSA-UDS" className="h-10 w-10 rounded-xl object-cover" />
            <div>
              <p className="font-display text-xl font-bold text-deep leading-none">Admin</p>
              <p className="text-[10px] font-800 uppercase tracking-widest text-muted mt-1">GPSA-UDS</p>
            </div>
          </Link>
          <Link to="/" className="lg:hidden text-xs font-700 text-green-700">Site</Link>
        </div>

        <nav className="flex gap-2 overflow-x-auto lg:block lg:overflow-visible p-3 lg:p-5 lg:space-y-7">
          {navGroups.map((group) => (
            <div key={group.label} className="flex lg:block gap-2 lg:space-y-2 shrink-0">
              <p className="hidden lg:block text-[10px] font-800 uppercase tracking-widest text-muted mb-2">{group.label}</p>
              {group.links.filter((link) => !link.adminOnly || user?.role === 'admin').map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) => cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-700 transition-colors whitespace-nowrap',
                    isActive ? 'bg-brand text-white' : 'text-green-800 hover:bg-cream-dark'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-cream-dark">
          <div className="h-16 lg:h-[76px] px-5 lg:px-8 flex items-center justify-between">
            <div>
              <p className="text-xs font-800 uppercase tracking-widest text-muted">Website administration</p>
              <h1 className="font-display text-2xl font-bold text-deep">Content Control Center</h1>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/" className="hidden sm:inline-flex text-sm font-700 text-green-700 hover:text-green-500">View site</Link>
              {user && (
                <div className="hidden md:flex items-center gap-2 rounded-xl bg-cream-dark px-3 py-2">
                  <span className="h-8 w-8 rounded-lg bg-brand text-white flex items-center justify-center text-xs font-800">{initials(user.full_name)}</span>
                  <div className="leading-tight">
                    <p className="text-sm font-700 text-deep">{user.full_name}</p>
                    <p className="text-[10px] font-800 uppercase tracking-widest text-muted">{user.role}</p>
                  </div>
                </div>
              )}
              <Button variant="ghost" size="sm" onClick={signOut} leftIcon={<LogOut className="h-4 w-4" />}>Sign out</Button>
            </div>
          </div>
        </header>

        <main className="p-5 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export function AdminPageHeader({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-7">
      <div>
        <h2 className="font-display text-4xl lg:text-5xl font-bold text-deep leading-tight">{title}</h2>
        {description && <p className="text-muted mt-2 max-w-2xl">{description}</p>}
      </div>
      {action}
    </div>
  )
}

export function AdminStatCard({ label, value, icon: Icon }: { label: string; value: number | string; icon: typeof BarChart3 }) {
  return (
    <div className="rounded-xl border border-cream-dark bg-white p-5 shadow-card">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-800 uppercase tracking-widest text-muted mb-2">{label}</p>
          <p className="font-display text-4xl font-bold text-deep leading-none">{value}</p>
        </div>
        <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center">
          <Icon className="h-5 w-5 text-green-700" />
        </div>
      </div>
    </div>
  )
}
