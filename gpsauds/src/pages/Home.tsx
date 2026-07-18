import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useState, useEffect, useCallback, useRef } from 'react'
import {
  ArrowRight, BookOpen, Heart, Newspaper, Users, ChevronLeft, ChevronRight,
  GraduationCap, CalendarRange, Library, Award, Mail, Briefcase, Image as ImageIcon,
} from 'lucide-react'
import { eventsApi, galleryApi, heroApi, newsApi, opportunitiesApi, statsApi, welfareApi } from '@/api/services'
import { Button, Badge, CardSkeleton, EmptyState, SectionHeader, Skeleton } from '@/components/ui'

import { EventCard, CountdownBlock, NewsCard, OpportunityCard } from '@/components/shared'

import { cn, formatDate, formatDateTime, relativeTime } from '@/utils'
import slide1 from '@/assets/KCP_4243.jpg'
import slide2 from '@/assets/KCP_4248.jpg'
import slide3 from '@/assets/KCP_4495.jpg'
import type { GalleryItem, HeroSlide } from '@/types'

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
    <section className="relative z-0 pb-16 lg:pb-24 pt-6 sm:pt-8 lg:pt-10 px-3 sm:px-8 lg:px-10">
      <div className="max-w-7xl mx-auto">
        <div className="relative isolate overflow-hidden rounded-2xl sm:rounded-3xl min-h-[34rem] sm:min-h-[32rem] md:min-h-0 md:aspect-[16/10] lg:aspect-[21/9]">

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

        <div className="relative w-full min-h-[34rem] sm:min-h-[32rem] md:min-h-0 md:h-full flex flex-col px-5 sm:px-8 lg:px-14 py-6 sm:py-8 md:pt-12 md:pb-8 lg:pt-14 lg:pb-8">
          <div className="max-w-3xl relative z-50"
            style={{
              opacity: animating ? 0 : 1,
              transform: animating ? 'translateY(20px)' : 'translateY(0)',
              transition: 'opacity 0.5s ease 0.1s, transform 0.5s ease 0.1s',
            }}
          >
            <span
              className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full text-[10px] sm:text-xs font-700 uppercase tracking-widest mb-3 sm:mb-5"
              style={{ background: 'rgba(255,255,255,0.12)', color: 'var(--white)', backdropFilter: 'blur(8px)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--gold-old)' }} />
              {slide.tag}
            </span>

            <h1
              className="font-display font-bold text-white text-[2.15rem] sm:text-5xl md:text-[3.5rem] lg:text-[4rem] xl:text-[4.25rem] leading-[1.02] tracking-tight mb-3 sm:mb-4"
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

            <p className="text-sm sm:text-base lg:text-lg text-white/80 leading-relaxed mb-5 sm:mb-7 lg:mb-8 max-w-2xl">
              {slide.sub}
            </p>

            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-4 mb-6 sm:mb-8">
              <Button
                variant="gold"
                size="lg"
                className="w-full sm:w-auto justify-center"
                onClick={() => navigate(slide.primary_button_path)}
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                {slide.primary_button_label}
              </Button>
              <Button
                variant="outline-white"
                size="lg"
                className="w-full sm:w-auto justify-center"
                onClick={() => navigate(slide.secondary_button_path)}
              >
                {slide.secondary_button_label}
              </Button>
            </div>
          </div>

          <div className="mt-auto relative z-50 pt-2">
            <div className="h-[2px] bg-white/10 rounded-full mb-3 sm:mb-5 overflow-hidden">
              <div
                className="h-full rounded-full transition-none"
                style={{
                  width: `${progress * 100}%`,
                  background: 'var(--gold-old)',
                }}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 sm:gap-6">
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

              <div className="flex gap-1 sm:gap-2">
                <button
                  onClick={prev}
                  aria-label="Previous slide"
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-all"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={next}
                  aria-label="Next slide"
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-all"
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
    { icon: CalendarRange, value: data?.total_events ?? 0, label: 'Events Hosted', suffix: '+' },
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

// ── Latest updates ────────────────────────────────────────────────────────────

