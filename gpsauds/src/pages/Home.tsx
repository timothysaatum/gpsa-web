import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useState, useEffect, useCallback, useRef } from 'react'
import {
  ArrowRight, BookOpen, Heart, Newspaper, Users, ChevronLeft, ChevronRight,
  GraduationCap, CalendarRange, Library, Award, Mail,
} from 'lucide-react'
import { eventsApi, heroApi, newsApi, opportunitiesApi, statsApi, welfareApi } from '@/api/services'
import { Button, Badge, Card, CardSkeleton, EmptyState, SectionHeader, Skeleton } from '@/components/ui'
import { EventCard, CountdownBlock } from '@/components/shared'
import { cn, formatDateTime, NEWS_CATEGORY_LABELS, OPP_TYPE_LABELS, formatDate } from '@/utils'
import slide1 from '@/assets/KCP_4243.jpg'
import slide2 from '@/assets/KCP_4248.jpg'
import slide3 from '@/assets/KCP_4495.jpg'
import type { HeroSlide, Opportunity } from '@/types'

// ── Hero Carousel ─────────────────────────────────────────────────────────────

const FALLBACK_SLIDES = [
  {
    image_url: slide1,
    tag: 'Health Week 2025',
    heading: 'Welcome to',
    highlight: 'GPSA-UDS',
    sub: 'Empowering pharmacy students through academics, welfare, and professional development at UDS.',
    primary_button_label: 'Read More',
    primary_button_path: '/about',
    secondary_button_label: 'Register for Events',
    secondary_button_path: '/events',
  },
  {
    image_url: slide2,
    tag: 'Community & Events',
    heading: 'One Family,',
    highlight: 'One Vision',
    sub: 'Join hundreds of pharmacy students driving change through collaboration and professional excellence.',
    primary_button_label: 'View Gallery',
    primary_button_path: '/gallery',
    secondary_button_label: 'Explore Academics',
    secondary_button_path: '/academics',
  },
  {
    image_url: slide3,
    tag: 'GPSA-UDS Welfare',
    heading: 'Your Wellbeing,',
    highlight: 'Our Priority',
    sub: 'Access welfare support, academic resources, and exciting opportunities — all in one place.',
    primary_button_label: 'Latest News',
    primary_button_path: '/news',
    secondary_button_label: 'Get Support',
    secondary_button_path: '/welfare',
  },
]

interface SlideData {
  image_url: string
  tag: string
  heading: string
  highlight: string
  sub: string
  primary_button_label: string
  primary_button_path: string
  secondary_button_label: string
  secondary_button_path: string
}

function mapSlides(apiSlides: HeroSlide[]): SlideData[] {
  return apiSlides.map((s) => ({
    image_url: s.image_url,
    tag: s.tag,
    heading: s.heading,
    highlight: s.highlight,
    sub: s.sub,
    primary_button_label: s.primary_button_label,
    primary_button_path: s.primary_button_path,
    secondary_button_label: s.secondary_button_label,
    secondary_button_path: s.secondary_button_path,
  }))
}

