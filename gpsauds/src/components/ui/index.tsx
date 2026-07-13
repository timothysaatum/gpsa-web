import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/utils'
import { Loader2 } from 'lucide-react'

// ── Button ────────────────────────────────────────────────────────────────────

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'gold' | 'outline' | 'ghost' | 'outline-white' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

// Static lookup maps — every class string is explicit so Tailwind's scanner sees them
const BUTTON_VARIANT: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:         'btn-primary',
  gold:            'btn-gold',
  outline:         'btn-outline',
  ghost:           'btn-ghost',
  'outline-white': 'btn-outline-white',
  destructive:     'btn-destructive',
}

const BUTTON_SIZE: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'btn-sm',
  md: 'btn-md',
  lg: 'btn-lg',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      leftIcon,
      rightIcon,
      children,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(BUTTON_SIZE[size], BUTTON_VARIANT[variant], className)}
        {...props}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : leftIcon}
        {children}
        {!loading && rightIcon}
      </button>
    )
  }
)
Button.displayName = 'Button'

// ── Badge ─────────────────────────────────────────────────────────────────────

type BadgeVariant = 'green' | 'gold' | 'red' | 'orange' | 'blue' | 'purple' | 'gray'

interface BadgeProps {
  variant?: BadgeVariant
  children: ReactNode
  className?: string
  dot?: boolean
}

const BADGE_VARIANT: Record<BadgeVariant, string> = {
  green:  'badge-green',
  gold:   'badge-gold',
  red:    'badge-red',
  orange: 'badge-orange',
  blue:   'badge-blue',
  purple: 'badge-purple',
  gray:   'badge-gray',
}

const BADGE_DOT: Record<BadgeVariant, string> = {
  green:  'bg-green-gradient',
  gold:   'bg-yellow-500',
  red:    'bg-red-600',
  orange: 'bg-orange-600',
  blue:   'bg-blue-600',
  purple: 'bg-purple-600',
  gray:   'bg-gray-500',
}

export function Badge({ variant = 'green', children, className, dot }: BadgeProps) {
  return (
    <span className={cn(BADGE_VARIANT[variant], className)}>
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full', BADGE_DOT[variant])} />}
      {children}
    </span>
  )
}

// ── Card ──────────────────────────────────────────────────────────────────────

interface CardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  onClick?: () => void
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const CARD_PADDING: Record<NonNullable<CardProps['padding']>, string> = {
  none: '',
  sm:   'p-4',
  md:   'p-6',
  lg:   'p-8',
}

export function Card({ children, className, hover, onClick, padding = 'md' }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(hover ? 'card-hover' : 'card', CARD_PADDING[padding], className)}
    >
      {children}
    </div>
  )
}

// ── Spinner ───────────────────────────────────────────────────────────────────

const SPINNER_SIZE: Record<string, string> = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
}

export function Spinner({ size = 'md', className }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  return (
    <Loader2 className={cn('animate-spin text-green-700', SPINNER_SIZE[size], className)} />
  )
}

export function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Spinner size="lg" />
        <p className="text-sm text-green-700/60 font-body">Loading…</p>
      </div>
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon = '📭', title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <span className="text-5xl mb-5">{icon}</span>
      <h3 className="font-display text-xl font-semibold text-green-700 mb-2">{title}</h3>
      {description && <p className="text-sm text-muted max-w-sm mb-6">{description}</p>}
      {action}
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} />
}

export function CardSkeleton() {
  return (
    <div className="card p-6 space-y-4">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-10 w-28 rounded-xl" />
    </div>
  )
}

// ── Divider ───────────────────────────────────────────────────────────────────

export function Divider({ className }: { className?: string }) {
  return <div className={cn('divider', className)} />
}

// ── Section header ────────────────────────────────────────────────────────────

interface SectionHeaderProps {
  title: string
  subtitle?: string
  action?: ReactNode
  className?: string
}

export function SectionHeader({ title, subtitle, action, className }: SectionHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-4 mb-8', className)}>
      <div>
        <h2 className="section-title">{title}</h2>
        {subtitle && <p className="section-sub mt-2">{subtitle}</p>}
        <Divider />
      </div>
      {action && <div className="flex-shrink-0 mt-1">{action}</div>}
    </div>
  )
}