function LatestUpdates() {
  const navigate = useNavigate()

  const featuredQuery = useQuery({
    queryKey: ['news', 'featured-home'],
    queryFn: newsApi.getFeatured,
    staleTime: 2 * 60 * 1000,
  })

  const latestQuery = useQuery({
    queryKey: ['news', 'home-list'],
    queryFn: () => newsApi.list({ limit: 3 }),
    staleTime: 2 * 60 * 1000,
  })

  const posts = latestQuery.data?.items ?? []
  const featured = featuredQuery.data
  const hasContent = Boolean(featured) || posts.length > 0
  const isLoading = featuredQuery.isLoading || latestQuery.isLoading

  return (
    <section className="section-padding">
      <div className="section-container">
        <SectionHeader
          title="Latest Updates"
          subtitle="Official announcements and campus news"
          action={
            <Button variant="ghost" size="sm" onClick={() => navigate('/news')} rightIcon={<ArrowRight className="h-4 w-4" />}>
              View All
            </Button>
          }
        />

        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => <CardSkeleton key={i} />)}
          </div>
        ) : !hasContent ? (
          <EmptyState icon="📰" title="No updates yet" description="Published announcements will appear here." />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            {featured && (
              <button
                onClick={() => navigate(`/news/${featured.id}`)}
                className="group bg-brand text-white rounded-[1.6rem] p-6 sm:p-7 text-left overflow-hidden relative transition-all duration-300 hover:-translate-y-1 shadow-[0_22px_60px_rgba(0,77,0,0.2)] hover:shadow-[0_30px_80px_rgba(0,77,0,0.28)] min-h-[300px]"
              >
                <div className="absolute inset-0 opacity-[0.06] pointer-events-none"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff'%3E%3Ccircle cx='7' cy='7' r='1.5'/%3E%3Ccircle cx='37' cy='37' r='1.5'/%3E%3C/g%3E%3C/svg%3E")`,
                  }}
                />
                <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-white/10" />
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/20 to-transparent" />
                <div className="relative flex h-full flex-col">
                  <div className="flex items-start justify-between gap-4 mb-5">
                    <Badge variant={featured.is_urgent ? 'red' : 'gold'} className="self-start">
                      {featured.is_urgent ? 'Urgent Update' : 'Featured News'}
                    </Badge>
                    <span className="h-14 w-14 rounded-2xl bg-white/12 flex items-center justify-center text-3xl shrink-0 shadow-inner">
                      {featured.banner_emoji ?? '📣'}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-display text-3xl lg:text-4xl font-bold leading-none mb-4 line-clamp-3">
                      {featured.title}
                    </h3>
                    <p className="text-sm sm:text-base text-white/75 leading-relaxed line-clamp-4">
                      {featured.summary}
                    </p>
                  </div>
                  <div className="mt-auto pt-6 flex items-center justify-between gap-3">
                    <span className="text-xs font-700 text-white/45">
                      {featured.published_at ? formatDate(featured.published_at) : 'Featured'}
                    </span>
                    <span className="inline-flex items-center gap-2 text-sm font-800 text-gold-500">
                      Read update
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </span>
                  </div>
                </div>
              </button>
            )}

            {posts
              .filter((post) => post.id !== featured?.id)
              .slice(0, featured ? 2 : 3)
              .map((post) => (
                <NewsCard key={post.id} post={post} onClick={() => navigate(`/news/${post.id}`)} />
              ))}
          </div>
        )}
      </div>
    </section>
  )
}

// ── Today at GPSA ─────────────────────────────────────────────────────────────

function SpotlightSkeleton() {
  return (
    <div className="rounded-3xl overflow-hidden animate-pulse" style={{ background: '#003800' }}>
      <div className="flex flex-col lg:flex-row min-h-[300px] lg:min-h-[360px]">
        <div className="flex-1 flex flex-col gap-5 p-8 lg:p-10 xl:p-12">
          <div className="h-6 w-36 rounded-full bg-white/20" />
          <div className="flex-1 flex flex-col gap-4">
            <div className="h-9 w-3/4 rounded-lg bg-white/10" />
            <div className="h-9 w-1/2 rounded-lg bg-white/10" />
            <div className="h-4 w-full rounded bg-white/5 mt-2" />
            <div className="h-4 w-5/6 rounded bg-white/5" />
          </div>
          <div className="flex gap-6">
            <div className="h-4 w-28 rounded bg-white/5" />
            <div className="h-4 w-24 rounded bg-white/5" />
            <div className="h-4 w-20 rounded bg-white/5" />
          </div>
          <div className="h-11 w-36 rounded-xl bg-white/20" />
        </div>
        <div className="w-full lg:w-72 xl:w-80 shrink-0 min-h-[160px] lg:min-h-0 bg-black/20" />
      </div>
    </div>
  )
}

