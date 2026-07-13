import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { MapPin, Calendar, X, CheckCircle, AlertCircle } from 'lucide-react'
import { eventsApi } from '@/api/services'
import { useAuthStore } from '@/store/authStore'
import { extractError } from '@/api/client'
import {
  Button, CardSkeleton, EmptyState, Badge, PageLoader} from '@/components/ui'
import {
  EventCard, FilterBar, PageHeader, CountdownBlock
} from '@/components/shared'
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-card-lg w-full max-w-md p-8 animate-fade-up">
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

// ── Events list page ──────────────────────────────────────────────────────────

export function EventsPage() {
  const [statusFilter, setStatusFilter] = useState<EventStatus | 'all'>('upcoming')
  const [typeFilter, setTypeFilter] = useState<EventType | 'all'>('all')
  const [registeringEvent, setRegisteringEvent] = useState<{ id: string; title: string } | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['events', { status: statusFilter, type: typeFilter }],
    queryFn: () =>
      eventsApi.list({
        event_status: statusFilter !== 'all' ? statusFilter : undefined,
        event_type: typeFilter !== 'all' ? typeFilter : undefined,
        limit: 12,
      }),
    staleTime: 60_000,
  })

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
      <PageHeader
        title="Events & Activities"
        subtitle="Stay updated and register for upcoming GPSA programs."
      />

      <div className="section-container section-padding">
        <div className="flex flex-wrap gap-6 mb-8">
          <div>
            <p className="text-xs font-700 text-muted uppercase tracking-wide mb-2">Status</p>
            <FilterBar options={statusOptions} value={statusFilter} onChange={setStatusFilter} />
          </div>
          <div>
            <p className="text-xs font-700 text-muted uppercase tracking-wide mb-2">Type</p>
            <FilterBar options={typeOptions} value={typeFilter} onChange={setTypeFilter} />
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map((i) => <CardSkeleton key={i} />)}
          </div>
        ) : !data?.items.length ? (
          <EmptyState icon="📅" title="No events found" description="Try changing your filters." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.items.map((e) => (
              <EventCard
                key={e.id}
                event={e}
                onRegister={() => setRegisteringEvent({ id: e.id, title: e.title })}
              />
            ))}
          </div>
        )}
      </div>

      {registeringEvent && (
        <RegistrationModal
          eventId={registeringEvent.id}
          eventTitle={registeringEvent.title}
          onClose={() => setRegisteringEvent(null)}
        />
      )}
    </>
  )
}

// ── Event detail page ─────────────────────────────────────────────────────────

export function EventDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [showReg, setShowReg] = useState(false)

  const { data: event, isLoading } = useQuery({
    queryKey: ['events', id],
    queryFn: () => eventsApi.getById(id!),
    enabled: !!id,
  })

  if (isLoading) return <PageLoader />
  if (!event) return <EmptyState icon="📅" title="Event not found" action={<Button variant="primary" onClick={() => navigate('/events')}>Back to Events</Button>} />

  return (
    <>
      {/* Header */}
      <div className="page-header py-16">
        <div className="section-container relative">
          <button onClick={() => navigate('/events')} className="text-white/60 hover:text-white text-sm mb-6 flex items-center gap-1.5 transition-colors">
            ← Back to Events
          </button>
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            <div className="text-7xl flex-shrink-0">{event.banner_emoji ?? '📅'}</div>
            <div className="flex-1">
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="blue">{EVENT_TYPE_LABELS[event.event_type]}</Badge>
                <Badge variant={event.status === 'upcoming' ? 'green' : event.status === 'ongoing' ? 'gold' : 'gray'}>
                  {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                </Badge>
                {event.is_featured && <Badge variant="gold">⭐ Featured</Badge>}
              </div>
              <h1 className="font-display text-3xl lg:text-4xl font-bold text-white mb-4">{event.title}</h1>
              <div className="flex flex-wrap gap-5 text-white/70 text-sm">
                <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" />{formatDateTime(event.start_datetime)}</span>
                <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{event.location}</span>
              </div>
              {event.status === 'upcoming' && (
                <CountdownBlock targetDate={event.start_datetime} className="mt-6" />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="section-container py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            <div className="card p-8">
              <h2 className="font-display text-2xl font-bold text-green-700 mb-4">About this Event</h2>
              <p className="text-muted leading-relaxed whitespace-pre-wrap">{event.description}</p>
            </div>
            {event.agenda && (
              <div className="card p-8">
                <h2 className="font-display text-2xl font-bold text-green-700 mb-4">Agenda</h2>
                <pre className="text-sm text-muted whitespace-pre-wrap font-body">
                  {JSON.stringify(event.agenda, null, 2)}
                </pre>
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
              <h3 className="font-body font-700 text-[#1B3D22]">Event Details</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <Calendar className="h-4 w-4 text-green-700 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-600 text-[#1B3D22]">Date & Time</p>
                    <p className="text-muted">{formatDateTime(event.start_datetime)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-green-700 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-600 text-[#1B3D22]">Location</p>
                    <p className="text-muted">{event.location}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-green-700 mt-0.5">🏷️</span>
                  <div>
                    <p className="font-600 text-[#1B3D22]">Type</p>
                    <p className="text-muted">{EVENT_TYPE_LABELS[event.event_type]}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showReg && (
        <RegistrationModal eventId={event.id} eventTitle={event.title} onClose={() => setShowReg(false)} />
      )}
    </>
  )
}