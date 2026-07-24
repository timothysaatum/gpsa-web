import { useState, useEffect, useRef } from 'react'
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  Menu, X, Bell, ChevronDown, ChevronRight, LogOut, User, Settings,
  BookOpen, Calendar, Heart, Briefcase, Award,
  Info, Image, Mail, Newspaper, GraduationCap, LayoutDashboard, Sparkles, MapPin, Phone, ArrowUpToLine
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { notificationsApi } from '@/api/services'
import gpsaLogo from '@/assets/gpsa-logo.jpg'
import { useAuthStore } from '@/store/authStore'
import { Button, Badge } from '@/components/ui'
import { cn, initials } from '@/utils'

// ── Nav Structure Definition ──────────────────────────────────────────────────

interface SubChildItem {
  to: string
  label: string
}

interface NavSubItem {
  to: string
  label: string
  description?: string
  subItems?: SubChildItem[]
}

interface NavItem {
  to?: string
  label: string
  exact?: boolean
  icon?: React.ComponentType<{ className?: string }>
  children?: NavSubItem[]
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Home', exact: true },
  { to: '/academics', label: 'Academics', icon: BookOpen },
  { to: '/events', label: 'Events', icon: Calendar },
  { to: '/news', label: 'News', icon: Newspaper },
  { to: '/opportunities', label: 'Opportunities', icon: Briefcase },
  { to: '/welfare', label: 'Welfare', icon: Heart },
  {
    label: 'About',
    to: '/about',
    icon: Info,
    children: [
      { to: '/about', label: 'Overview', description: 'Explore our departmental mission & vision' },
      { to: '/about/history', label: 'History & Legacy', description: 'Our origins and milestone journey' },
      { to: '/about/leadership', label: 'Leadership & Governance', description: 'Current executive committee & leaders' },
      { to: '/about/legacy', label: 'Past Leadership & Recognition', description: 'Former executive teams & honor roll' },
      { to: '/about/impact', label: 'Impact & Strategic Priorities', description: 'Key pillars and strategic roadmap' },
      { to: '/about/governance', label: 'Documents & FAQs', description: 'Official resources, governance documents & answers' },
    ],
  },
  { to: '/gallery', label: 'Gallery', icon: Image },
  {
    label: 'Alumni',
    to: '/alumni',
    icon: GraduationCap,
    children: [
      { to: '/alumni', label: 'Overview', description: 'GPSA-UDS Alumni Network hub' },
      {
        to: '/alumni/directory',
        label: 'Directory',
        description: 'Connect with alumni across sectors',
        subItems: [{ to: '/alumni/directory/profile', label: 'Alumni Profile' }],
      },
      {
        to: '/alumni/stories',
        label: 'Stories',
        description: 'Spotlights and career journeys',
        subItems: [{ to: '/alumni/stories/spotlight', label: 'Full Spotlight Story' }],
      },
      { to: '/alumni/recognition', label: 'Recognition', description: 'Distinguished alumni awards' },
      { to: '/alumni/mentorship', label: 'Mentorship', description: 'Student-alumni mentorship portal' },
      { to: '/alumni/give-back', label: 'Give Back', description: 'Support student initiatives & endowments' },
      {
        to: '/alumni/classes',
        label: 'Classes',
        description: 'Explore graduating year group pages',
        subItems: [{ to: '/alumni/classes/class', label: 'Individual Class Page' }],
      },
      { to: '/alumni/join', label: 'Join Network', description: 'Register as a GPSA-UDS alumnus' },
    ],
  },
  { to: '/contact', label: 'Contact', icon: Mail },
]