function EmptySpotlightCard({ onBrowse }: { onBrowse: () => void }) {
  return (
    <div className="bg-brand text-white rounded-3xl relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative flex flex-col lg:flex-row min-h-[300px] lg:min-h-[360px]">
        {/* Left: content */}
        <div className="flex-1 flex flex-col gap-5 p-8 lg:p-10 xl:p-12">
          <Badge variant="gold" className="self-start">Issue of the Week</Badge>

          <div className="flex-1 flex flex-col gap-4 justify-center">
            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-3xl mb-1">
              📌
            </div>
            <h3 className="font-display text-2xl lg:text-3xl font-bold text-white leading-tight">
              No featured issue this week
            </h3>
            <p className="text-[15px] lg:text-base text-white/60 leading-relaxed max-w-lg">
              Everything on campus is running smoothly, or no issue has been selected as the featured issue yet. Check back later for updates.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/40">
            <span className="flex items-center gap-1.5">Status: No Active Feature</span>
          </div>

          <div>
            <Button
              variant="gold"
              size="md"
              rightIcon={<ArrowRight className="h-4 w-4" />}
              onClick={onBrowse}
              aria-label="Browse all issues"
            >
              Browse All Issues
            </Button>
          </div>
        </div>

        {/* Right: decorative panel */}
        <div className="relative w-full lg:w-72 xl:w-80 shrink-0 min-h-[160px] lg:min-h-0 overflow-hidden">
          <div className="absolute inset-0" style={{ background: 'color-mix(in srgb, var(--green-primary) 85%, black)' }} />
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full opacity-15"
            style={{ background: 'radial-gradient(circle, var(--gold-old) 0%, transparent 70%)' }}
          />
          <div className="absolute top-1/2 -translate-y-1/2 -left-12 w-48 h-48 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, var(--green-mint) 0%, transparent 70%)' }}
          />
          <svg className="absolute inset-0 w-full h-full opacity-[0.04]" viewBox="0 0 200 200" preserveAspectRatio="none">
            <line x1="0" y1="0" x2="200" y2="200" stroke="white" strokeWidth="0.5" />
            <line x1="200" y1="0" x2="0" y2="200" stroke="white" strokeWidth="0.5" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl"
                style={{ background: 'color-mix(in srgb, var(--gold-old) 15%, transparent)', backdropFilter: 'blur(4px)' }}>
                🏛️
              </div>
              <span className="text-[11px] font-700 uppercase tracking-widest opacity-40"
                style={{ color: 'var(--gold-old)' }}>
                GPSA-UDS
              </span>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
            style={{ background: 'linear-gradient(to top, color-mix(in srgb, var(--green-primary) 85%, black) 0%, transparent 100%)' }}
          />
        </div>
      </div>
    </div>
  )
}