function Hero() {
  const navigate = useNavigate()
  const [current, setCurrent] = useState(0)
  const [animating, setAnimating] = useState(false)
  const [progress, setProgress] = useState(0)

  const { data: apiSlides } = useQuery({
    queryKey: ['hero-slides'],
    queryFn: () => heroApi.list(),
  })

  const slides: SlideData[] = Array.isArray(apiSlides) && apiSlides.length > 0
    ? mapSlides(apiSlides)
    : FALLBACK_SLIDES as unknown as SlideData[]

  const go = useCallback((next: number) => {
    if (animating) return
    setAnimating(true)
    setProgress(0)
    setTimeout(() => {
      setCurrent(next)
      requestAnimationFrame(() => setAnimating(false))
    }, 600)
  }, [animating])

  const prev = () => go((current - 1 + slides.length) % slides.length)
  const next = () => go((current + 1) % slides.length)

  const slide = slides[current]

  const AUTOPLAY_MS = 6000
  useEffect(() => {
    const start = performance.now()
    let raf: number

    const tick = (now: number) => {
      const elapsed = now - start
      setProgress(Math.min(elapsed / AUTOPLAY_MS, 1))
      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)

    const t = setTimeout(() => go((current + 1) % slides.length), AUTOPLAY_MS)
    return () => { clearTimeout(t); cancelAnimationFrame(raf) }
  }, [current, go, slides.length])

  return (
    <section className="pb-16 lg:pb-24 pt-8 lg:pt-12 px-5 sm:px-8 lg:px-10">
      <div className="max-w-7xl mx-auto">
        <div className="relative overflow-hidden z-40 rounded-3xl aspect-[16/9] md:aspect-[21/9]">

        <div className="absolute inset-0 rounded-3xl overflow-hidden">
          <div className="absolute inset-0 transition-transform duration-[800ms] ease-out"
            style={{ transform: animating ? 'scale(1.08)' : 'scale(1)' }}
          >
            <img
              key={slide.image_url}
              src={slide.image_url}
              alt=""
              className="w-full h-full object-cover object-center"
            />
          </div>
        </div>

        <div
          className="absolute inset-0 rounded-3xl"
          style={{
            background: `
              linear-gradient(to top, color-mix(in srgb, var(--green-bright-old) 92%, transparent) 0%, color-mix(in srgb, var(--green-bright-old) 50%, transparent) 35%, color-mix(in srgb, var(--green-bright-old) 12%, transparent) 65%, transparent 100%),
              linear-gradient(105deg, color-mix(in srgb, var(--green-bright-old) 30%, transparent) 0%, transparent 50%),
              radial-gradient(ellipse at 88% 12%, color-mix(in srgb, var(--gold-old) 15%, transparent) 0%, transparent 50%)
            `,
          }}
        />

        <div
          className="absolute inset-0 rounded-3xl opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px',
          }}
        />

        <div className="relative w-full h-full flex flex-col justify-center px-8 lg:px-14 pt-24 lg:pt-28 pb-20 lg:pb-24">
          <div className="max-w-2xl relative z-50"
            style={{
              opacity: animating ? 0 : 1,
              transform: animating ? 'translateY(20px)' : 'translateY(0)',
              transition: 'opacity 0.5s ease 0.1s, transform 0.5s ease 0.1s',
            }}
          >
            <span
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-700 uppercase tracking-widest mb-6"
              style={{ background: 'rgba(255,255,255,0.12)', color: 'var(--white)', backdropFilter: 'blur(8px)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--gold-old)' }} />
              {slide.tag}
            </span>

            <h1
              className="font-display font-bold text-white leading-[1.03] tracking-tight mb-4"
              style={{ fontSize: 'clamp(2.8rem, 7vw, 5rem)' }}
            >
              {slide.heading}{' '}
              <span
                style={{
                  backgroundImage: 'linear-gradient(135deg, var(--gold-old), #fbbf24 60%, #fde68a)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {slide.highlight}
              </span>
            </h1>

            <p className="text-lg text-white/70 leading-relaxed mb-10 max-w-xl">
              {slide.sub}
            </p>

            <div className="flex flex-wrap gap-4">
              <Button
                variant="gold"
                size="lg"
                onClick={() => navigate(slide.primary_button_path)}
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                {slide.primary_button_label}
              </Button>
              <Button variant="outline-white" size="lg" onClick={() => navigate(slide.secondary_button_path)}>
                {slide.secondary_button_label}
              </Button>
            </div>
          </div>

          <div className="mt-auto relative z-50">
            <div className="h-[2px] bg-white/10 rounded-full mb-6 overflow-hidden">
              <div
                className="h-full rounded-full transition-none"
                style={{
                  width: `${progress * 100}%`,
                  background: 'var(--gold-old)',
                }}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex gap-2">
                  {slides.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => go(i)}
                      className="transition-all duration-500 rounded-full"
                      style={{
                        width: i === current ? 28 : 7,
                        height: 7,
                        background: i === current ? 'var(--gold-old)' : 'rgba(255,255,255,0.3)',
                      }}
                    />
                  ))}
                </div>
                <span className="text-white/40 text-xs font-mono tabular-nums tracking-wider">
                  {String(current + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={prev}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={next}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </section>
  )
}

