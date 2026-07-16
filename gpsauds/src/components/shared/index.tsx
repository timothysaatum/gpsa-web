import { useNavigate } from 'react-router-dom'
import { Calendar, MapPin, ExternalLink, ArrowRight, Star } from 'lucide-react'
import type { EventSummary, Opportunity, NewsPostSummary } from '@/types'
import { Badge, Button, Card } from '@/components/ui'
import {
  cn, formatDate, formatDateTime, eventUrgency, deadlineUrgency,
  EVENT_TYPE_LABELS, OPP_TYPE_LABELS, NEWS_CATEGORY_LABELS,
} from '@/utils'
import { useCountdown } from '@/hooks/useCountdown'

// ── Countdown block ───────────────────────────────────────────────────────────

export function CountdownBlock({ targetDate, className }: { targetDate: string; className?: string }) {
  const { days, hours, minutes, seconds, isExpired } = useCountdown(targetDate)

  if (isExpired || isNaN(days)) return null

  const blocks = [
    { value: days,    label: 'Days' },
    { value: hours,   label: 'Hrs' },
    { value: minutes, label: 'Min' },
    { value: seconds, label: 'Sec' },
  ]

  return (
    <div className={cn('flex gap-3', className)}>
      {blocks.map(({ value, label }) => (
        <div key={label} className="bg-white/15 backdrop-blur-sm rounded-xl px-3 py-2 text-center min-w-[52px]">
          <p className="font-display text-2xl font-bold text-white leading-none">
            {String(value).padStart(2, '0')}
          </p>
          <p className="text-[10px] font-500 text-white/70 uppercase tracking-wider mt-0.5">{label}</p>
        </div>
      ))}
    </div>
  )
}

// ── Urgency badge helper ──────────────────────────────────────────────────────

function EventUrgencyBadge({ start }: { start: string }) {
  const urgency = eventUrgency(start)
  if (urgency === 'past' || urgency === 'upcoming') return null
  const map = {
    today:     { label: '🔴 Today',     variant: 'red' as const },
    tomorrow:  { label: '🟠 Tomorrow',  variant: 'orange' as const },
    this_week: { label: '🟡 This Week', variant: 'gold' as const },
  }
  const { label, variant } = map[urgency]
  return <Badge variant={variant}>{label}</Badge>
}

function DeadlineBadge({ deadline }: { deadline: string }) {
  const urgency = deadlineUrgency(deadline)
  const map = {
    expired:       { label: 'Expired',        variant: 'gray' as const },
    closing_today: { label: '🔴 Closing Today', variant: 'red' as const },
    closing_soon:  { label: '🟠 Closing Soon',  variant: 'orange' as const },
    open:          { label: '🟢 Open',          variant: 'green' as const },
  }
  const { label, variant } = map[urgency]
  return <Badge variant={variant}>{label}</Badge>
}

// ── Event card ────────────────────────────────────────────────────────────────

const EVENT_BG: Record<string, string> = {
  academic:   'bg-green-gradient',
  welfare:    'bg-gold-50',
  outreach:   'bg-green-gradient',
  social:     'bg-cream-dark',
  conference: 'bg-gold-50',
}

interface EventCardProps {
  event: EventSummary
  featured?: boolean
  onRegister?: () => void
}

