import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Home, ChevronRight } from 'lucide-react'
import { welfareApi } from '@/api/services'
import { ActionCards, ReportFormPanel, WelfareHero, WelfareQuote, SpotlightCard, useWelfareForm } from './welfare'
import { useCmsPageSettings } from '@/hooks/useCmsPageSettings'
import { welfarePageDefaults } from '@/config/cmsPageDefaults'

export function WelfarePage() {
  const { settings } = useCmsPageSettings('welfare', welfarePageDefaults)
  const { activeCard, submitted, form, mutation, isAnonymous, openForm, closeForm } = useWelfareForm()

  const { data: config, isLoading: configLoading } = useQuery({
    queryKey: ['welfare', 'config'],
    queryFn: welfareApi.getConfig,
    staleTime: 5 * 60 * 1000,
  })

  const { data: spotlight, isLoading: spotlightLoading } = useQuery({
    queryKey: ['welfare', 'spotlight'],
    queryFn: welfareApi.getSpotlight,
    staleTime: 5 * 60 * 1000,
  })

  return (
    <>
      {/* Breadcrumbs */}
      <div className="section-container pt-24 lg:pt-28">
        <nav className="flex items-center gap-2 text-xs font-600 text-muted mb-4">
          <Link to="/" className="flex items-center gap-1 hover:text-green-700 transition-colors">
            <Home className="h-3.5 w-3.5" />
            Home
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-deep">Welfare</span>
        </nav>
      </div>

      {/* Hero */}
      <WelfareHero config={config} isLoading={configLoading} settings={settings} />

      {/* Body */}
      <div className="section-container section-padding">
        <div className="mb-6">
          <h2 className="font-display text-2xl font-bold text-deep mb-1">{settings.help_title}</h2>
          <p className="text-sm text-muted">{settings.help_description}</p>
        </div>

        <ActionCards activeCard={activeCard} onSelect={openForm} settings={settings} />
        <ReportFormPanel
          activeCard={activeCard}
          submitted={submitted}
          form={form}
          mutation={mutation}
          isAnonymous={isAnonymous}
          onClose={closeForm}
        />

        <WelfareQuote config={config} />
        <SpotlightCard spotlight={spotlight ?? undefined} isLoading={spotlightLoading} />
      </div>
    </>
  )
}