// ── Animated counter ──────────────────────────────────────────────────────────

function useCountUp(target: number, isVisible: boolean, duration = 2000) {
  const [value, setValue] = useState(0)
  const startedRef = useRef(false)

  useEffect(() => {
    if (!isVisible || startedRef.current) return
    startedRef.current = true

    const startTime = performance.now()

    const animate = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.floor(eased * target))

      if (progress < 1) requestAnimationFrame(animate)
    }

    requestAnimationFrame(animate)
  }, [isVisible, target, duration])

  useEffect(() => {
    if (!isVisible) startedRef.current = false
  }, [isVisible])

  return value
}

function StatItem({
  icon: Icon,
  value: target,
  label,
  suffix = '',
  isVisible,
}: {
  icon: React.ElementType
  value: number
  label: string
  suffix?: string
  isVisible: boolean
}) {
  const count = useCountUp(target, isVisible)

  return (
    <div className="flex items-center gap-4 p-4">
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
        style={{ background: 'color-mix(in srgb, var(--color-accent) 18%, transparent)' }}
      >
        <Icon className="h-5 w-5" style={{ color: 'var(--color-accent)' }} />
      </div>
      <div className="min-w-0">
        <p className="font-display text-3xl md:text-4xl font-bold text-white tabular-nums leading-none mb-1.5">
          {count}{suffix}
        </p>
        <p className="text-sm text-white/60 leading-snug">{label}</p>
      </div>
    </div>
  )
}

function StatsStrip() {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true) },
      { threshold: 0.3 },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const { data } = useQuery({
    queryKey: ['stats'],
    queryFn: statsApi.get,
    staleTime: 5 * 60 * 1000,
  })

  const stats = [
    { icon: GraduationCap, value: data?.total_users ?? 0, label: 'Students Represented', suffix: '+' },
    { icon: CalendarRange, value: data?.total_events ?? 0, label: 'Events Per Year', suffix: '+' },
    { icon: Library, value: data?.total_resources ?? 0, label: 'Academic Resources', suffix: '+' },
    { icon: Award, value: data?.active_members ?? 0, label: 'Active Members', suffix: '+' },
  ]

  return (
    <div className="section-container">
      <section ref={ref} className="bg-brand section-padding rounded-2xl">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {stats.map((s) => (
            <StatItem key={s.label} {...s} isVisible={isVisible} />
          ))}
        </div>
      </section>
    </div>
  )
}

// ── Quick actions ─────────────────────────────────────────────────────────────

