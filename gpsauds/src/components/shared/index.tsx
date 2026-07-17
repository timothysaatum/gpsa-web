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

const OPP_TYPE_STYLE: Record<string, { icon: string; bar: string; badge: string }> = {
  internship:  { icon: '💼', bar: 'bg-blue-500',   badge: 'badge-blue' },
  scholarship: { icon: '🎓', bar: 'bg-yellow-500', badge: 'badge-gold' },
  job:         { icon: '💻', bar: 'bg-green-600',  badge: 'badge-green' },
  training:    { icon: '🛠️', bar: 'bg-purple-500', badge: 'badge-purple' },
}

function DaysRemaining({ deadline }: { deadline: string }) {
  const d = new Date(deadline)
  const now = new Date()
  const days = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  const isPast = days <= 0

  if (isPast) return <span className="text-xs text-gray-400 font-500">Expired</span>

  const color = days === 0 ? 'text-red-600' : days <= 3 ? 'text-orange-600' : days <= 7 ? 'text-yellow-600' : 'text-green-600'

  return (
    <span className={cn('text-xs font-700', color)}>
      {days === 0 ? 'Today' : `${days}d left`}
    </span>
  )
}

interface OpportunityCardProps {
  opportunity: Opportunity
  onApply?: () => void
}

export function OpportunityCard({ opportunity, onApply }: OpportunityCardProps) {
  const style = OPP_TYPE_STYLE[opportunity.opp_type] ?? OPP_TYPE_STYLE.internship

  return (
    <Card padding="none" className="flex flex-col hover:shadow-card-md transition-all duration-300 hover:-translate-y-0.5 overflow-hidden">
      <div className={cn('h-1', style.bar)} />
      <div className="p-5 flex flex-col gap-3 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl flex-shrink-0">{style.icon}</span>
            <div>
              <span className={cn('text-[11px] font-700 uppercase tracking-wider', style.badge.split(' ')[0] === 'badge-blue' ? 'text-blue-700' : style.badge.split(' ')[0] === 'badge-gold' ? 'text-yellow-700' : style.badge.split(' ')[0] === 'badge-purple' ? 'text-purple-700' : 'text-green-700')}>
                {OPP_TYPE_LABELS[opportunity.opp_type]}
              </span>
            </div>
          </div>
          {!opportunity.is_active && (
            <Badge variant="gray">Expired</Badge>
          )}
        </div>

        <h3 className="font-display font-bold text-deep leading-snug line-clamp-2 text-lg">
          {opportunity.title}
        </h3>

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

        <div className="flex items-center justify-between mt-auto pt-3 border-t border-cream-dark">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-[10px] text-muted uppercase tracking-wide font-700 mb-1">Deadline</p>
              <DeadlineBadge deadline={opportunity.deadline} />
            </div>
            <DaysRemaining deadline={opportunity.deadline} />
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

export const CATEGORY_STYLE: Record<string, { bar: string; dot: string; text: string }> = {
  announcement:    { bar: 'bg-gold-500', dot: 'bg-gold-500', text: 'text-gold-700' },
  academic_update: { bar: 'bg-green-500', dot: 'bg-green-500', text: 'text-green-700' },
  welfare_update:  { bar: 'bg-teal-500', dot: 'bg-teal-500', text: 'text-teal-700' },
  events_recap:    { bar: 'bg-blue-500', dot: 'bg-blue-500', text: 'text-blue-700' },
  opportunities:   { bar: 'bg-purple-500', dot: 'bg-purple-500', text: 'text-purple-700' },
  general:         { bar: 'bg-slate-400', dot: 'bg-slate-400', text: 'text-slate-600' },
}

interface NewsCardProps {
  post: NewsPostSummary
  onClick?: () => void
}

export function NewsCard({ post, onClick }: NewsCardProps) {
  const style = CATEGORY_STYLE[post.category] ?? CATEGORY_STYLE.general
  return (
    <Card hover padding="none" onClick={onClick} className="overflow-hidden flex flex-col">
      <div className={cn('h-1.5', style.bar)} />
      <div className="p-5 flex flex-col gap-2 flex-1">
        <div className="flex items-center gap-2">
          <span className={cn('w-2 h-2 rounded-full', style.dot)} />
          <span className={cn('text-[11px] font-700 uppercase tracking-wider', style.text)}>
            {NEWS_CATEGORY_LABELS[post.category] ?? post.category}
          </span>
          {post.is_urgent && <span className="text-[11px] font-700 text-red-600">● Urgent</span>}
        </div>
        <h3 className="font-display font-bold text-deep leading-snug line-clamp-2">
          {post.title}
        </h3>
        {post.published_at && (
          <span className="text-xs text-muted mt-auto">{formatDate(post.published_at)}</span>
        )}
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
    <div className="page-header mt-16 lg:mt-[70px] py-14 lg:py-20 mx-5 sm:mx-8 lg:mx-10 rounded-2xl">
      <div className="max-w-7xl mx-auto relative px-5 sm:px-8 lg:px-10">
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
