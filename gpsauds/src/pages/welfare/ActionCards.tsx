import { Button } from '@/components/ui'
import { cn } from '@/utils'
import type { ReportType } from '@/types'

interface ActionCardConfig {
  type: ReportType
  icon: string
  num: string
  title: string
  desc: string
  cta: string
  accentBar: string
  numStyle: string
  activeRing: string
  btnVariant: 'destructive' | 'primary' | 'outline'
}

const CARDS: ActionCardConfig[] = [
  {
    type: 'issue', icon: '⚠️', num: '01',
    title: 'Report an Issue',
    desc: 'Academic concerns, lecturer issues, facility problems, or general complaints.',
    cta: 'Report Now',
    accentBar: 'bg-red-600',
    numStyle: 'bg-red-50 text-red-600',
    activeRing: 'ring-red-600/20 border-red-300',
    btnVariant: 'destructive',
  },
  {
    type: 'support', icon: '🧠', num: '02',
    title: 'Request Support',
    desc: 'Personal struggles, financial difficulty, or academic pressure — we can help.',
    cta: 'Get Help',
    accentBar: 'bg-green-gradient',
    numStyle: 'bg-green-gradient text-white',
    activeRing: 'ring-green-300 border-green-700',
    btnVariant: 'primary',
  },
  {
    type: 'confidential', icon: '🔒', num: '03',
    title: 'Confidential Report',
    desc: 'Sensitive issues where your identity must remain fully protected and private.',
    cta: 'Submit Confidentially',
    accentBar: 'bg-violet-500',
    numStyle: 'bg-violet-100 text-violet-700',
    activeRing: 'ring-violet-300 border-violet-400',
    btnVariant: 'outline',
  },
]

interface ActionCardsProps {
  activeCard: ReportType | null
  onSelect: (type: ReportType) => void
}

export function ActionCards({ activeCard, onSelect }: ActionCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-2">
      {CARDS.map((c) => {
        const isActive = activeCard === c.type
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
                <span className="text-xl">{c.icon}</span>
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