// ── Navbar Component ──────────────────────────────────────────────────────────

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [mobileExpanded, setMobileExpanded] = useState<Record<string, boolean>>({})
  const [scrolled, setScrolled] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Unread notification count
  const { data: notifData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationsApi.list({ unread_only: true, limit: 1 }),
    enabled: isAuthenticated,
    refetchInterval: 60_000,
  })
  const unreadCount = notifData?.total ?? 0

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close dropdowns on route change or outside click
  useEffect(() => {
    setActiveDropdown(null)
    setMobileOpen(false)
    setProfileOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const handler = () => {
      setProfileOpen(false)
      setActiveDropdown(null)
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const handleMouseEnter = (label: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setActiveDropdown(label)
  }

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setActiveDropdown(null)
    }, 150)
  }

  const toggleMobileSubmenu = (label: string) => {
    setMobileExpanded((prev) => ({ ...prev, [label]: !prev[label] }))
  }

  const isNavItemActive = (item: NavItem) => {
    if (item.to) {
      if (item.exact) return location.pathname === item.to
      if (location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to))) {
        return true
      }
    }
    if (item.children) {
      return item.children.some(
        (child) =>
          location.pathname === child.to ||
          (child.to !== '/' && location.pathname.startsWith(child.to)) ||
          child.subItems?.some((sub) => location.pathname === sub.to || location.pathname.startsWith(sub.to))
      )
    }
    return false
  }

  return (
    <header
      className={cn(
        'sticky top-0 z-[100] transition-all duration-200',
        scrolled
          ? 'bg-white/95 backdrop-blur-md border-b border-cream-dark shadow-card'
          : 'bg-white border-b border-cream-dark'
      )}
    >
      <div className="section-container">
        <div className="flex items-center justify-between h-16 lg:h-[72px]">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group flex-shrink-0">
            <div className="w-10 h-10 lg:w-11 lg:h-11 rounded-full overflow-hidden shadow-card group-hover:shadow-card-md transition-shadow border-2 border-green-500/20">
              <img src={gpsaLogo} alt="GPSA-UDS Logo" className="w-full h-full object-cover" />
            </div>
            <div className="hidden sm:block leading-none">
              <p className="font-display font-700 text-lg text-green-500 leading-tight">GPSA-UDS</p>
              <p className="text-[10px] text-green-700 font-body tracking-wide uppercase">
                Pharmacy Students' Assoc.
              </p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            {NAV_ITEMS.map((item) => {
              const active = isNavItemActive(item)
              const hasDropdown = Boolean(item.children?.length)

              if (!hasDropdown && item.to) {
                return (
                  <NavLink
                    key={item.label}
                    to={item.to}
                    end={item.exact}
                    className={({ isActive }) =>
                      cn(
                        'px-3.5 py-2 rounded-xl text-sm font-body font-500 transition-all duration-150',
                        isActive
                          ? 'bg-green-gradient text-white shadow-sm'
                          : 'text-green-800 hover:bg-green-50 hover:text-green-700'
                      )
                    }
                  >
                    {item.label}
                  </NavLink>
                )
              }

              return (
                <div
                  key={item.label}
                  className="relative"
                  onMouseEnter={() => handleMouseEnter(item.label)}
                  onMouseLeave={handleMouseLeave}
                >
                  <button
                    onClick={() => setActiveDropdown(activeDropdown === item.label ? null : item.label)}
                    className={cn(
                      'flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-body font-500 transition-all duration-150',
                      active || activeDropdown === item.label
                        ? 'bg-green-50 text-green-700 font-600'
                        : 'text-green-800 hover:bg-green-50 hover:text-green-700'
                    )}
                  >
                    <span>{item.label}</span>
                    <ChevronDown
                      className={cn(
                        'h-3.5 w-3.5 transition-transform duration-200',
                        activeDropdown === item.label && 'rotate-180 text-green-700'
                      )}
                    />
                  </button>

                  {/* Mega Dropdown Panel */}
                  {activeDropdown === item.label && item.children && (
                    <div
                      className={cn(
                        'absolute top-full mt-2 bg-white/95 backdrop-blur-xl border border-green-900/10 shadow-2xl rounded-2xl p-4 animate-in fade-in slide-in-from-top-2 duration-200 z-50',
                        item.label === 'Alumni' ? 'right-0 w-[540px] grid grid-cols-2 gap-3' : 'left-0 w-[440px] grid grid-cols-2 gap-2.5'
                      )}
                    >
                      {item.children.map((child) => (
                        <div key={child.label} className="flex flex-col">
                          <Link
                            to={child.to}
                            onClick={() => setActiveDropdown(null)}
                            className="group flex flex-col p-2.5 rounded-xl hover:bg-green-50/80 transition-all border border-transparent hover:border-green-200/50"
                          >
                            <span className="text-sm font-600 text-green-900 group-hover:text-green-700 flex items-center justify-between">
                              {child.label}
                              <ChevronRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all text-green-600" />
                            </span>
                            {child.description && (
                              <span className="text-[11px] text-gray-500 group-hover:text-green-800/70 mt-0.5 line-clamp-1 font-body">
                                {child.description}
                              </span>
                            )}
                          </Link>

                          {/* Sub-items if available (e.g. Alumni Profile, Spotlight Story, Class Page) */}
                          {child.subItems && child.subItems.length > 0 && (
                            <div className="pl-3 mt-1 space-y-1 border-l-2 border-green-100 ml-2">
                              {child.subItems.map((sub) => (
                                <Link
                                  key={sub.label}
                                  to={sub.to}
                                  onClick={() => setActiveDropdown(null)}
                                  className="flex items-center gap-1.5 text-xs text-green-700/80 hover:text-green-800 py-1 px-2 rounded-lg hover:bg-green-100/50 transition-colors font-500"
                                >
                                  <Sparkles className="h-3 w-3 text-gold-500" />
                                  <span>{sub.label}</span>
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {isAuthenticated && user ? (
              <>
                {/* Notification bell */}
                <Link
                  to="/notifications"
                  className="relative p-2 rounded-lg text-green-700 hover:bg-cream-dark hover:text-green-700 transition-all"
                  aria-label="Notifications"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-700 rounded-full flex items-center justify-center px-1">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>

                {/* Profile dropdown */}
                <div className="relative" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setProfileOpen((o) => !o)}
                    className="flex items-center gap-2 pl-1 pr-3 py-1.5 rounded-xl hover:bg-cream-dark transition-all"
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "var(--legacy-gradient)" }}>
                      <span className="text-xs font-700 text-white">{initials(user.full_name)}</span>
                    </div>
                    <span className="hidden md:block text-sm font-500 text-green-800 max-w-[100px] truncate">
                      {user.full_name.split(' ')[0]}
                    </span>
                    <ChevronDown className={cn('h-3.5 w-3.5 text-green-700 transition-transform', profileOpen && 'rotate-180')} />
                  </button>

                  {profileOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 card shadow-card-lg py-1 animate-fade-in z-50">
                      <div className="px-4 py-3 border-b border-cream-dark">
                        <p className="text-sm font-600 text-green-800 truncate">{user.full_name}</p>
                        <p className="text-xs text-green-700 truncate">{user.email}</p>
                        <Badge variant="green" className="mt-1.5 capitalize">{user.role}</Badge>
                      </div>
                      <Link
                        to="/profile"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-green-800 hover:bg-cream-dark transition-colors"
                      >
                        <User className="h-4 w-4 text-green-700" />
                        My Profile
                      </Link>
                      <Link
                        to="/certificates"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-green-800 hover:bg-cream-dark transition-colors"
                      >
                        <Award className="h-4 w-4 text-green-700" />
                        My Certificates
                      </Link>
                      {(user.role === 'admin' || user.role === 'exec') && (
                        <Link
                          to="/admin/dashboard"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-green-800 hover:bg-cream-dark transition-colors"
                        >
                          <LayoutDashboard className="h-4 w-4 text-green-700" />
                          Admin Dashboard
                        </Link>
                      )}
                      <Link
                        to="/settings"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-green-800 hover:bg-cream-dark transition-colors"
                      >
                        <Settings className="h-4 w-4 text-green-700" />
                        Settings
                      </Link>
                      <div className="border-t border-cream-dark mt-1">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="h-4 w-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
                  Sign In
                </Button>
                <Button variant="primary" size="sm" onClick={() => navigate('/register')}>
                  Join GPSA
                </Button>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen((o) => !o)}
              className="lg:hidden p-2 rounded-lg text-green-700 hover:bg-cream-dark transition-colors"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Accordion */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-cream-dark bg-white animate-fade-in max-h-[85vh] overflow-y-auto">
          <div className="section-container py-4 space-y-1.5">
            {NAV_ITEMS.map((item) => {
              const hasChildren = Boolean(item.children?.length)
              const isExpanded = Boolean(mobileExpanded[item.label])
              const active = isNavItemActive(item)
              const Icon = item.icon

              if (!hasChildren && item.to) {
                return (
                  <NavLink
                    key={item.label}
                    to={item.to}
                    end={item.exact}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-500 font-body transition-all',
                        isActive
                          ? 'bg-green-gradient text-white'
                          : 'text-green-800 hover:bg-cream-dark'
                      )
                    }
                  >
                    {Icon && <Icon className="h-4 w-4" />}
                    {item.label}
                  </NavLink>
                )
              }

              return (
                <div key={item.label} className="rounded-xl border border-cream-dark overflow-hidden">
                  <button
                    onClick={() => toggleMobileSubmenu(item.label)}
                    className={cn(
                      'w-full flex items-center justify-between px-4 py-3 text-sm font-500 text-green-800 hover:bg-cream-dark transition-colors',
                      active && 'bg-green-50 text-green-700 font-600'
                    )}
                  >
                    <span className="flex items-center gap-3">
                      {Icon && <Icon className="h-4 w-4 text-green-600" />}
                      {item.label}
                    </span>
                    <ChevronDown className={cn('h-4 w-4 text-green-600 transition-transform', isExpanded && 'rotate-180')} />
                  </button>

                  {isExpanded && item.children && (
                    <div className="bg-cream-light/60 p-2 space-y-1 border-t border-cream-dark">
                      {item.children.map((child) => (
                        <div key={child.label} className="space-y-1">
                          <Link
                            to={child.to}
                            onClick={() => setMobileOpen(false)}
                            className="flex flex-col px-3 py-2 rounded-lg text-sm text-green-900 hover:bg-green-100/60 transition-colors"
                          >
                            <span className="font-500">{child.label}</span>
                            {child.description && (
                              <span className="text-xs text-gray-500">{child.description}</span>
                            )}
                          </Link>

                          {child.subItems && child.subItems.length > 0 && (
                            <div className="pl-4 space-y-1 border-l-2 border-green-300/40 ml-3">
                              {child.subItems.map((sub) => (
                                <Link
                                  key={sub.label}
                                  to={sub.to}
                                  onClick={() => setMobileOpen(false)}
                                  className="flex items-center gap-1.5 text-xs text-green-700 py-1 px-2 rounded hover:bg-green-100/80 transition-colors"
                                >
                                  <Sparkles className="h-3 w-3 text-gold-500" />
                                  <span>{sub.label}</span>
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}

            {!isAuthenticated && (
              <div className="pt-3 flex flex-col gap-2">
                <Button variant="outline" size="md" className="w-full" onClick={() => { navigate('/login'); setMobileOpen(false) }}>
                  Sign In
                </Button>
                <Button variant="primary" size="md" className="w-full" onClick={() => { navigate('/register'); setMobileOpen(false) }}>
                  Join GPSA
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}


// ── Footer ────────────────────────────────────────────────────────────────────

export function Footer() {
  const year = new Date().getFullYear()
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  const links = {
    Platform: [
      { label: 'About Us', to: '/about' },
      { label: 'Academics Hub', to: '/academics' },
      { label: 'Events', to: '/events' },
      { label: 'Opportunities', to: '/opportunities' },
      { label: 'Welfare Support', to: '/welfare' },
      { label: 'Alumni Network', to: '/alumni' },
      { label: 'Contact Us', to: '/contact' },
    ],
    Resources: [
      { label: 'Exam Questions', to: '/academics?type=exam_questions' },
      { label: 'Lecture Slides', to: '/academics?type=lecture_slides' },
      { label: 'Lab Reports', to: '/academics?type=lab_reports' },
      { label: 'Tutorial Videos', to: '/academics?type=tutorial_videos' },
      { label: 'Field Materials', to: '/academics?type=field_materials' },
    ],
    Connect: [
      { label: 'Register for Events', to: '/events' },
      { label: 'Report an Issue', to: '/welfare' },
      { label: 'Browse Opportunities', to: '/opportunities' },
      { label: 'Meet Leadership', to: '/leadership' },
      { label: 'Verify Certificate', to: '/certificates/verify' },
    ],
  }

  const contact = [
    { icon: MapPin, label: 'UDS, Tamale, Ghana' },
    { icon: Mail, label: 'gpsa@uds.edu.gh' },
    { icon: Phone, label: '+233 XXX XXX XXX' },
  ]

  const socials = [
    {
      label: 'X',
      href: '#',
      svg: (
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.6l-5.17-6.763-5.91 6.763h-3.308l7.73-8.835L.424 2.25h6.7l4.68 6.18 5.44-6.18" />
        </svg>
      ),
    },
    {
      label: 'LinkedIn',
      href: '#',
      svg: (
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      ),
    },
    {
      label: 'Facebook',
      href: '#',
      svg: (
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
    },
    {
      label: 'YouTube',
      href: '#',
      svg: (
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      ),
    },
    {
      label: 'Instagram',
      href: '#',
      svg: (
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
        </svg>
      ),
    },
  ]

  return (
    <div className="section-container w-full min-w-0 max-w-full">
      <footer className="relative overflow-hidden rounded-2xl">
        <div className="h-1 w-full" style={{ background: 'var(--legacy-gradient)' }} />

        <div className="text-white" style={{ background: 'var(--green-deep)' }}>
          <div className="py-14 px-6 lg:px-10">
          {/* Newsletter / CTA strip */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-10 mb-12 border-b border-white/10">
            <div>
              <p className="font-display font-bold text-lg text-white">Stay connected with GPSA-UDS</p>
              <p className="text-sm text-white/50 mt-0.5">Get the latest updates, events and opportunities.</p>
            </div>
            <div className="flex min-w-0 gap-3 w-full sm:w-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="min-w-0 flex-1 sm:w-64 px-4 py-2.5 rounded-xl bg-white/10 border border-white/10 text-sm text-white placeholder-white/30 outline-none focus:border-white/30 transition-colors"
              />
              <Button variant="gold" size="md">Subscribe</Button>
            </div>
          </div>

          {/* Main footer content */}
          <div className="grid grid-cols-1 lg:grid-cols-6 gap-x-12 gap-y-10 mb-14">
            {/* Brand — spans 2 cols */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-xl overflow-hidden ring-2 ring-white/10 flex-shrink-0">
                  <img src={gpsaLogo} alt="GPSA-UDS" className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="font-display font-bold text-lg text-white leading-tight">GPSA-UDS</p>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest">Est. 2018 &middot; Tamale</p>
                </div>
              </div>
              <p className="text-sm text-white/45 leading-relaxed mb-6 max-w-sm">
                The official representative body of pharmacy students at the University for Development Studies,
                advancing academic excellence, welfare, and professional growth.
              </p>
              <div className="flex gap-2.5">
                {socials.map(({ label, href, svg }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={label}
                    className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/15 transition-all flex items-center justify-center text-white/50 hover:text-white"
                  >
                    {svg}
                  </a>
                ))}
              </div>
            </div>

            {/* Link columns — 3 cols */}
            {Object.entries(links).map(([heading, items]) => (
              <div key={heading} className="lg:col-span-1">
                <p className="text-[11px] font-bold uppercase tracking-widest text-gold-400 mb-4">{heading}</p>
                <ul className="space-y-3">
                  {items.map(({ label, to }) => (
                    <li key={label}>
                      <Link
                        to={to}
                        className="text-sm text-white/50 hover:text-white transition-colors duration-200"
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Contact strip + back to top */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 pt-6 border-t border-white/5">
            <div className="flex flex-wrap gap-x-8 gap-y-3">
              {contact.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2.5 text-sm text-white/40">
                  <Icon className="h-3.5 w-3.5 text-white/30" />
                  <span>{label}</span>
                </div>
              ))}
            </div>
            <button
              onClick={scrollToTop}
              className="flex items-center gap-2 text-xs text-white/30 hover:text-white/70 transition-colors"
            >
              Back to top
              <ArrowUpToLine className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Bottom bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-5 mt-6 border-t border-white/5 text-[11px] text-white/30">
            <p>&copy; {year} GPSA-UDS. All rights reserved.</p>
            <div className="flex gap-5">
              <Link to="/privacy" className="hover:text-white/60 transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-white/60 transition-colors">Terms of Use</Link>
            </div>
          </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
