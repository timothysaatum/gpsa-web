import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  MapPin, Calendar, X, CheckCircle, AlertCircle, Search,
  ChevronLeft, ChevronRight, Plus, SlidersHorizontal, Clock,
  User,
} from 'lucide-react'
import { eventsApi } from '@/api/services'
import { useAuthStore } from '@/store/authStore'
import { extractError } from '@/api/client'
import { Button, Badge, EmptyState, Skeleton } from '@/components/ui'
import { EventCard, PageHeader } from '@/components/shared'
import { cn, formatDateTime, EVENT_TYPE_LABELS } from '@/utils'
import type { EventStatus, EventType } from '@/types'

// ── Registration Modal ────────────────────────────────────────────────────────

const regSchema = z.object({
  full_name: z.string().min(2, 'Name is required'),
  level: z.string().optional(),
  contact: z.string().optional(),
  notes: z.string().optional(),
})
type RegForm = z.infer<typeof regSchema>

function RegistrationModal({
  eventId, eventTitle, onClose,
}: { eventId: string; eventTitle: string; onClose: () => void }) {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [done, setDone] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<RegForm>({
    resolver: zodResolver(regSchema),
    defaultValues: {
      full_name: user?.full_name ?? '',
      level: user?.level ? String(user.level) : '',
      contact: user?.email ?? '',
    },
  })

  const mutation = useMutation({
    mutationFn: (data: RegForm) =>
      eventsApi.register(eventId, {
        full_name: data.full_name,
        level: data.level ? parseInt(data.level) : undefined,
        contact: data.contact,
        notes: data.notes,
      }),
    onSuccess: () => {
      setDone(true)
      qc.invalidateQueries({ queryKey: ['events'] })
    },
  })

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-card-lg w-full max-w-md p-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="font-display text-2xl font-bold text-green-700">Register for Event</h2>
            <p className="text-sm text-muted mt-1">{eventTitle}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-cream-dark text-muted transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {done ? (
          <div className="text-center py-6">
            <CheckCircle className="h-14 w-14 text-green-700 mx-auto mb-4" />
            <h3 className="font-display text-xl font-bold text-green-700 mb-2">You're registered!</h3>
            <p className="text-sm text-muted mb-6">See you at the event. A confirmation has been sent if you provided an email.</p>
            <Button variant="primary" size="md" onClick={onClose} className="w-full">Close</Button>
          </div>
        ) : (
          <>
            {mutation.error && (
              <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3.5 text-sm text-red-600">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {extractError(mutation.error)}
              </div>
            )}
            <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
              <div>
                <label className="form-label">Full Name *</label>
                <input {...register('full_name')} className={cn('form-input', errors.full_name && 'form-input-error')} />
                {errors.full_name && <p className="form-error">{errors.full_name.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Level</label>
                  <select {...register('level')} className="form-select">
                    <option value="">Select…</option>
                    {[100,200,300,400,500,600].map((l) => <option key={l} value={l}>Level {l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Contact (Email/Phone)</label>
                  <input {...register('contact')} className="form-input" placeholder="Optional" />
                </div>
              </div>
              <div>
                <label className="form-label">Notes <span className="text-muted font-normal">(optional)</span></label>
                <textarea {...register('notes')} className="form-input resize-none h-20" placeholder="Any notes or special requests…" />
              </div>
              <Button type="submit" variant="primary" size="lg" loading={mutation.isPending} className="w-full">
                Confirm Registration
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

// ── Agenda renderer ───────────────────────────────────────────────────────────

function AgendaView({ agenda }: { agenda: unknown }) {
  if (!agenda) return null
  if (typeof agenda === 'string') {
    return <p className="text-muted leading-relaxed whitespace-pre-wrap">{agenda}</p>
  }
  if (Array.isArray(agenda)) {
    return (
      <ol className="space-y-3">
        {agenda.map((item, i) => {
          if (typeof item === 'string') {
            return <li key={i} className="flex items-start gap-3 text-muted"><span className="w-6 h-6 rounded-full bg-green-100 text-green-700 text-xs font-700 flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>{item}</li>
          }
          const time = item?.time ?? item?.start_time ?? ''
          const title = item?.title ?? item?.topic ?? item?.label ?? ''
          return (
            <li key={i} className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-green-100 text-green-700 text-xs font-700 flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
              <div>
                {time && <p className="text-xs font-700 text-green-700 mb-0.5">{time}</p>}
                <p className="text-muted">{title}</p>
              </div>
            </li>
          )
        })}
      </ol>
    )
  }
  if (typeof agenda === 'object') {
    const entries = Object.entries(agenda as Record<string, unknown>)
    if (!entries.length) return null
    return (
      <div className="space-y-3">
        {entries.map(([time, item]) => (
          <div key={time} className="flex items-start gap-3">
            <span className="text-xs font-700 text-green-700 whitespace-nowrap min-w-[60px] pt-0.5">{time}</span>
            <p className="text-muted">{String(item)}</p>
          </div>
        ))}
      </div>
    )
  }
  return null
}

// ── Speakers renderer ─────────────────────────────────────────────────────────

function SpeakersView({ speakers }: { speakers: unknown }) {
  if (!speakers) return null
  if (typeof speakers === 'string') {
    return <p className="text-muted">{speakers}</p>
  }
  if (Array.isArray(speakers)) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {speakers.map((s, i) => {
          if (typeof s === 'string') {
            return (
              <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-cream-dark">
                <div className="w-10 h-10 rounded-full bg-green-700/10 flex items-center justify-center flex-shrink-0">
                  <User className="h-5 w-5 text-green-700" />
                </div>
                <p className="font-600 text-deep text-sm">{s}</p>
              </div>
            )
          }
          return (
            <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-cream-dark">
              <div className="w-10 h-10 rounded-full bg-green-700/10 flex items-center justify-center flex-shrink-0">
                <User className="h-5 w-5 text-green-700" />
              </div>
              <div>
                <p className="font-600 text-deep text-sm">{s?.name ?? s?.full_name ?? `Speaker ${i + 1}`}</p>
                {s?.role && <p className="text-xs text-muted">{s.role}</p>}
                {s?.affiliation && <p className="text-xs text-muted">{s.affiliation}</p>}
              </div>
            </div>
          )
        })}
      </div>
    )
  }
  return null
}

// ── Event card skeleton ───────────────────────────────────────────────────────

function EventCardSkeleton() {
  return (
    <div className="card p-5 space-y-4">
      <Skeleton className="h-1.5 w-full rounded-full" />
      <div className="flex items-start justify-between gap-3">
        <Skeleton className="w-12 h-14 rounded-xl" />
        <Skeleton className="h-5 w-24 rounded-full" />
      </div>
      <Skeleton className="h-5 w-3/4" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
      </div>
      <Skeleton className="h-10 w-full rounded-xl" />
    </div>
  )
}

// ── Breadcrumbs ───────────────────────────────────────────────────────────────

function EventsBreadcrumbs({ eventTitle }: { eventTitle?: string }) {
  const navigate = useNavigate()
  const crumbs = [
    { label: 'Home', path: '/' },
    { label: 'Events', path: '/events' },
  ]
  if (eventTitle) {
    crumbs.push({ label: eventTitle, path: '#' })
  }
  return (
    <nav className="section-container pt-6 pb-0">
      <ol className="flex items-center gap-2 text-xs text-muted font-500">
        {crumbs.map((crumb, i) => (
          <li key={crumb.path} className="flex items-center gap-2">
            {i > 0 && <span className="text-cream-darker">/</span>}
            <button
              onClick={() => crumb.path !== '#' && navigate(crumb.path)}
              className={cn(
                'hover:text-green-700 transition-colors',
                i === crumbs.length - 1 && 'text-green-700 font-700',
                crumb.path === '#' && 'pointer-events-none',
              )}
            >
              {crumb.label}
            </button>
          </li>
        ))}
      </ol>
    </nav>
  )
}

// ── Featured banner ───────────────────────────────────────────────────────────

function FeaturedEventBanner() {
  const navigate = useNavigate()
  const { data: event, isLoading } = useQuery({
    queryKey: ['events', 'featured'],
    queryFn: eventsApi.getFeatured,
    staleTime: 2 * 60 * 1000,
  })

  if (isLoading) return <Skeleton className="h-48 rounded-3xl mb-10" />
  if (!event) return null

  return (
    <div
      className="rounded-3xl p-8 lg:p-12 flex flex-col lg:flex-row gap-8 lg:gap-14 items-start lg:items-center overflow-hidden relative cursor-pointer transition-shadow duration-300 hover:shadow-2xl bg-brand mb-10"
      onClick={() => navigate(`/events/${event.id}`)}
    >
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="text-6xl lg:text-7xl flex-shrink-0 relative">
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
        <Button variant="gold" size="md" onClick={(e) => { e.stopPropagation(); navigate(`/events/${event.id}`) }}>
          View Event →
        </Button>
      </div>
    </div>
  )
}

// ── Month filter ──────────────────────────────────────────────────────────────

// ── Events list page ──────────────────────────────────────────────────────────

const PAGE_SIZE = 12

export function EventsPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const canCreate = user && (user.role === 'exec' || user.role === 'admin')

  const [statusFilter, setStatusFilter] = useState<EventStatus | 'all'>('upcoming')
  const [typeFilter, setTypeFilter] = useState<EventType | 'all'>('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)

  const resetPage = () => setPage(1)

  const queryParams = {
    event_status: statusFilter !== 'all' ? statusFilter : undefined,
    event_type: typeFilter !== 'all' ? typeFilter : undefined,
    search: search || undefined,
    offset: (page - 1) * PAGE_SIZE,
    limit: PAGE_SIZE,
  }

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ['events', queryParams],
    queryFn: () => eventsApi.list(queryParams),
    staleTime: 60_000,
  })

  const totalResults = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(totalResults / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const items = data?.items ?? []

  const statusOptions: { value: EventStatus | 'all'; label: string }[] = [
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'ongoing',  label: 'Ongoing' },
    { value: 'past',     label: 'Past' },
    { value: 'all',      label: 'All' },
  ]

  const typeOptions: { value: EventType | 'all'; label: string }[] = [
    { value: 'all',        label: 'All Types' },
    { value: 'academic',   label: 'Academic' },
    { value: 'welfare',    label: 'Welfare' },
    { value: 'outreach',   label: 'Outreach' },
    { value: 'social',     label: 'Social' },
    { value: 'conference', label: 'Conference' },
  ]

  return (
    <>
      <EventsBreadcrumbs />
      <PageHeader
        title="Events & Activities"
        subtitle="Stay updated and register for upcoming GPSA programs."
      >
        {canCreate && (
          <Button
            variant="gold"
            size="md"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => navigate('/events/create')}
          >
            Create Event
          </Button>
        )}
      </PageHeader>

      <div className="section-container section-padding">

        {/* Featured event */}
        {statusFilter === 'upcoming' || statusFilter === 'all' ? <FeaturedEventBanner /> : null}

        {/* Filters */}
        <div className="mb-8 space-y-3">

          {/* Top row: search + filter toggle */}
          <div className="flex flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); resetPage() }}
                placeholder="Search events…"
                className="form-input pl-11"
              />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="sm:hidden flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-600 border border-cream-dark bg-white text-muted hover:border-green-300 hover:text-green-700 transition-all"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </button>
          </div>

          {/* Collapsible filter row */}
          <div className={cn('flex flex-col sm:flex-row gap-3', showFilters ? 'block' : 'hidden sm:flex')}>

            {/* Status */}
            <div>
              <p className="text-[11px] font-700 text-muted uppercase tracking-wide mb-1.5">Status</p>
              <div className="flex flex-wrap gap-1.5">
                {statusOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setStatusFilter(opt.value); resetPage() }}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-600 border transition-all whitespace-nowrap',
                      statusFilter === opt.value
                        ? 'bg-green-gradient text-white border-green-700'
                        : 'bg-white text-muted border-cream-dark hover:border-green-300 hover:text-green-700',
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Type */}
            <div>
              <p className="text-[11px] font-700 text-muted uppercase tracking-wide mb-1.5">Type</p>
              <div className="flex flex-wrap gap-1.5">
                {typeOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setTypeFilter(opt.value); resetPage() }}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-600 border transition-all whitespace-nowrap',
                      typeFilter === opt.value
                        ? 'bg-green-gradient text-white border-green-700'
                        : 'bg-white text-muted border-cream-dark hover:border-green-300 hover:text-green-700',
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Loading */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map((i) => <EventCardSkeleton key={i} />)}
          </div>
        ) : isError ? (
          <EmptyState
            icon="⚠️"
            title="Failed to load events"
            description="Something went wrong. Please try again."
            action={<Button variant="primary" size="sm" onClick={() => refetch()}>Retry</Button>}
          />
        ) : !items.length ? (
          <EmptyState icon="📅" title="No events found" description="Try changing your filters." />
        ) : (
          <>
            {/* Loading bar */}
            {isFetching && (
              <div className="h-1 rounded-full bg-cream-dark overflow-hidden mb-4">
                <div className="h-full w-1/3 bg-green-gradient rounded-full animate-pulse" />
              </div>
            )}

            <p className="text-xs text-muted mb-4 font-500">
              {totalResults > 0
                ? `Showing ${(safePage - 1) * PAGE_SIZE + 1}–${Math.min(safePage * PAGE_SIZE, totalResults)} of ${totalResults} events`
                : 'No events match your filters'}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-2">
                <button
                  onClick={() => { setPage((p) => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                  disabled={safePage === 1}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-600 border border-cream-dark bg-white text-secondary hover:border-green-300 hover:text-green-700 disabled:opacity-60 disabled:pointer-events-none transition-all"
                >
                  <ChevronLeft className="h-4 w-4" /> Prev
                </button>

                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => {
                    const showDotBefore = n === safePage - 2 && safePage > 4
                    const showDotAfter  = n === safePage + 2 && safePage < totalPages - 3
                    if (showDotBefore || showDotAfter) return <span key={n} className="px-1 py-2 text-muted text-sm">…</span>
                    if (n !== 1 && n !== totalPages && Math.abs(n - safePage) > 1) return null
                    return (
                      <button
                        key={n}
                        onClick={() => { setPage(n); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                        className={cn(
                          'w-9 h-9 rounded-xl text-sm font-600 transition-all',
                          n === safePage
                            ? 'bg-green-gradient text-white'
                            : 'border border-cream-dark bg-white text-muted hover:border-green-300 hover:text-green-700',
                        )}
                      >
                        {n}
                      </button>
                    )
                  })}
                </div>

                <button
                  onClick={() => { setPage((p) => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                  disabled={safePage === totalPages}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-600 border border-cream-dark bg-white text-secondary hover:border-green-300 hover:text-green-700 disabled:opacity-60 disabled:pointer-events-none transition-all"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}

// ── Event detail page ─────────────────────────────────────────────────────────

export function EventDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [showReg, setShowReg] = useState(false)

  const { data: event, isLoading, isError } = useQuery({
    queryKey: ['events', id],
    queryFn: () => eventsApi.getById(id!),
    enabled: !!id,
  })

  const { data: related } = useQuery({
    queryKey: ['events', 'related', event?.event_type, event?.id],
    queryFn: () => eventsApi.list({ event_type: event!.event_type, limit: 3 }),
    enabled: !!event,
  })

  const relatedEvents = (related?.items ?? []).filter((r) => r.id !== event?.id).slice(0, 3)

  if (isLoading) {
    return (
      <>
        <EventsBreadcrumbs />
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 border-2 border-green-700 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-green-700/60">Loading event…</p>
          </div>
        </div>
      </>
    )
  }

  if (isError || !event) {
    return (
      <>
        <EventsBreadcrumbs />
        <EmptyState
          icon="📅"
          title="Event not found"
          action={<Button variant="primary" onClick={() => navigate('/events')}>Back to Events</Button>}
        />
      </>
    )
  }

  return (
    <>
      <EventsBreadcrumbs eventTitle={event.title} />

      {/* Hero */}
      <div className="page-header py-16 lg:py-20 mx-5 sm:mx-8 lg:mx-10 rounded-2xl">
        <div className="max-w-7xl mx-auto relative px-5 sm:px-8 lg:px-10">
          <button onClick={() => navigate('/events')} className="text-white/70 hover:text-white text-sm mb-6 flex items-center gap-1.5 transition-colors">
            ← Back to Events
          </button>
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            <div className="text-7xl flex-shrink-0">{event.banner_emoji ?? '📅'}</div>
            <div className="flex-1">
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="blue">{EVENT_TYPE_LABELS[event.event_type]}</Badge>
                <Badge variant={event.status === 'upcoming' ? 'green' : event.status === 'ongoing' ? 'gold' : 'gray'}>
                  {event.status ? event.status.charAt(0).toUpperCase() + event.status.slice(1) : 'Unknown'}
                </Badge>
                {event.is_featured && <Badge variant="gold">⭐ Featured</Badge>}
              </div>
              <h1 className="font-display text-3xl lg:text-4xl font-bold text-white mb-4">{event.title}</h1>
              <div className="flex flex-wrap gap-5 text-white/70 text-sm">
                <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" />{formatDateTime(event.start_datetime)}</span>
                <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{event.location}</span>
              </div>
              {event.status === 'upcoming' && (
                <div className="mt-6 flex items-center gap-3">
                  <Clock className="h-4 w-4 text-white/60" />
                  <div className="flex gap-3">
                    {(() => {
                      const diff = new Date(event.start_datetime).getTime() - Date.now()
                      if (diff <= 0) return <span className="text-white/60 text-sm">Already started</span>
                      const days = Math.floor(diff / 86400000)
                      const hours = Math.floor((diff % 86400000) / 3600000)
                      const mins = Math.floor((diff % 3600000) / 60000)
                      return (
                        <span className="text-white font-display text-xl tabular-nums">
                          {days}d {hours}h {mins}m
                        </span>
                      )
                    })()}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="section-container py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* Main */}
          <div className="lg:col-span-2 space-y-8">

            {/* Description */}
            <div className="card p-8">
              <h2 className="font-display text-2xl font-bold text-green-700 mb-4">About this Event</h2>
              <p className="text-muted leading-relaxed whitespace-pre-wrap">{event.description}</p>
            </div>

            {/* Agenda */}
            {event.agenda && (
              <div className="card p-8">
                <h2 className="font-display text-2xl font-bold text-green-700 mb-4">Agenda</h2>
                <AgendaView agenda={event.agenda} />
              </div>
            )}

            {/* Speakers */}
            {event.speakers && (
              <div className="card p-8">
                <h2 className="font-display text-2xl font-bold text-green-700 mb-4">Speakers</h2>
                <SpeakersView speakers={event.speakers} />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {event.status !== 'past' && (
              <div className="card p-6">
                <Button variant="primary" size="lg" className="w-full" onClick={() => setShowReg(true)}>
                  Register Now →
                </Button>
                <p className="text-xs text-muted text-center mt-3">Free registration for all GPSA-UDS students</p>
              </div>
            )}

            <div className="card p-6 space-y-4">
              <h3 className="font-body font-700 text-deep">Event Details</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <Calendar className="h-4 w-4 text-green-700 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-600 text-deep">Date & Time</p>
                    <p className="text-muted">{formatDateTime(event.start_datetime)}</p>
                  </div>
                </div>
                {event.end_datetime && (
                  <div className="flex items-start gap-3">
                    <Calendar className="h-4 w-4 text-green-700 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-600 text-deep">Ends</p>
                      <p className="text-muted">{formatDateTime(event.end_datetime)}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-green-700 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-600 text-deep">Location</p>
                    <p className="text-muted">{event.location}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-green-700 mt-0.5">🏷️</span>
                  <div>
                    <p className="font-600 text-deep">Type</p>
                    <p className="text-muted">{EVENT_TYPE_LABELS[event.event_type]}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related events */}
        {relatedEvents.length > 0 && (
          <div className="mt-16">
            <h2 className="font-display text-2xl font-bold text-green-700 mb-6">You Might Also Like</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedEvents.map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </div>
          </div>
        )}
      </div>

      {showReg && (
        <RegistrationModal eventId={event.id} eventTitle={event.title} onClose={() => setShowReg(false)} />
      )}
    </>
  )
}