export function EventCard({ event, onRegister }: EventCardProps) {
  const navigate = useNavigate()
  const startDate = new Date(event.start_datetime)
  const day = startDate.getDate()
  const month = startDate.toLocaleDateString('en-US', { month: 'short' })

  return (
    <div
      onClick={() => navigate(`/events/${event.id}`)}
      className="group relative bg-white rounded-2xl overflow-hidden flex flex-col cursor-pointer transition-all duration-300 border border-cream-dark hover:-translate-y-1 hover:shadow-xl"
    >
      {/* Top colour bar */}
      <div className={cn('h-1.5', EVENT_BG[event.event_type] ?? 'bg-cream-dark')} />

      <div className="p-5 flex flex-col gap-3 flex-1">
        {/* Date badge + type */}
        <div className="flex items-start justify-between gap-3">
          {/* Calendar-style date badge */}
          <div className="flex-shrink-0 w-12 h-14 rounded-xl overflow-hidden border border-cream-dark flex flex-col items-center justify-center bg-white">
            <span className="text-[10px] font-700 uppercase text-muted leading-none mt-1">{month}</span>
            <span className="text-lg font-bold text-deep leading-none">{day}</span>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 justify-end">
            <Badge variant="blue">{EVENT_TYPE_LABELS[event.event_type] ?? event.event_type}</Badge>
            <EventUrgencyBadge start={event.start_datetime} />
          </div>
        </div>

        {/* Emoji */}
        {event.banner_emoji && (
          <div className="text-3xl">{event.banner_emoji}</div>
        )}

        <h3 className="font-display font-bold text-deep leading-snug line-clamp-2 group-hover:text-green-700 transition-colors">
          {event.title}
        </h3>

        <div className="space-y-1.5 mt-auto">
          <p className="flex items-center gap-1.5 text-xs text-muted">
            <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
            {formatDateTime(event.start_datetime)}
          </p>
          <p className="flex items-center gap-1.5 text-xs text-muted">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">{event.location}</span>
          </p>
        </div>

        <div className="pt-3 border-t border-cream-dark mt-auto">
          {event.status !== 'past' ? (
            <span
              className="inline-flex items-center gap-1 text-xs font-600 text-green-700 group-hover:text-green-600 transition-colors"
              onClick={(e) => { e.stopPropagation(); onRegister?.() }}
            >
              View event
              <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-0.5" />
            </span>
          ) : (
            <span className="text-xs text-muted font-500">Past event</span>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Opportunity card ──────────────────────────────────────────────────────────

interface OpportunityCardProps {
  opportunity: Opportunity
  onApply?: () => void
}

export function OpportunityCard({ opportunity, onApply }: OpportunityCardProps) {
  return (
    <Card padding="none" className="flex flex-col hover:shadow-card-md transition-shadow">
      <div className="p-5 flex flex-col gap-3 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <Badge variant="green" className="mb-2">
              {OPP_TYPE_LABELS[opportunity.opp_type]}
            </Badge>
            <h3 className="font-body font-700 text-deep leading-snug line-clamp-2">
              {opportunity.title}
            </h3>
          </div>
          {!opportunity.is_active && (
            <Badge variant="gray">Expired</Badge>
          )}
        </div>

        <p className="text-sm text-muted font-500">🏢 {opportunity.organization}</p>

        <p className="text-sm text-muted line-clamp-2 leading-relaxed">
          {opportunity.description}
        </p>

        {opportunity.location && (
          <p className="flex items-center gap-1.5 text-xs text-muted">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
            {opportunity.location}
          </p>
        )}

        <div className="flex items-center justify-between mt-auto pt-2 border-t border-cream-dark">
          <div>
            <p className="text-[10px] text-muted uppercase tracking-wide font-700 mb-1">Deadline</p>
            <DeadlineBadge deadline={opportunity.deadline} />
          </div>
          <p className="text-xs text-muted">{formatDate(opportunity.deadline)}</p>
        </div>
      </div>

      {opportunity.is_active && (
        <div className="px-5 pb-5">
          <Button
            variant="primary"
            size="sm"
            className="w-full"
            rightIcon={<ExternalLink className="h-3.5 w-3.5" />}
            onClick={onApply}
          >
            Apply Now
          </Button>
        </div>
      )}
    </Card>
  )
}

// ── News card ─────────────────────────────────────────────────────────────────

const NEWS_BG: Record<string, string> = {
  announcement:   'bg-gold-50',
  academic_update:'bg-green-gradient',
  welfare_update: 'bg-green-gradient',
  events_recap:   'bg-cream-dark',
  opportunities:  'bg-gold-50',
  general:        'bg-cream-dark',
}

interface NewsCardProps {
  post: NewsPostSummary
  onClick?: () => void
}

export function NewsCard({ post, onClick }: NewsCardProps) {
  return (
    <Card hover padding="none" onClick={onClick} className="overflow-hidden flex flex-col">
      <div className={cn('h-40 flex items-center justify-center text-6xl', NEWS_BG[post.category] ?? 'bg-cream-dark')}>
        {post.banner_emoji ?? '📰'}
      </div>

      <div className="p-5 flex flex-col gap-3 flex-1">
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="green">{NEWS_CATEGORY_LABELS[post.category] ?? post.category}</Badge>
          {post.is_urgent && <Badge variant="red">🔴 Urgent</Badge>}
        </div>

        <h3 className="font-body font-700 text-deep leading-snug line-clamp-2">
          {post.title}
        </h3>

        <p className="text-sm text-muted line-clamp-3 leading-relaxed">
          {post.summary}
        </p>

        <div className="flex items-center justify-between mt-auto pt-2">
          {post.published_at && (
            <span className="text-xs text-muted">{formatDate(post.published_at)}</span>
          )}
          <span className="text-xs font-700 text-green-700 flex items-center gap-1">
            Read More <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </Card>
  )
}

// ── Filter bar ────────────────────────────────────────────────────────────────

interface FilterBarProps<T extends string> {
  options: { value: T | 'all'; label: string }[]
  value: T | 'all'
  onChange: (v: T | 'all') => void
  className?: string
}

export function FilterBar<T extends string>({ options, value, onChange, className }: FilterBarProps<T>) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            'px-4 py-2 rounded-xl text-sm font-600 font-body border transition-all duration-150',
            value === opt.value
              ? 'bg-green-gradient text-white border-green-700 shadow-card'
              : 'bg-white text-muted border-cream-dark hover:border-green-300 hover:text-green-700'
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

// ── Star rating ───────────────────────────────────────────────────────────────

export function StarRating({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            'h-4 w-4',
            i < Math.round(value) ? 'fill-gold-500 text-gold-500' : 'text-cream-darker fill-cream-darker'
          )}
        />
      ))}
      <span className="ml-1 text-xs text-muted font-500">({value.toFixed(1)})</span>
    </div>
  )
}

// ── Page header ───────────────────────────────────────────────────────────────

interface PageHeaderProps {
  title: string
  subtitle?: string
  children?: React.ReactNode
}

export function PageHeader({ title, subtitle, children }: PageHeaderProps) {
  return (
    <div className="page-header mt-16 lg:mt-[70px] py-14 lg:py-20">
      <div className="section-container relative">
        <div className="max-w-2xl">
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-4">
            {title}
          </h1>
          {subtitle && (
            <p className="text-lg text-white/70 leading-relaxed">{subtitle}</p>
          )}
          {children && <div className="mt-6">{children}</div>}
        </div>
      </div>
    </div>
  )
}
