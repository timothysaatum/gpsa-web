import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowRight, Award, BookOpen, Briefcase, CalendarDays, HeartHandshake,
  Image as ImageIcon, ShieldCheck, Sparkles, Target, Users,
} from 'lucide-react'
import { aboutApi } from '@/api/services'
import { Badge, Button, Skeleton } from '@/components/ui'
import { cn, formatDate, formatDateTime } from '@/utils'
import type { AboutContent } from '@/types'
import slide1 from '@/assets/KCP_4243.jpg'
import slide2 from '@/assets/KCP_4248.jpg'
import slide3 from '@/assets/KCP_4495.jpg'

const fallback: AboutContent = {
  short_name: 'GPSA-UDS',
  name: "Ghana Pharmaceutical Students' Association, UDS",
  tagline: 'Representing pharmacy students with clarity, care, and professional purpose.',
  overview:
    'GPSA-UDS is the representative body for pharmacy students at the University for Development Studies, advancing welfare, academic excellence, professional development, leadership, and community service.',
  mission: 'To empower pharmacy students to thrive academically, socially, and professionally.',
  vision: 'To be a credible, student-centred association recognised for excellence, service, advocacy, and ethical pharmaceutical leadership.',
  values: ['Integrity', 'Service', 'Accountability', 'Academic excellence', 'Student welfare', 'Professional growth'],
  pillars: [
    { title: 'Academic Support', body: 'Resources, learning support, and academic advocacy for every level.' },
    { title: 'Welfare and Care', body: 'Confidential support channels and practical response to student concerns.' },
    { title: 'Professional Growth', body: 'Events, opportunities, and exposure for future pharmacy practice.' },
    { title: 'Community Service', body: 'Outreach and health-focused service shaped by public need.' },
  ],
  timeline: [
    { year: '2015', title: 'Association foundation', body: 'GPSA-UDS began formal student representation and advocacy.' },
    { year: '2018', title: 'Welfare strengthened', body: 'A clearer welfare channel was established for student wellbeing.' },
    { year: '2021', title: 'Academic resource focus', body: 'Academic support expanded through shared learning material.' },
    { year: '2025', title: 'Digital student portal', body: 'Events, resources, welfare, news, gallery, and opportunities moved into one public platform.' },
  ],
  stats: { total_users: 0, active_members: 0, total_events: 0, total_resources: 0 },
  featured_news: null,
  upcoming_events: [],
  open_opportunities: [],
  gallery_highlights: [],
  welfare: {
    emergency_contact: '',
    avg_response_time_hours: 48,
    confidential_percent: 100,
    total_reports: 0,
    total_resolved: 0,
    resolved_this_month: 0,
    trust_items: [],
  },
}

const pillarIcons = [BookOpen, HeartHandshake, Briefcase, Users]
const galleryFallback: AboutContent['gallery_highlights'] = [
  { id: 'one', title: 'Campus life', image_url: slide1, thumbnail_url: null, category: 'events' },
  { id: 'two', title: 'Student leadership', image_url: slide2, thumbnail_url: null, category: 'community' },
  { id: 'three', title: 'Shared purpose', image_url: slide3, thumbnail_url: null, category: 'welfare' },
]

export function AboutPage() {
  const navigate = useNavigate()
  const { data, isLoading, isError } = useQuery({
    queryKey: ['about'],
    queryFn: aboutApi.get,
    staleTime: 5 * 60 * 1000,
  })
  const about = data ?? fallback
  const gallery = about.gallery_highlights.length ? about.gallery_highlights : galleryFallback

  return (
    <>
      <HeroSection about={about} isLoading={isLoading} onJoin={() => navigate('/register')} />
      <StatsSection stats={about.stats} />
      <IdentitySection about={about} />
      <PillarsSection pillars={about.pillars} />
      <LiveSection about={about} isError={isError} />
      <GalleryBand gallery={gallery} onOpen={() => navigate('/gallery')} />
      <TimelineSection timeline={about.timeline} />
      <FinalCta onJoin={() => navigate('/register')} onWelfare={() => navigate('/welfare')} />
    </>
  )
}

