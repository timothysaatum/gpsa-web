import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useState, useEffect, useCallback } from 'react'
import { ArrowRight, BookOpen, Heart, Newspaper, Briefcase, Users, ChevronLeft, ChevronRight } from 'lucide-react'
import { eventsApi } from '@/api/services'
import { Button, CardSkeleton, EmptyState, SectionHeader } from '@/components/ui'
import { EventCard, CountdownBlock } from '@/components/shared'
import { cn, formatDateTime } from '@/utils'
import slide1 from '@/assets/KCP_4243.jpg'
import slide2 from '@/assets/KCP_4248.jpg'
import slide3 from '@/assets/KCP_4495.jpg'

// ── Hero Carousel ─────────────────────────────────────────────────────────────

const SLIDES = [
  {
    img: slide1,
    tag: 'Health Week 2025',
    heading: 'Welcome to',
    highlight: 'GPSA-UDS',
    sub: 'Empowering pharmacy students through academics, welfare, and professional development at UDS.',
    primaryButton: { label: 'Read More', path: '/about' },
    secondaryButton: { label: 'Register for Events', path: '/events' },
  },
  {
    img: slide2,
    tag: 'Community & Events',
    heading: 'One Family,',
    highlight: 'One Vision',
    sub: 'Join hundreds of pharmacy students driving change through collaboration and professional excellence.',
    primaryButton: { label: 'View Gallery', path: '/gallery' },
    secondaryButton: { label: 'Explore Academics', path: '/academics' },
  },
  {
    img: slide3,
    tag: 'GPSA-UDS Welfare',
    heading: 'Your Wellbeing,',
    highlight: 'Our Priority',
    sub: 'Access welfare support, academic resources, and exciting opportunities — all in one place.',
    primaryButton: { label: 'Latest News', path: '/news' },
    secondaryButton: { label: 'Get Support', path: '/welfare' },
  },
]

function Hero() {
  const navigate = useNavigate()
  const [current, setCurrent] = useState(0)
  const [animating, setAnimating] = useState(false)

  const go = useCallback((next: number) => {
    if (animating) return
    setAnimating(true)
    setTimeout(() => {
      setCurrent(next)
      setAnimating(false)
    }, 400)
  }, [animating])

  const prev = () => go((current - 1 + SLIDES.length) % SLIDES.length)
  const next = () => go((current + 1) % SLIDES.length)

  // Auto-advance
  useEffect(() => {
    const t = setTimeout(() => go((current + 1) % SLIDES.length), 5500)
    return () => clearTimeout(t)
  }, [current, go])

  const slide = SLIDES[current]

  return (
    <section className="relative overflow-hidden flex items-end z-40" style={{ height: 'calc(100vh - 70px)' }}>

      {/* ── Photo layer ── */}
      <div
        className="absolute inset-0 transition-opacity duration-700"
        style={{ opacity: animating ? 0 : 1 }}
      >
        <img
          key={slide.img}
          src={slide.img}
          alt=""
          className="w-full h-full object-cover object-center"
        />
      </div>

      {/* ── Gradient overlays ── */}
      {/* Bottom-up brand tint for text legibility */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to top, rgba(41,163,41,0.86) 0%, rgba(41,163,41,0.45) 40%, rgba(41,163,41,0.08) 75%, transparent 100%)',
        }}
      />
      {/* Left diagonal green brand tint */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(120deg, rgba(41,163,41,0.35) 0%, transparent 55%)',
        }}
      />
      {/* Accent gold glow top-right */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 85% 10%, rgba(242,193,46,0.18) 0%, transparent 50%)',
        }}
      />

      {/* ── Content ── */}
      <div className="relative w-full section-container pb-8 lg:pb-16 pt-8 lg:pt-12 h-full flex flex-col justify-end">
        <div
          className="max-w-2xl relative z-50"
          style={{
            opacity: animating ? 0 : 1,
            transform: animating ? 'translateY(12px)' : 'translateY(0)',
            transition: 'opacity 0.5s ease, transform 0.5s ease',
          }}
        >
          {/* Tag pill */}
          <span
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-700 uppercase tracking-widest mb-6"
            style={{
              background: '#29a329',
              color: '#ffffff',
            }}
          >
            <span className="w-1.5 h-1.5 bg-white rounded-full opacity-60" />
            {slide.tag}
          </span>

          <h1
            className="font-display font-bold text-white leading-[1.03] tracking-tight mb-4"
            style={{ fontSize: 'clamp(2.8rem, 7vw, 5rem)' }}
          >
            {slide.heading}{' '}
            <span
              style={{
                backgroundImage: 'linear-gradient(90deg, #F2C12E, #f5cf55)',
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
              onClick={() => navigate(slide.primaryButton.path)}
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              {slide.primaryButton.label}
            </Button>
            <Button variant="outline-white" size="lg" onClick={() => navigate(slide.secondaryButton.path)}>
              {slide.secondaryButton.label}
            </Button>
          </div>
        </div>

        {/* ── Stats row ── */}
        {/* Removed per user request */}

        {/* ── Carousel controls ── */}
        <div className="mt-10 flex items-center gap-4 relative z-50">
          {/* Dot indicators */}
          <div className="flex gap-2">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => go(i)}
                className="transition-all duration-300 rounded-full"
                style={{
                  width:  i === current ? 28 : 8,
                  height: 8,
                  background: i === current
                    ? '#29a329'
                    : 'rgba(255,255,255,0.35)',
                }}
              />
            ))}
          </div>

          {/* Prev / Next */}
          <div className="flex gap-2 ml-auto">
            <button
              onClick={prev}
              className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white/15 transition-all"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={next}
              className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white/15 transition-all"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Quick actions ─────────────────────────────────────────────────────────────