function TodayAtGPSA() {
  const navigate = useNavigate()

  const { data: spotlight, isLoading } = useQuery({
    queryKey: ['welfare', 'spotlight'],
    queryFn: welfareApi.getSpotlight,
    staleTime: 5 * 60 * 1000,
  })

  if (isLoading) {
    return (
      <section className="py-10 lg:py-14">
        <div className="section-container">
          <SectionHeader title="Today at GPSA-UDS" subtitle="What's happening right now" />
          <SpotlightSkeleton />
        </div>
      </section>
    )
  }

  return (
    <section className="py-10 lg:py-14" style={{ animation: 'fadeUp 0.5s ease-out' }}>
      <div className="section-container">
        <SectionHeader title="Today at GPSA-UDS" subtitle="What's happening right now" />

        {spotlight ? (
          <div className="bg-brand text-white rounded-3xl relative overflow-hidden group transition-all duration-300 hover:shadow-2xl hover:-translate-y-0.5">
            <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}
            />
            <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{ background: 'radial-gradient(ellipse at 30% 50%, color-mix(in srgb, var(--gold-old) 15%, transparent) 0%, transparent 60%)' }}
            />

            <div className="relative flex flex-col lg:flex-row min-h-[300px] lg:min-h-[360px]">
              {/* ── Left: Content ── */}
              <div className="flex-1 flex flex-col gap-5 p-8 lg:p-10 xl:p-12">
                <Badge variant="gold" className="self-start">Issue of the Week</Badge>

                <div className="flex-1 flex flex-col gap-4">
                  <h3 className="font-display text-3xl lg:text-4xl font-bold text-white leading-tight tracking-tight max-w-2xl">
                    {spotlight.summary}
                  </h3>

                  {spotlight.action_taken && (
                    <p className="text-[15px] lg:text-base text-white/70 leading-relaxed max-w-xl line-clamp-3">
                      {spotlight.action_taken}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-x-6 gap-y-2.5 text-sm text-white/60">
                  <span className="flex items-center gap-1.5">📍 Main Campus</span>
                  <span className="flex items-center gap-1.5">📅 {relativeTime(spotlight.created_at)}</span>
                  <span className="flex items-center gap-1.5">🏷 Welfare</span>
                  <span className={cn('flex items-center gap-1.5', spotlight.is_active ? 'text-green-300' : 'text-white/40')}>
                    <span className={cn('w-2 h-2 rounded-full', spotlight.is_active ? 'bg-green-400' : 'bg-white/30')} />
                    {spotlight.is_active ? 'Active' : 'Resolved'}
                  </span>
                </div>

                <div>
                  <Button
                    variant="gold"
                    size="md"
                    rightIcon={<ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />}
                    onClick={() => navigate('/welfare')}
                    aria-label="Read more about this issue"
                  >
                    Read More
                  </Button>
                </div>
              </div>

              {/* ── Right: Decorative panel ── */}
              <div className="relative w-full lg:w-72 xl:w-80 shrink-0 min-h-[160px] lg:min-h-0 overflow-hidden">
                <div className="absolute inset-0" style={{ background: 'color-mix(in srgb, var(--green-primary) 85%, black)' }} />
                <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full opacity-15"
                  style={{ background: 'radial-gradient(circle, var(--gold-old) 0%, transparent 70%)' }}
                />
                <div className="absolute top-1/2 -translate-y-1/2 -left-12 w-48 h-48 rounded-full opacity-10"
                  style={{ background: 'radial-gradient(circle, var(--green-mint) 0%, transparent 70%)' }}
                />
                <div className="absolute top-1/3 right-8 w-3 h-3 rounded-full opacity-40" style={{ background: 'var(--gold-old)' }} />
                <svg className="absolute inset-0 w-full h-full opacity-[0.04]" viewBox="0 0 200 200" preserveAspectRatio="none">
                  <line x1="0" y1="0" x2="200" y2="200" stroke="white" strokeWidth="0.5" />
                  <line x1="200" y1="0" x2="0" y2="200" stroke="white" strokeWidth="0.5" />
                  <line x1="100" y1="0" x2="100" y2="200" stroke="white" strokeWidth="0.3" />
                  <line x1="0" y1="100" x2="200" y2="100" stroke="white" strokeWidth="0.3" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl"
                      style={{ background: 'color-mix(in srgb, var(--gold-old) 15%, transparent)', backdropFilter: 'blur(4px)' }}>
                      🏛️
                    </div>
                    <span className="text-[11px] font-700 uppercase tracking-widest opacity-40" style={{ color: 'var(--gold-old)' }}>
                      GPSA-UDS
                    </span>
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
                  style={{ background: 'linear-gradient(to top, color-mix(in srgb, var(--green-primary) 85%, black) 0%, transparent 100%)' }}
                />
                <div className="absolute top-0 bottom-0 right-0 w-32 pointer-events-none"
                  style={{ background: 'linear-gradient(to left, color-mix(in srgb, var(--green-primary) 85%, black) 0%, transparent 100%)' }}
                />
              </div>
            </div>
          </div>
        ) : (
          <EmptySpotlightCard onBrowse={() => navigate('/welfare')} />
        )}
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
        className="rounded-[1.75rem] p-7 lg:p-10 flex flex-col lg:flex-row gap-7 lg:gap-12 items-start lg:items-center overflow-hidden relative group cursor-pointer transition-all duration-300 hover:-translate-y-0.5 shadow-[0_24px_70px_rgba(0,77,0,0.2)] hover:shadow-[0_32px_90px_rgba(0,77,0,0.28)] bg-brand"
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

        <div className="h-24 w-24 lg:h-28 lg:w-28 rounded-[1.5rem] bg-white/10 flex items-center justify-center text-6xl lg:text-7xl flex-shrink-0 relative group-hover:scale-105 transition-transform duration-500 shadow-inner">
          <span>{event.banner_emoji ?? '🎓'}</span>
        </div>

        <div className="flex-1 relative">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-700 uppercase tracking-widest mb-4"
            style={{ background: 'rgba(255,255,255,0.12)', color: 'var(--gold-old)' }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--gold-old)' }} />
            Featured Event
          </span>
          <h2 className="font-display text-3xl lg:text-5xl font-bold text-white mb-3 leading-none">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
            {data.items.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

// ── Opportunities ─────────────────────────────────────────────────────────────

function OpportunitiesPreview() {
  const navigate = useNavigate()
  const { data, isLoading } = useQuery({
    queryKey: ['opportunities', 'home-list'],
    queryFn: () => opportunitiesApi.list({ limit: 3 }),
    staleTime: 2 * 60 * 1000,
  })

  return (
    <section className="section-padding bg-cream-dark">
      <div className="section-container">
        <SectionHeader
          title="Opportunities"
          subtitle="Internships, scholarships, jobs, and training deadlines"
          action={
            <Button variant="ghost" size="sm" onClick={() => navigate('/opportunities')} rightIcon={<ArrowRight className="h-4 w-4" />}>
              View All
            </Button>
          }
        />

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => <CardSkeleton key={i} />)}
          </div>
        ) : !data?.items?.length ? (
          <EmptyState
            icon="💼"
            title="No open opportunities"
            description="New scholarships, internships, and training notices will appear here."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
            {data.items.map((opportunity) => (
              <OpportunityCard
                key={opportunity.id}
                opportunity={opportunity}
                onApply={() => window.open(opportunity.external_link, '_blank', 'noopener,noreferrer')}
              />
            ))}
          </div>
        )}

        <div className="mt-8 rounded-[1.35rem] bg-white border border-white p-5 flex flex-col sm:flex-row sm:items-center gap-4 shadow-[0_18px_45px_rgba(16,24,40,0.08)]">
          <div className="w-11 h-11 rounded-xl bg-brand flex items-center justify-center flex-shrink-0">
            <Briefcase className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display font-bold text-deep">Have an opportunity for GPSA-UDS students?</p>
            <p className="text-sm text-muted leading-relaxed">Executive and admin teams can publish vetted opportunities from the dashboard.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/opportunities')}>
            Browse
          </Button>
        </div>
      </div>
    </section>
  )
}