function QuickActions() {
  const navigate = useNavigate()
  const actions = [
    {
      icon: Users, label: 'Join GPSA',
      desc: 'Become an official member',
      to: '/register',
      barColor: 'bg-green-500',
    },
    {
      icon: Heart, label: 'Welfare',
      desc: 'Report issues or request help',
      to: '/welfare',
      barColor: 'bg-gold-500',
    },
    {
      icon: BookOpen, label: 'Academics',
      desc: 'Slides, questions, lab reports',
      to: '/academics',
      barColor: 'bg-emerald-600',
    },
    {
      icon: Newspaper, label: 'Latest News',
      desc: 'Official updates & announcements',
      to: '/news',
      barColor: 'bg-sky-600',
    },
  ]
  return (
    <section className="section-padding bg-cream-dark">
      <div className="section-container">
        <SectionHeader title="Quick Actions" subtitle="Jump straight to what you need" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {actions.map(({ icon: Icon, label, desc, to, barColor }) => (
            <button
              key={label}
              onClick={() => navigate(to)}
              className={cn(
                'group relative bg-white rounded-2xl p-6 text-left transition-all duration-300',
                'border border-cream-dark hover:-translate-y-1 hover:shadow-xl',
              )}
            >
              <div className={cn('absolute top-0 left-6 right-6 h-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300', barColor)} />

              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 shadow-sm bg-brand">
                <Icon className="h-6 w-6 text-white" />
              </div>

              <h3 className="font-display font-bold text-green-800 text-lg mb-1.5 group-hover:text-green-700 transition-colors">
                {label}
              </h3>

              <p className="text-sm text-muted leading-relaxed mb-5">
                {desc}
              </p>

              <span className="inline-flex items-center gap-2 text-sm font-600 text-green-700 group-hover:text-green-600 transition-colors">
                Explore
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 group-hover:bg-green-200 transition-colors">
                  <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Today at GPSA ─────────────────────────────────────────────────────────────

function TodayAtGPSA() {
  const navigate = useNavigate()

  const { data: featuredNews, isLoading: newsLoading } = useQuery({
    queryKey: ['news', 'featured'],
    queryFn: newsApi.getFeatured,
    staleTime: 2 * 60 * 1000,
  })

  const { data: featuredOpp, isLoading: oppLoading } = useQuery({
    queryKey: ['opportunities', 'featured'],
    queryFn: () => opportunitiesApi.list({ limit: 1, include_expired: false }),
    staleTime: 2 * 60 * 1000,
  })

  const { data: spotlight, isLoading: spotLoading } = useQuery({
    queryKey: ['welfare', 'spotlight'],
    queryFn: welfareApi.getSpotlight,
    staleTime: 5 * 60 * 1000,
  })

  const opportunity: Opportunity | undefined = featuredOpp?.items?.[0]
  const hasAnyData = featuredNews || opportunity || spotlight
  const loading = newsLoading || oppLoading || spotLoading

  if (loading) {
    return (
      <section className="section-padding">
        <div className="section-container">
          <SectionHeader title="Today at GPSA-UDS" subtitle="What's happening right now" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => <CardSkeleton key={i} />)}
          </div>
        </div>
      </section>
    )
  }

  if (!hasAnyData) return null

  return (
    <section className="section-padding">
      <div className="section-container">
        <SectionHeader title="Today at GPSA-UDS" subtitle="What's happening right now" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Featured News */}
          {featuredNews && (
            <Card
              hover
              padding="none"
              onClick={() => navigate(`/news/${featuredNews.id}`)}
              className="overflow-hidden flex flex-col"
            >
              <div className="h-36 flex items-center justify-center text-5xl bg-brand">
                {featuredNews.banner_emoji ?? '📰'}
              </div>
              <div className="p-5 flex flex-col gap-2 flex-1">
                <div className="flex gap-1.5">
                  <Badge variant="green">{NEWS_CATEGORY_LABELS[featuredNews.category]}</Badge>
                  {featuredNews.is_urgent && <Badge variant="red">Urgent</Badge>}
                </div>
                <h3 className="font-display font-bold text-deep leading-snug line-clamp-2">
                  {featuredNews.title}
                </h3>
                <p className="text-sm text-muted line-clamp-2 leading-relaxed flex-1">
                  {featuredNews.summary}
                </p>
                <span className="text-xs font-600 text-green-700 flex items-center gap-1 mt-2">
                  Read More <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </Card>
          )}

          {/* Spotlight Opportunity */}
          {opportunity && (
            <Card padding="none" className="overflow-hidden flex flex-col border-green-200">
              <div className="p-5 flex flex-col gap-3 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <Badge variant="gold" className="mb-1">
                    {OPP_TYPE_LABELS[opportunity.opp_type]}
                  </Badge>
                  {!opportunity.is_active && <Badge variant="gray">Expired</Badge>}
                </div>
                <h3 className="font-display font-bold text-deep leading-snug line-clamp-2">
                  {opportunity.title}
                </h3>
                <p className="text-xs text-muted font-500">🏢 {opportunity.organization}</p>
                <p className="text-sm text-muted line-clamp-2 leading-relaxed flex-1">
                  {opportunity.description}
                </p>
                <div className="flex items-center justify-between pt-2 border-t border-cream-dark mt-auto">
                  <div>
                    <p className="text-[10px] text-muted uppercase tracking-wide font-700 mb-1">Deadline</p>
                    <span className="text-xs text-muted">{formatDate(opportunity.deadline)}</span>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); navigate('/opportunities') }}
                  >
                    View
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Welfare Spotlight */}
          {spotlight && (
            <Card padding="none" className="overflow-hidden flex flex-col bg-brand text-white border-none">
              <div className="p-5 flex flex-col gap-3 flex-1 relative">
                <div className="absolute inset-0 pointer-events-none opacity-[0.06]"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                  }}
                />
                <div className="relative">
                  <Badge variant="gold" className="mb-2">Issue of the Week</Badge>
                  <h3 className="font-display text-xl font-bold text-white leading-snug mb-2">
                    {spotlight.summary}
                  </h3>
                  <p className="text-sm text-white/70 leading-relaxed line-clamp-3">
                    {spotlight.action_taken}
                  </p>
                </div>
              </div>
            </Card>
          )}

        </div>
      </div>
    </section>
  )
}

