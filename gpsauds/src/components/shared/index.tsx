import { useNavigate } from 'react-router-dom'
import {
  ArrowRight, BookOpen, BriefcaseBusiness, Building2, Calendar, Clock3,
  ExternalLink, GraduationCap, HandHeart, HeartHandshake, Laptop, MapPin,
  Presentation, Star, UsersRound, Wrench,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
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
    today:     { label: 'Today',     variant: 'red' as const },
    tomorrow:  { label: 'Tomorrow',  variant: 'orange' as const },
    this_week: { label: 'This Week', variant: 'gold' as const },
  }
  const { label, variant } = map[urgency]
  return <Badge variant={variant}><Clock3 className="h-3 w-3" aria-hidden="true" />{label}</Badge>
}

function DeadlineBadge({ deadline }: { deadline: string }) {
  const urgency = deadlineUrgency(deadline)
  const map = {
    expired:       { label: 'Expired',        variant: 'gray' as const },
    closing_today: { label: 'Closing Today', variant: 'red' as const },
    closing_soon:  { label: 'Closing Soon',  variant: 'orange' as const },
    open:          { label: 'Open',          variant: 'green' as const },
  }
  const { label, variant } = map[urgency]
  return <Badge variant={variant}><Clock3 className="h-3 w-3" aria-hidden="true" />{label}</Badge>
}

// ── Event card ────────────────────────────────────────────────────────────────

const EVENT_BG: Record<string, string> = {
  academic:   'bg-green-700',
  welfare:    'bg-amber-500',
  outreach:   'bg-emerald-600',
  social:     'bg-blue-600',
  conference: 'bg-amber-500',
}

const EVENT_ICON: Record<string, LucideIcon> = {
  academic: BookOpen,
  welfare: HeartHandshake,
  outreach: HandHeart,
  social: UsersRound,
  conference: Presentation,
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
  const EventIcon = EVENT_ICON[event.event_type] ?? Calendar

  return (
    <div
      onClick={() => navigate(`/events/${event.id}`)}
      className="group relative overflow-hidden rounded-[1.35rem] bg-white flex flex-col cursor-pointer transition-all duration-300 border border-white shadow-[0_18px_45px_rgba(16,24,40,0.08)] hover:-translate-y-1 hover:shadow-[0_26px_70px_rgba(0,77,0,0.16)]"
    >
      <div className={cn('absolute inset-x-0 top-0 h-1.5', EVENT_BG[event.event_type] ?? 'bg-green-700')} />
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-cream-dark to-transparent opacity-80" />

      <div className="relative p-5 sm:p-6 flex flex-col gap-5 flex-1">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-white border border-cream-dark shadow-sm flex flex-col items-center justify-center">
              <span className="text-[10px] font-800 uppercase text-green-700 leading-none">{month}</span>
              <span className="text-lg font-800 text-deep leading-none">{day}</span>
            </div>
            <div className="h-12 w-12 rounded-2xl border border-green-100 bg-green-50 flex items-center justify-center text-green-800 transition-transform duration-300 group-hover:scale-105">
              <EventIcon className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 justify-end">
            <Badge variant="blue">{EVENT_TYPE_LABELS[event.event_type] ?? event.event_type}</Badge>
            <EventUrgencyBadge start={event.start_datetime} />
          </div>
        </div>

        <div className="min-h-[4.5rem]">
          <h3 className="font-display text-2xl font-bold text-deep leading-tight line-clamp-2 group-hover:text-green-700 transition-colors">
            {event.title}
          </h3>
        </div>

        <div className="space-y-2.5 mt-auto rounded-2xl bg-cream-dark/70 p-3.5">
          <p className="flex items-center gap-2 text-xs text-secondary">
            <Calendar className="h-3.5 w-3.5 flex-shrink-0 text-green-700" />
            {formatDateTime(event.start_datetime)}
          </p>
          <p className="flex items-center gap-2 text-xs text-secondary">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-green-700" />
            <span className="truncate">{event.location}</span>
          </p>
        </div>

        <div className="pt-1">
          <span
            className="inline-flex items-center gap-2 text-sm font-800 text-green-900 group-hover:text-green-600 transition-colors"
            onClick={(e) => { e.stopPropagation(); onRegister?.() }}
          >
            {event.status !== 'past' ? 'View event' : 'Past event'}
            {event.status !== 'past' && <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />}
          </span>
        </div>
      </div>
    </div>
  )
}

// ── Opportunity card ──────────────────────────────────────────────────────────