function QuickActions() {
  const navigate = useNavigate()
  const actions = [
    { icon: Users,     label: 'Join GPSA',      desc: 'Register as an official member',     to: '/register',  color: 'bg-green-gradient text-white', border: 'hover:border-green-300' },
    { icon: Heart,     label: 'Welfare',         desc: 'Report issues or request help',      to: '/welfare',   color: 'bg-gold-50 text-gold-700',   border: 'hover:border-gold-200' },
    { icon: BookOpen,  label: 'Academics',       desc: 'Slides, questions, lab reports',     to: '/academics', color: 'bg-cream-dark text-green-700', border: 'hover:border-green-300' },
    { icon: Newspaper, label: 'Latest News',     desc: 'Official updates & announcements',   to: '/news',      color: 'bg-gold-50 text-gold-700', border: 'hover:border-gold-200' },
  ]
  return (
    <section className="section-padding bg-cream-dark">
      <div className="section-container">
        <SectionHeader title="Quick Actions" subtitle="Jump straight to what you need" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {actions.map(({ icon: Icon, label, desc, to, color, border }) => (
            <button
              key={label}
              onClick={() => navigate(to)}
              className={cn('card p-5 lg:p-6 text-left border hover:shadow-card-md hover:-translate-y-1 transition-all group', border)}
            >
              <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center mb-4', color)}>
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-body font-700 text-green-800 mb-1 group-hover:text-green-700 transition-colors text-sm lg:text-base">{label}</h3>
              <p className="text-xs text-green-600 leading-relaxed hidden sm:block">{desc}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-700 text-green-700">
                Explore <ArrowRight className="h-3 w-3" />
              </span>
            </button>
          ))}
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
    <div className="section-container mb-10">
      <div className="h-56 skeleton rounded-3xl" />
    </div>
  )
  if (!event) return null

  return (
    <div className="section-container mb-12">
      <div
        className="rounded-3xl p-8 lg:p-10 flex flex-col lg:flex-row gap-8 items-start lg:items-center overflow-hidden relative"
        style={{ background: 'linear-gradient(90deg, #A8D5BA 0%, #00B140 100%)' }}
      >
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 80% 50%, rgba(242,193,46,0.15) 0%, transparent 60%)' }}
        />
        <div className="text-5xl lg:text-6xl flex-shrink-0 relative">{event.banner_emoji ?? '🎓'}</div>
        <div className="flex-1 relative">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gold-500/15 text-gold-700 rounded-full text-xs font-700 uppercase tracking-wide mb-3">
            ⭐ Featured Event
          </span>
          <h2 className="font-display text-2xl lg:text-3xl font-bold text-white mb-2">{event.title}</h2>
          <p className="text-white/60 text-sm mb-4">
            📅 {formatDateTime(event.start_datetime)} &nbsp;·&nbsp; 📍 {event.location}
          </p>
          <CountdownBlock targetDate={event.start_datetime} className="mb-5" />
          <Button variant="gold" size="md" onClick={() => navigate(`/events/${event.id}`)}>
            Register Now →
          </Button>
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
        ) : !data?.items.length ? (
          <EmptyState icon="📅" title="No upcoming events" description="Check back soon for new events." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.items.map((e) => (
              <EventCard key={e.id} event={e} onRegister={() => navigate(`/events/${e.id}`)} />
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
            style={{ background: 'linear-gradient(90deg, #A8D5BA 0%, #00B140 100%)' }}
            onClick={() => navigate('/opportunities')}
          >
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse at 80% 20%, rgba(242,193,46,0.18) 0%, transparent 60%)' }}
            />
            <div className="relative">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
                style={{ background: 'rgba(242,193,46,0.18)' }}
              >
                <Briefcase className="h-7 w-7 text-[#F2C12E]" />
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
            className="rounded-3xl p-8 border border-cream-dark relative overflow-hidden cursor-pointer group bg-white"
            onClick={() => navigate('/welfare')}
          >
            <div
              className="absolute top-0 right-0 w-48 h-48 rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(239,68,68,0.07) 0%, transparent 70%)', transform: 'translate(30%, -30%)' }}
            />
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
              style={{ background: 'rgba(239,68,68,0.08)' }}
            >
              <Heart className="h-7 w-7 text-red-500" />
            </div>
            <h3 className="font-display text-2xl font-bold text-green-700 mb-3">GPSA-UDS Welfare</h3>
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
            style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(41,163,41,0.15) 0%, transparent 60%)' }}
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