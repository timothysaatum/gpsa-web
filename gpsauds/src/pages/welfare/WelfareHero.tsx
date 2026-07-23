import { Shield, HeartHandshake, Clock, Phone } from 'lucide-react'
import type { WelfareConfig } from '@/types'
import type { welfarePageDefaults } from '@/config/cmsPageDefaults'

interface WelfareHeroProps {
  config: WelfareConfig | undefined
  isLoading: boolean
  settings: typeof welfarePageDefaults
}

export function WelfareHero({ config, isLoading, settings }: WelfareHeroProps) {
  const trustItems = [
    { Icon: Shield, text: settings.trust_confidential },
    { Icon: HeartHandshake, text: settings.trust_review },
    { Icon: Clock, text: settings.trust_response },
    { Icon: Phone, text: settings.trust_contact },
  ]
  return (
    <div
      className="relative overflow-hidden mt-16 lg:mt-[70px] mx-5 sm:mx-8 lg:mx-10 rounded-2xl"
      style={{ background: 'var(--legacy-gradient)', minHeight: '300px' }}
    >
      <div className="absolute inset-0 opacity-[0.045]"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}
      />
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 80% 20%, color-mix(in srgb, var(--gold-old) 18%, transparent) 0%, transparent 55%)' }}
      />

      <div className="relative section-container py-14 lg:py-20">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 mb-5 border border-white/10">
              <span className="w-2 h-2 rounded-full bg-green-gradient animate-pulse flex-shrink-0" />
              <span className="text-white/75 text-xs font-600 tracking-wide">
                {settings.hero_badge}
              </span>
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
              {settings.hero_title_primary}<br />{settings.hero_title_secondary}
            </h1>
            <p className="text-white/65 text-base leading-relaxed max-w-md">
              {settings.hero_description}
            </p>
          </div>

          <div className="flex flex-row lg:flex-col gap-3 flex-shrink-0">
            <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl px-7 py-4 text-center min-w-[110px]">
              <p className="font-display text-3xl font-bold text-white leading-none">
                {isLoading ? '...' : `${config?.avg_response_time_hours ?? 48}h`}
              </p>
              <p className="text-white/50 text-[11px] font-600 tracking-wide mt-1">{settings.response_label}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl px-7 py-4 text-center min-w-[110px]">
              <p className="font-display text-3xl font-bold text-white leading-none">
                {isLoading ? '...' : `${config?.confidential_percent ?? 100}%`}
              </p>
              <p className="text-white/50 text-[11px] font-600 tracking-wide mt-1">{settings.confidentiality_label}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 py-5 mt-10 border-t border-white/10">
          {trustItems.map(({ Icon, text }) => (
            <div key={text} className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
                <Icon className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-xs font-700 text-white/80">{text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
