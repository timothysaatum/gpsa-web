import { Badge, Skeleton } from '@/components/ui'
import type { WelfareSpotlight } from '@/types'

interface SpotlightCardProps {
  spotlight: WelfareSpotlight | undefined
  isLoading: boolean
}

export function SpotlightCard({ spotlight, isLoading }: SpotlightCardProps) {
  if (isLoading) {
    return (
      <div className="mb-14">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-px flex-1 bg-cream-dark" />
          <Skeleton className="h-3 w-40" />
          <div className="h-px flex-1 bg-cream-dark" />
        </div>
        <div className="border-2 border-cream-dark rounded-2xl overflow-hidden max-w-2xl p-6">
          <Skeleton className="h-4 w-1/3 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4 mb-6" />
          <Skeleton className="h-5 w-24 mb-2" />
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
    )
  }

  if (!spotlight) return null

  return (
    <div className="mb-14">
      <div className="flex items-center gap-4 mb-6">
        <div className="h-px flex-1 bg-cream-dark" />
        <span className="text-[11px] font-700 text-muted uppercase tracking-widest">This Week's Spotlight</span>
        <div className="h-px flex-1 bg-cream-dark" />
      </div>
      <div className="border-2 border-[var(--gold-old)]/40 rounded-2xl overflow-hidden max-w-2xl" style={{ background: 'color-mix(in srgb, var(--gold-old) 6%, white)' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--gold-old)]/30 bg-[var(--gold-old)]/10">
          <div className="flex items-center gap-2">
            <span className="text-lg">📌</span>
            <h3 className="font-body font-700 text-deep text-sm">Issue of the Week</h3>
          </div>
          <Badge variant="gold">Community Concern</Badge>
        </div>
        <div className="p-6 lg:p-7">
          <blockquote className="text-sm lg:text-[15px] italic leading-relaxed mb-5 border-l-3 border-[var(--gold-old)] pl-4" style={{ color: 'var(--color-text)' }}>
            &quot;{spotlight.summary}&quot;
          </blockquote>
          <div className="bg-white/70 border border-[var(--gold-old)]/30 rounded-xl p-4 lg:p-5">
            <p className="text-[10px] font-700 uppercase tracking-widest mb-1.5" style={{ color: 'var(--color-accent-deep)' }}>
              Action Taken
            </p>
            <p className="text-sm text-deep leading-relaxed">{spotlight.action_taken}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