// ── Featured Event Banner ─────────────────────────────────────────────────────

function FeaturedEventBanner() {
  const navigate = useNavigate()
  const { data: event, isLoading } = useQuery({
    queryKey: ['events', 'featured'],
    queryFn: eventsApi.getFeatured,
    staleTime: 2 * 60 * 1000,
  })

  if (isLoading) return (
    <div className="section-container mb-6">
      <Skeleton className="h-56 rounded-3xl" />
    </div>
  )
  if (!event) return null

  return (
    <div className="section-container mb-6">
      <div
        className="rounded-3xl p-8 lg:p-12 flex flex-col lg:flex-row gap-8 lg:gap-14 items-start lg:items-center overflow-hidden relative group cursor-pointer transition-shadow duration-300 hover:shadow-2xl bg-brand"
        onClick={() => navigate(`/events/${event.id}`)}
      >
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{ background: 'radial-gradient(ellipse at 30% 50%, color-mix(in srgb, var(--gold-old) 20%, transparent) 0%, transparent 60%)' }}
        />

        <div className="text-6xl lg:text-7xl flex-shrink-0 relative group-hover:scale-105 transition-transform duration-500">
          {event.banner_emoji ?? '🎓'}
        </div>

        <div className="flex-1 relative">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-700 uppercase tracking-widest mb-4"
            style={{ background: 'rgba(255,255,255,0.12)', color: 'var(--gold-old)' }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--gold-old)' }} />
            Featured Event
          </span>
          <h2 className="font-display text-2xl lg:text-4xl font-bold text-white mb-3 leading-tight">
            {event.title}
          </h2>
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-white/60 text-sm mb-5">
            <span className="flex items-center gap-1.5">📅 {formatDateTime(event.start_datetime)}</span>
            <span className="flex items-center gap-1.5">📍 {event.location}</span>
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <CountdownBlock targetDate={event.start_datetime} />
            <Button variant="gold" size="md" onClick={(e) => { e.stopPropagation(); navigate(`/events/${event.id}`) }}>
              Register Now →
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Upcoming events ───────────────────────────────────────────────────────────

function UpcomingEvents() {
  const navigate = useNavigate()
  const { data, isLoading } = useQuery({
    queryKey: ['events', 'upcoming-list'],
    queryFn: () => eventsApi.list({ event_status: 'upcoming', limit: 3 }),
  })

  return (
    <section className={cn('section-padding', { 'pt-0': true })}>
      <div className="section-container">
        <SectionHeader
          title="Upcoming Events"
          subtitle="Don't miss out — register now"
          action={
            <Button variant="ghost" size="sm" onClick={() => navigate('/events')} rightIcon={<ArrowRight className="h-4 w-4" />}>
              View All
            </Button>
          }
        />

        <FeaturedEventBanner />

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => <CardSkeleton key={i} />)}
          </div>
        ) : !data?.items?.length ? (
          <EmptyState icon="📅" title="No upcoming events" description="Check back soon for new events." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.items.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

// ── Gallery Teaser ────────────────────────────────────────────────────────────

const GALLERY_ITEMS = [
  { emoji: '🎓', label: 'White Coat Ceremony', color: 'bg-brand' },
  { emoji: '🏥', label: 'Health Screening', color: 'bg-gold-500' },
  { emoji: '📚', label: 'Study Session', color: 'bg-emerald-600' },
  { emoji: '🤝', label: 'Community Outreach', color: 'bg-sky-600' },
  { emoji: '🎉', label: 'Congregation', color: 'bg-purple-600' },
]

const GALLERY_CARD = ({ emoji, label, color }: { emoji: string; label: string; color: string }) => (
  <div
    className={cn(
      'flex-shrink-0 w-64 h-44 rounded-2xl overflow-hidden relative',
      color,
    )}
  >
    <div className="absolute inset-0 opacity-[0.06]"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }}
    />

    <div className="relative w-full h-full flex flex-col items-center justify-center gap-3 p-6">
      <span className="text-5xl">{emoji}</span>
      <span className="text-white font-display font-bold text-sm text-center leading-snug">
        {label}
      </span>
    </div>
  </div>
)