function HeroSection({
  about,
  isLoading,
  onJoin,
}: {
  about: AboutContent
  isLoading: boolean
  onJoin: () => void
}) {
  return (
    <section className="px-5 sm:px-8 lg:px-10 pt-8 lg:pt-12 pb-12">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_0.86fr] gap-8 items-center">
        <div className="py-8 lg:py-12">
          <Badge variant="gold" className="mb-5">About {about.short_name}</Badge>
          {isLoading ? (
            <div className="space-y-4 max-w-2xl">
              <Skeleton className="h-16 rounded-xl" />
              <Skeleton className="h-16 w-5/6 rounded-xl" />
              <Skeleton className="h-5 w-3/4 rounded" />
            </div>
          ) : (
            <>
              <h1 className="font-display font-bold text-deep leading-[1.02] mb-5" style={{ fontSize: 'clamp(3rem, 7vw, 5.8rem)' }}>
                Students first. Pharmacy forward.
              </h1>
              <p className="text-lg text-muted leading-relaxed max-w-2xl mb-8">
                {about.tagline}
              </p>
            </>
          )}
          <div className="flex flex-wrap gap-3">
            <Button variant="primary" size="lg" onClick={onJoin} rightIcon={<ArrowRight className="h-4 w-4" />}>
              Join GPSA-UDS
            </Button>
            <Button variant="outline" size="lg" onClick={() => document.getElementById('about-live')?.scrollIntoView({ behavior: 'smooth' })}>
              See what is happening
            </Button>
          </div>
        </div>

        <div className="relative min-h-[420px]">
          <img src={slide1} alt="GPSA-UDS students" className="absolute left-0 top-0 h-[74%] w-[68%] rounded-2xl object-cover shadow-xl" />
          <img src={slide2} alt="GPSA-UDS community activity" className="absolute right-0 bottom-0 h-[64%] w-[58%] rounded-2xl object-cover shadow-xl border-4 border-white" />
          <div className="absolute right-6 top-10 rounded-2xl bg-white p-4 shadow-lg border border-cream-dark max-w-[220px]">
            <p className="text-[11px] font-700 uppercase tracking-widest text-muted mb-2">Built for</p>
            <p className="font-display text-2xl font-bold text-green-700 leading-none">Advocacy, care and excellence</p>
          </div>
        </div>
      </div>
    </section>
  )
}