const OPP_TYPE_STYLE: Record<string, { icon: LucideIcon; bar: string; badge: string; iconClass: string }> = {
  internship:  { icon: BriefcaseBusiness, bar: 'bg-blue-500',   badge: 'badge-blue', iconClass: 'text-blue-700' },
  scholarship: { icon: GraduationCap,     bar: 'bg-yellow-500', badge: 'badge-gold', iconClass: 'text-amber-700' },
  job:         { icon: Laptop,            bar: 'bg-green-600',  badge: 'badge-green', iconClass: 'text-green-800' },
  training:    { icon: Wrench,            bar: 'bg-purple-500', badge: 'badge-purple', iconClass: 'text-violet-700' },
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
  const OpportunityIcon = style.icon

  return (
    <Card padding="none" className="group relative flex flex-col overflow-hidden rounded-[1.35rem] border-white bg-white shadow-[0_18px_45px_rgba(16,24,40,0.08)] hover:shadow-[0_26px_70px_rgba(0,77,0,0.15)] transition-all duration-300 hover:-translate-y-1">
      <div className={cn('absolute left-0 top-0 h-full w-1.5', style.bar)} />
      {opportunity.thumbnail_url ? (
        <div className="relative h-40 overflow-hidden">
          <img src={opportunity.thumbnail_url} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />
        </div>
      ) : <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white to-cream-dark/50" />}
      <div className="relative p-5 sm:p-6 flex flex-col gap-4 flex-1">
        <div className="flex items-start justify-between gap-3 pl-1">
          <div className="flex items-center gap-3 min-w-0">
            <span className={cn('h-12 w-12 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-center flex-shrink-0 shadow-sm', style.iconClass)}>
              <OpportunityIcon className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className={cn('text-[11px] font-800 uppercase tracking-widest', style.badge.split(' ')[0] === 'badge-blue' ? 'text-blue-700' : style.badge.split(' ')[0] === 'badge-gold' ? 'text-yellow-700' : style.badge.split(' ')[0] === 'badge-purple' ? 'text-purple-700' : 'text-green-700')}>
                {OPP_TYPE_LABELS[opportunity.opp_type]}
              </p>
              <p className="text-xs text-muted truncate">Opportunity</p>
            </div>
          </div>
          {!opportunity.is_active && <Badge variant="gray">Expired</Badge>}
        </div>

        <div className="pl-1">
          <h3 className="font-display text-2xl font-bold text-deep leading-tight line-clamp-2 group-hover:text-green-700 transition-colors">
            {opportunity.title}
          </h3>
          <p className="mt-2 flex items-center gap-2 text-sm text-secondary font-600">
            <Building2 className="h-4 w-4 text-green-700 flex-shrink-0" />
            <span className="truncate">{opportunity.organization}</span>
          </p>
        </div>

        <p className="pl-1 text-sm text-muted line-clamp-3 leading-relaxed">
          {opportunity.description}
        </p>

        {opportunity.location && (
          <p className="pl-1 flex items-center gap-2 text-xs text-secondary">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-green-700" />
            <span className="truncate">{opportunity.location}</span>
          </p>
        )}

        <div className="mt-auto rounded-2xl bg-cream-dark/80 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] text-muted uppercase tracking-widest font-800 mb-1">Deadline</p>
              <DeadlineBadge deadline={opportunity.deadline} />
            </div>
            <div className="text-right">
              <DaysRemaining deadline={opportunity.deadline} />
              <p className="text-xs text-muted mt-1">{formatDate(opportunity.deadline)}</p>
            </div>
          </div>
        </div>
      </div>

      {opportunity.is_active && (
        <div className="relative px-5 sm:px-6 pb-5 sm:pb-6">
          <Button
            variant="primary"
            size="sm"
            className="w-full rounded-2xl"
            rightIcon={<ExternalLink className="h-3.5 w-3.5" />}
            onClick={(e) => { e.stopPropagation(); onApply?.() }}
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
    <Card hover padding="none" onClick={onClick} className="group relative overflow-hidden flex flex-col rounded-[1.35rem] border-white bg-white shadow-[0_18px_45px_rgba(16,24,40,0.08)] hover:shadow-[0_26px_70px_rgba(0,77,0,0.15)]">
      <div className={cn('absolute inset-x-5 top-0 h-1.5 rounded-b-full', style.bar)} />
      {post.image_url ? (
        <div className="relative aspect-[16/9] overflow-hidden bg-cream-dark">
          <img
            src={post.image_url}
            alt={post.image_alt || ''}
            loading="lazy"
            width={720}
            height={405}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        </div>
      ) : (
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-cream-dark/80 to-transparent" />
      )}
      <div className="relative p-5 sm:p-6 flex flex-col gap-5 flex-1 min-h-[300px]">
        <div className="flex items-center justify-between gap-3">
          <span className={cn('inline-flex items-center gap-2 text-[11px] font-800 uppercase tracking-widest', style.text)}>
            <span className={cn('w-2 h-2 rounded-full', style.dot)} />
            {NEWS_CATEGORY_LABELS[post.category] ?? post.category}
          </span>
          {post.is_urgent && <Badge variant="red">Urgent</Badge>}
        </div>
        <div>
          <h3 className="font-display text-2xl font-bold text-deep leading-tight line-clamp-3 group-hover:text-green-700 transition-colors">
            {post.title}
          </h3>
          <p className="mt-3 text-sm text-muted leading-relaxed line-clamp-3">
            {post.summary}
          </p>
        </div>
        <div className="mt-auto rounded-2xl bg-cream-dark/70 p-3.5 flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 text-xs text-secondary">
            <Clock3 className="h-3.5 w-3.5 text-green-700" />
            {post.published_at ? formatDate(post.published_at) : 'Draft'}
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-800 text-green-800 group-hover:text-green-600">
            Read
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
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