function GalleryTeaser() {
  const navigate = useNavigate()

  return (
    <section className="section-padding bg-cream-dark">
      <div className="section-container">
        <SectionHeader
          title="From Our Gallery"
          subtitle="Moments that define GPSA-UDS"
          action={
            <Button variant="ghost" size="sm" onClick={() => navigate('/gallery')} rightIcon={<ArrowRight className="h-4 w-4" />}>
              View Gallery
            </Button>
          }
        />

        <div className="marquee-wrapper rounded-2xl">
          <div className="marquee-track gap-6 py-2">
            {[...GALLERY_ITEMS, ...GALLERY_ITEMS].map((item, i) => (
              <button key={`${item.label}-${i}`} onClick={() => navigate('/gallery')} className="cursor-pointer hover:opacity-85 transition-opacity">
                <GALLERY_CARD {...item} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Join CTA ──────────────────────────────────────────────────────────────────

function JoinCTA() {
  const navigate = useNavigate()

  return (
    <section className="section-padding">
      <div className="section-container">
        <div className="rounded-3xl bg-brand p-10 lg:p-14 relative overflow-hidden text-center">
          <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />

          <div className="relative max-w-2xl mx-auto">
            <Mail className="h-10 w-10 mx-auto mb-6 text-white/60" />

            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight mb-4">
              Join GPSA-UDS Today
            </h2>

            <p className="text-lg text-white/70 leading-relaxed mb-8 max-w-lg mx-auto">
              Become part of Ghana's leading pharmaceutical students' association.
              Access resources, attend events, and connect with fellow students.
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <Button
                variant="gold"
                size="lg"
                onClick={() => navigate('/register')}
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                Create Account
              </Button>
              <Button
                variant="outline-white"
                size="lg"
                onClick={() => navigate('/about')}
              >
                Learn More
              </Button>
            </div>

            <p className="text-sm text-white/50 mt-6">
              Already a member? <button onClick={() => navigate('/login')} className="text-white/80 underline hover:text-white transition-colors">Sign in</button>
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function HomePage() {
  return (
    <>
      <Hero />
      <StatsStrip />
      <QuickActions />
      <TodayAtGPSA />
      <UpcomingEvents />
      <GalleryTeaser />
      <JoinCTA />
    </>
  )
}