function StatsSection({ stats }: { stats: AboutContent['stats'] }) {
  const items = [
    { label: 'Students represented', value: stats.total_users, icon: Users },
    { label: 'Active members', value: stats.active_members, icon: ShieldCheck },
    { label: 'Events hosted', value: stats.total_events, icon: CalendarDays },
    { label: 'Academic resources', value: stats.total_resources, icon: BookOpen },
  ]
  return (
    <section className="bg-brand text-white">
      <div className="section-container py-8 grid grid-cols-2 lg:grid-cols-4 divide-x divide-white/10">
        {items.map(({ label, value, icon: Icon }) => (
          <div key={label} className="px-4 py-5 text-center">
            <Icon className="h-5 w-5 mx-auto mb-3 text-white/55" />
            <p className="font-display text-4xl font-bold leading-none">{value.toLocaleString()}+</p>
            <p className="text-[11px] font-700 uppercase tracking-widest text-white/60 mt-2">{label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function IdentitySection({ about }: { about: AboutContent }) {
  return (
    <section className="section-padding">
      <div className="section-container grid grid-cols-1 lg:grid-cols-[0.8fr_1fr] gap-10 lg:gap-14 items-start">
        <div>
          <p className="text-xs font-700 uppercase tracking-widest text-green-700 mb-3">Who we are</p>
          <h2 className="font-display text-4xl lg:text-5xl font-bold text-deep leading-tight mb-5">{about.name}</h2>
          <p className="text-muted leading-relaxed">{about.overview}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Principle icon={Target} title="Mission" body={about.mission} />
          <Principle icon={Award} title="Vision" body={about.vision} />
          <div className="sm:col-span-2 rounded-2xl border border-cream-dark bg-white p-6">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="h-5 w-5 text-gold-500" />
              <h3 className="font-display text-2xl font-bold text-deep">Values that guide us</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {about.values.map((value) => <Badge key={value} variant="green">{value}</Badge>)}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Principle({ icon: Icon, title, body }: { icon: typeof Target; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-cream-dark bg-white p-6">
      <div className="w-11 h-11 rounded-xl bg-green-100 flex items-center justify-center mb-5">
        <Icon className="h-5 w-5 text-green-700" />
      </div>
      <h3 className="font-display text-2xl font-bold text-deep mb-2">{title}</h3>
      <p className="text-sm text-muted leading-relaxed">{body}</p>
    </div>
  )
}

function PillarsSection({ pillars }: { pillars: AboutContent['pillars'] }) {
  return (
    <section className="section-padding bg-cream-dark">
      <div className="section-container">
        <div className="max-w-2xl mb-8">
          <p className="text-xs font-700 uppercase tracking-widest text-green-700 mb-3">What we do</p>
          <h2 className="section-title">A practical association, not just a name</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {pillars.map((pillar, index) => {
            const Icon = pillarIcons[index] ?? Users
            return (
              <div key={pillar.title} className="bg-white rounded-2xl border border-cream-dark p-6 transition-all hover:-translate-y-1 hover:shadow-xl">
                <div className="w-11 h-11 rounded-xl bg-brand flex items-center justify-center mb-5">
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-display text-xl font-bold text-deep mb-2">{pillar.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{pillar.body}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function LiveSection({ about, isError }: { about: AboutContent; isError: boolean }) {
  const navigate = useNavigate()
  return (
    <section id="about-live" className="section-padding">
      <div className="section-container">
        <div className="flex items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-700 uppercase tracking-widest text-green-700 mb-3">Live from the portal</p>
            <h2 className="section-title">What GPSA-UDS is doing now</h2>
          </div>
          {isError && <Badge variant="orange">Showing fallback content</Badge>}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <LivePanel title="Featured news" empty="No featured news yet" onClick={() => about.featured_news && navigate(`/news/${about.featured_news.id}`)}>
            {about.featured_news && (
              <>
                <Badge variant="gold" className="mb-4">{about.featured_news.category}</Badge>
                <h3 className="font-display text-2xl font-bold text-deep leading-tight mb-3">{about.featured_news.title}</h3>
                <p className="text-sm text-muted line-clamp-3">{about.featured_news.summary}</p>
              </>
            )}
          </LivePanel>
          <LivePanel title="Upcoming events" empty="No upcoming events yet">
            <div className="space-y-3">
              {about.upcoming_events.map((event) => (
                <button key={event.id} onClick={() => navigate(`/events/${event.id}`)} className="block w-full text-left rounded-xl border border-cream-dark p-3 hover:border-green-300">
                  <p className="font-700 text-sm text-deep line-clamp-1">{event.title}</p>
                  <p className="text-xs text-muted mt-1">{formatDateTime(event.start_datetime)} · {event.location}</p>
                </button>
              ))}
            </div>
          </LivePanel>
          <LivePanel title="Open opportunities" empty="No open opportunities yet">
            <div className="space-y-3">
              {about.open_opportunities.map((opp) => (
                <button key={opp.id} onClick={() => navigate(`/opportunities/${opp.id}`)} className="block w-full text-left rounded-xl border border-cream-dark p-3 hover:border-green-300">
                  <p className="font-700 text-sm text-deep line-clamp-1">{opp.title}</p>
                  <p className="text-xs text-muted mt-1">{opp.organization} · Deadline {formatDate(opp.deadline)}</p>
                </button>
              ))}
            </div>
          </LivePanel>
        </div>
      </div>
    </section>
  )
}

function LivePanel({ title, empty, children, onClick }: { title: string; empty: string; children: React.ReactNode; onClick?: () => void }) {
  const hasContent = Boolean(children)
  return (
    <div onClick={onClick} className={cn('rounded-2xl bg-white border border-cream-dark p-6 min-h-[260px]', onClick && 'cursor-pointer hover:shadow-xl transition-all')}>
      <h3 className="font-display text-2xl font-bold text-green-700 mb-5">{title}</h3>
      {hasContent ? children : <p className="text-sm text-muted">{empty}</p>}
    </div>
  )
}

function GalleryBand({ gallery, onOpen }: { gallery: AboutContent['gallery_highlights']; onOpen: () => void }) {
  return (
    <section className="section-padding bg-cream-dark">
      <div className="section-container">
        <div className="flex items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-700 uppercase tracking-widest text-green-700 mb-3">Community moments</p>
            <h2 className="section-title">Life beyond the lecture hall</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onOpen} rightIcon={<ArrowRight className="h-4 w-4" />}>Gallery</Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {gallery.slice(0, 4).map((item) => {
            const src = item.thumbnail_url ?? item.image_url
            return (
              <button key={item.id} onClick={onOpen} className="relative h-56 rounded-2xl overflow-hidden bg-brand text-left group">
                {src ? <img src={src} alt={item.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" /> : <ImageIcon className="h-8 w-8 text-white/30 m-6" />}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <p className="absolute bottom-4 left-4 right-4 text-white font-700 text-sm line-clamp-2">{item.title}</p>
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function TimelineSection({ timeline }: { timeline: AboutContent['timeline'] }) {
  return (
    <section className="section-padding">
      <div className="section-container grid grid-cols-1 lg:grid-cols-[0.45fr_1fr] gap-10">
        <div>
          <p className="text-xs font-700 uppercase tracking-widest text-green-700 mb-3">Our journey</p>
          <h2 className="section-title">Built step by step</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {timeline.map((item) => (
            <div key={item.year} className="rounded-2xl border border-cream-dark bg-white p-6">
              <p className="font-display text-4xl font-bold text-green-700 mb-3">{item.year}</p>
              <h3 className="font-700 text-deep mb-2">{item.title}</h3>
              <p className="text-sm text-muted leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function FinalCta({ onJoin, onWelfare }: { onJoin: () => void; onWelfare: () => void }) {
  return (
    <section className="section-padding">
      <div className="section-container">
        <div className="rounded-3xl bg-brand text-white p-8 lg:p-12 flex flex-col lg:flex-row lg:items-center gap-8 justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-700 uppercase tracking-widest text-white/50 mb-3">Get involved</p>
            <h2 className="font-display text-4xl lg:text-5xl font-bold leading-tight mb-3">Your voice belongs here.</h2>
            <p className="text-white/65 leading-relaxed">Join the association, attend events, use the academic hub, and reach out when support is needed.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="gold" size="lg" onClick={onJoin}>Create Account</Button>
            <Button variant="outline-white" size="lg" onClick={onWelfare}>Welfare Support</Button>
          </div>
        </div>
      </div>
    </section>
  )
}
