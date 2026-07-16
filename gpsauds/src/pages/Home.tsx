import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useState, useEffect, useCallback } from 'react'
import { ArrowRight, BookOpen, Heart, Newspaper, Briefcase, Users, ChevronLeft, ChevronRight } from 'lucide-react'
import { eventsApi, heroApi } from '@/api/services'
import { Button, CardSkeleton, EmptyState, SectionHeader } from '@/components/ui'
import { EventCard, CountdownBlock } from '@/components/shared'
import { cn, formatDateTime } from '@/utils'
import slide1 from '@/assets/KCP_4243.jpg'
import slide2 from '@/assets/KCP_4248.jpg'
import slide3 from '@/assets/KCP_4495.jpg'
import type { HeroSlide } from '@/types'

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

  // Auto-advance + progress bar
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
    <div className="section-container">
      <section className="relative overflow-hidden z-40 rounded-3xl aspect-[16/9] md:aspect-[21/9]">

        {/* ── Photo layer with scale transition ── */}
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

        {/* ── Single elegant gradient overlay ── */}
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

        {/* Subtle pattern overlay */}
        <div
          className="absolute inset-0 rounded-3xl opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px',
          }}
        />

        {/* ── Content ── */}
        <div className="relative w-full h-full flex flex-col justify-center px-8 lg:px-14 pt-24 lg:pt-28 pb-20 lg:pb-24">
          <div className="max-w-2xl relative z-50"
            style={{
              opacity: animating ? 0 : 1,
              transform: animating ? 'translateY(20px)' : 'translateY(0)',
              transition: 'opacity 0.5s ease 0.1s, transform 0.5s ease 0.1s',
            }}
          >
            {/* Tag pill */}
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

          {/* ── Bottom controls bar ── */}
          <div className="mt-auto relative z-50">
            {/* Progress bar */}
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
              {/* Dot indicators + counter */}
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

              {/* Prev / Next */}
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
      accent: 'bg-green-gradient',
      iconColor: 'text-white',
      barColor: 'bg-green-500',
      hoverGlow: 'hover:shadow-green-500/10',
      borderGlow: 'group-hover:border-green-300',
    },
    {
      icon: Heart, label: 'Welfare',
      desc: 'Report issues or request help',
      to: '/welfare',
      accent: 'bg-gold-500',
      iconColor: 'text-white',
      barColor: 'bg-gold-500',
      hoverGlow: 'hover:shadow-gold-500/10',
      borderGlow: 'group-hover:border-gold-300',
    },
    {
      icon: BookOpen, label: 'Academics',
      desc: 'Slides, questions, lab reports',
      to: '/academics',
      accent: 'bg-emerald-600',
      iconColor: 'text-white',
      barColor: 'bg-emerald-600',
      hoverGlow: 'hover:shadow-emerald-500/10',
      borderGlow: 'group-hover:border-emerald-300',
    },
    {
      icon: Newspaper, label: 'Latest News',
      desc: 'Official updates & announcements',
      to: '/news',
      accent: 'bg-sky-600',
      iconColor: 'text-white',
      barColor: 'bg-sky-600',
      hoverGlow: 'hover:shadow-sky-500/10',
      borderGlow: 'group-hover:border-sky-300',
    },
  ]
  return (
    <section className="relative overflow-hidden">
      {/* Subtle background texture */}
      <div className="absolute inset-0 bg-cream-dark" />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle at 25% 50%, var(--green-bright-old) 1px, transparent 1px)`,
          backgroundSize: '32px 32px',
        }}
      />
      <div className="relative section-padding">
        <div className="section-container">
          <SectionHeader title="Quick Actions" subtitle="Jump straight to what you need" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {actions.map(({ icon: Icon, label, desc, to, accent, iconColor, barColor, hoverGlow, borderGlow }) => (
              <button
                key={label}
                onClick={() => navigate(to)}
                className={cn(
                  'group relative bg-white rounded-2xl p-6 text-left transition-all duration-300',
                  'border border-cream-dark hover:-translate-y-1',
                  'hover:shadow-xl',
                  borderGlow,
                  hoverGlow,
                )}
              >
                {/* Coloured top bar */}
                <div className={cn('absolute top-0 left-6 right-6 h-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300', barColor)} />

                {/* Icon */}
                <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center mb-5 shadow-sm', accent, iconColor)}>
                  <Icon className="h-6 w-6" />
                </div>

                {/* Label */}
                <h3 className="font-display font-bold text-green-800 text-lg mb-1.5 group-hover:text-green-700 transition-colors">
                  {label}
                </h3>

                {/* Description */}
                <p className="text-sm text-muted leading-relaxed mb-5">
                  {desc}
                </p>

                {/* CTA */}
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
      </div>
    </section>
  )
}

// ── Featured event ────────────────────────────────────────────────────────────

function FeaturedEvent() {
  const navigate = useNavigate()
  const { data: event, isLoading } = useQuery({
    queryKey: ['events', 'featured'],
    queryFn: eventsApi.getFeatured,
    staleTime: 2 * 60 * 1000,
  })

  if (isLoading) return (
    <div className="section-container mb-12">
      <div className="h-56 skeleton rounded-3xl" />
    </div>
  )
  if (!event) return null

  return (
    <div className="section-container mb-12">
      <div
        className="rounded-3xl p-8 lg:p-12 flex flex-col lg:flex-row gap-8 lg:gap-14 items-start lg:items-center overflow-hidden relative group cursor-pointer transition-shadow duration-300 hover:shadow-2xl"
        style={{ background: 'var(--legacy-gradient)' }}
        onClick={() => navigate(`/events/${event.id}`)}
      >
        {/* Pattern overlay */}
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        {/* Gold glow */}
        <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{ background: 'radial-gradient(ellipse at 30% 50%, color-mix(in srgb, var(--gold-old) 20%, transparent) 0%, transparent 60%)' }}
        />

        {/* Icon */}
        <div className="text-6xl lg:text-7xl flex-shrink-0 relative group-hover:scale-105 transition-transform duration-500">
          {event.banner_emoji ?? '🎓'}
        </div>

        {/* Content */}
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
    queryKey: ['events', 'upcoming'],
    queryFn: () => eventsApi.list({ event_status: 'upcoming', limit: 3 }),
  })

  return (
    <section className="section-padding">
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
        <FeaturedEvent />
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

// ── Opportunities & Welfare ───────────────────────────────────────────────────

function SplitCards() {
  const navigate = useNavigate()
  return (
    <section className="section-padding bg-cream-dark">
      <div className="section-container">
        <SectionHeader title="Opportunities & Welfare" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Opportunities */}
          <div
            className="rounded-3xl p-8 relative overflow-hidden cursor-pointer group"
            style={{ background: 'var(--legacy-gradient)' }}
            onClick={() => navigate('/opportunities')}
          >
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse at 80% 20%, color-mix(in srgb, var(--gold-old) 18%, transparent) 0%, transparent 60%)' }}
            />
            <div className="relative">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
                style={{ background: 'color-mix(in srgb, var(--gold-old) 18%, transparent)' }}
              >
                <Briefcase className="h-7 w-7 text-gold-500" />
              </div>
              <h3 className="font-display text-2xl font-bold text-white mb-3">Opportunities Hub</h3>
              <p className="text-white/65 text-sm leading-relaxed mb-6">
                Internships, scholarships, jobs and training programmes curated for pharmacy students at UDS.
              </p>
              <Button variant="gold" size="md" className="group-hover:shadow-glow-gold transition-shadow">
                Browse Opportunities →
              </Button>
            </div>
          </div>

          {/* Welfare */}
          <div
            className="rounded-3xl p-8 relative overflow-hidden cursor-pointer group bg-white border-2 border-green-100 hover:border-green-200 transition-colors"
            onClick={() => navigate('/welfare')}
          >
            <div
              className="absolute top-0 right-0 w-48 h-48 rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, color-mix(in srgb, var(--green-bright-old) 10%, transparent) 0%, transparent 70%)', transform: 'translate(30%, -30%)' }}
            />
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
              style={{ background: 'color-mix(in srgb, var(--green-bright-old) 12%, transparent)' }}
            >
              <Heart className="h-7 w-7" style={{ color: 'var(--green-bright-old)' }} />
            </div>
            <h3 className="font-display text-2xl font-bold mb-3" style={{ color: 'var(--green-primary)' }}>Welfare Support</h3>
            <p className="text-muted text-sm leading-relaxed mb-6">
              Report issues, request support, or submit confidential concerns. We are here for you — always.
            </p>
            <Button variant="primary" size="md">Get Support →</Button>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Student voice CTA ─────────────────────────────────────────────────────────

function StudentVoice() {
  const navigate = useNavigate()
  return (
    <section className="section-padding bg-cream-dark">
      <div className="section-container">
        <div
          className="rounded-3xl p-10 lg:p-14 text-center max-w-2xl mx-auto relative overflow-hidden bg-cream-dark border border-cream-dark"
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 50% 0%, color-mix(in srgb, var(--green-bright-old) 15%, transparent) 0%, transparent 60%)' }}
          />
          <span className="text-4xl mb-5 block relative">🗣️</span>
          <h3 className="font-display text-3xl font-bold text-green-700 mb-3 relative">Have Something to Say?</h3>
          <p className="text-green-600 text-base mb-7 max-w-md mx-auto relative">
            Your voice shapes the decisions we make. Submit a suggestion, report an issue,
            or request support — confidentially if you prefer.
          </p>
          <Button variant="primary" size="md" onClick={() => navigate('/welfare')}>
            Get In Touch →
          </Button>
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
      <QuickActions />
      <UpcomingEvents />
      <SplitCards />
      <StudentVoice />
    </>
  )
}