// ── Gallery Teaser ────────────────────────────────────────────────────────────

const FALLBACK_GALLERY_ITEMS: Pick<GalleryItem, 'id' | 'image_url' | 'thumbnail_url' | 'title' | 'category' | 'event_date'>[] = [
  { id: 'fallback-1', image_url: slide1, thumbnail_url: null, title: 'GPSA-UDS Campus Life', category: 'events', event_date: null },
  { id: 'fallback-2', image_url: slide2, thumbnail_url: null, title: 'Community and Leadership', category: 'outreach', event_date: null },
  { id: 'fallback-3', image_url: slide3, thumbnail_url: null, title: 'Student Activities', category: 'social', event_date: null },
]

function GalleryPreviewCard({ item }: { item: Pick<GalleryItem, 'image_url' | 'thumbnail_url' | 'title' | 'category' | 'event_date'> }) {
  const image = item.thumbnail_url ?? item.image_url

  return (
    <div className="relative h-52 md:h-60 rounded-2xl overflow-hidden group bg-brand">
      {image ? (
        <img
          src={image}
          alt={item.title}
          loading="lazy"
          className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <ImageIcon className="h-10 w-10 text-white/30" />
        </div>
      )}
      <div className="absolute inset-0"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.12) 55%, transparent 100%)' }}
      />
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <span className="inline-flex mb-2 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-700 uppercase tracking-widest text-white backdrop-blur-sm">
          {item.category}
        </span>
        <p className="font-display font-bold text-white leading-snug line-clamp-2">
          {item.title}
        </p>
      </div>
    </div>
  )
}

function GalleryTeaser() {
  const navigate = useNavigate()
  const { data, isLoading } = useQuery({
    queryKey: ['gallery', 'home-list'],
    queryFn: () => galleryApi.list({ limit: 6 }),
    staleTime: 5 * 60 * 1000,
  })

  const items = data?.length ? data : FALLBACK_GALLERY_ITEMS

  return (
    <section className="section-padding">
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

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-56 rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.slice(0, 6).map((item) => (
              <button key={item.id} onClick={() => navigate('/gallery')} className="text-left transition-transform duration-300 hover:-translate-y-1">
                <GalleryPreviewCard item={item} />
              </button>
            ))}
          </div>
        )}
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
      <LatestUpdates />
      <OpportunitiesPreview />
      <TodayAtGPSA />
      <UpcomingEvents />
      <GalleryTeaser />
      <JoinCTA />
    </>
  )
}
