import { Button } from '@/components/ui'
import { cn } from '@/utils'
import type { ReportType } from '@/types'
import { HandHeart, ShieldCheck, TriangleAlert } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { welfarePageDefaults } from '@/config/cmsPageDefaults'

interface ActionCardConfig {
  type: ReportType
  icon: LucideIcon
  iconStyle: string
  num: string
  title: string
  desc: string
  cta: string
  accentBar: string
  numStyle: string
  activeRing: string
  btnVariant: 'destructive' | 'primary' | 'outline'
}

interface ActionCardsProps {
  activeCard: ReportType | null
  onSelect: (type: ReportType) => void
  settings: typeof welfarePageDefaults
}

export function ActionCards({ activeCard, onSelect, settings }: ActionCardsProps) {
  const cards: ActionCardConfig[] = [
    {
      type: 'issue', icon: TriangleAlert, iconStyle: 'bg-red-50 text-red-700 ring-red-100', num: '01',
      title: settings.issue_title, desc: settings.issue_description, cta: settings.issue_cta,
      accentBar: 'bg-red-600', numStyle: 'bg-red-50 text-red-600',
      activeRing: 'ring-red-600/20 border-red-300', btnVariant: 'destructive',
    },
    {
      type: 'support', icon: HandHeart, iconStyle: 'bg-green-50 text-green-800 ring-green-100', num: '02',
      title: settings.support_title, desc: settings.support_description, cta: settings.support_cta,
      accentBar: 'bg-green-gradient', numStyle: 'bg-green-gradient text-white',
      activeRing: 'ring-green-300 border-green-700', btnVariant: 'primary',
    },
    {
      type: 'confidential', icon: ShieldCheck, iconStyle: 'bg-violet-50 text-violet-700 ring-violet-100', num: '03',
      title: settings.confidential_title, desc: settings.confidential_description, cta: settings.confidential_cta,
      accentBar: 'bg-violet-500', numStyle: 'bg-violet-100 text-violet-700',
      activeRing: 'ring-violet-300 border-violet-400', btnVariant: 'outline',
    },
  ]
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-2">
      {cards.map((c) => {
        const isActive = activeCard === c.type
        const Icon = c.icon
        return (
          <div
            key={c.type}
            onClick={() => onSelect(c.type)}
            className={cn(
              'relative bg-white border-2 rounded-2xl overflow-hidden flex flex-col gap-5 p-7 cursor-pointer',
              'transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5',
              isActive
                ? `${c.activeRing} ring-4 shadow-lg`
                : 'border-cream-dark hover:border-opacity-70'
            )}
          >
            <div className={cn('absolute top-0 left-0 right-0 h-[3px]', c.accentBar)} />
            <span className={cn('inline-flex items-center justify-center w-9 h-9 rounded-xl text-xs font-display font-bold', c.numStyle)}>
              {c.num}
            </span>
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1', c.iconStyle)}>
                  <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} aria-hidden="true" />
                </span>
                <h3 className="font-body font-700 text-deep text-[17px] leading-snug">{c.title}</h3>
              </div>
              <p className="text-sm text-muted leading-relaxed">{c.desc}</p>
            </div>
            <Button
              variant={c.btnVariant}
              size="md"
              className="mt-auto"
              onClick={(e) => { e.stopPropagation(); onSelect(c.type) }}
            >
              {c.cta}
            </Button>
          </div>
        )
      })}
    </div>
  )
}
