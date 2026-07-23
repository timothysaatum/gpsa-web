import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowRight, Award, Beaker, BookOpen, FileText, FlaskConical,
  Globe2, GraduationCap, Handshake, HeartPulse, Microscope,
  ShieldCheck, Target, Users,
} from 'lucide-react'
import { impactApi } from '@/api/services'
import { Button, EmptyState, PageLoader } from '@/components/ui'

const iconMap = {
  Award, Beaker, BookOpen, FlaskConical, Globe2, GraduationCap,
  Handshake, HeartPulse, Microscope, ShieldCheck, Target, Users,
}

function Icon({ name, className = 'h-5 w-5' }: { name?: string | null; className?: string }) {
  const Component = iconMap[name as keyof typeof iconMap] ?? Target
  return <Component className={className} aria-hidden="true" />
}

const defaults = {
  hero_eyebrow: 'IMPACT & STRATEGIC PRIORITIES',
  hero_title_primary: 'Creating impact.',
  hero_title_secondary: 'Shaping the future.',
  hero_intro: 'GPSA-UDS advances pharmacy education, student welfare, leadership, research, professional development, community health and responsible partnerships.',
  commitment_title: 'Our Commitment',
  commitment_description: 'To develop competent pharmacists, foster leadership, promote research and serve our communities.',
  vision_quote: 'Our vision is a future where every pharmacist is a leader, every community is healthier, and pharmacy practice continues to transform lives.',
  vision_signature: 'Once Pharmily, Always Pharmily.',
  cta_title: 'Be part of the change.',
  cta_description: 'Together, we can build a healthier future.',
}

export function ImpactPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['impact-page'],
    queryFn: impactApi.getPage,
    staleTime: 5 * 60 * 1000,
  })

  useEffect(() => {
    document.title = 'Impact & Strategic Priorities | GPSA-UDS'
    window.scrollTo({ top: 0 })
  }, [])

  if (isLoading) return <PageLoader />
  if (isError || !data) {
    return <main className="section-container py-20 text-center"><EmptyState title="Impact information is temporarily unavailable" description="Please try again shortly." /><Button className="mt-5" onClick={() => void refetch()}>Try again</Button></main>
  }
  const content = { ...defaults, ...data.settings }

  return (
    <main className="min-h-screen bg-slate-50/50 py-6 text-slate-800">
      <div className="section-container space-y-7 sm:space-y-9">
        <section className="relative isolate overflow-hidden rounded-2xl border border-[#002000] bg-[#002D00] text-white shadow-lg sm:rounded-3xl">
          {content.hero_image_url && <img src={content.hero_image_url} alt={content.hero_image_alt || ''} width={1600} height={720} className="absolute inset-0 -z-20 h-full w-full object-cover" />}
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#002D00] via-[#002D00]/95 to-[#001A00]/80" />
          <div className="grid min-h-[470px] items-end gap-8 px-6 py-10 sm:px-10 lg:grid-cols-[1fr_360px] lg:px-14 lg:py-14">
            <div className="max-w-2xl">
              <p className="text-xs font-bold tracking-[.18em] text-gold-400">{content.hero_eyebrow}</p>
              <h1 className="mt-4 font-display text-4xl font-bold leading-[1.06] sm:text-5xl lg:text-6xl">{content.hero_title_primary}<br /><span className="text-gold-400">{content.hero_title_secondary}</span></h1>
              <div className="mt-5 h-0.5 w-12 bg-gold-400" />
              <p className="mt-5 max-w-xl text-sm leading-7 text-white/85 sm:text-base">{content.hero_intro}</p>
            </div>
            <aside className="rounded-2xl border border-white/20 bg-white/10 p-6 shadow-xl backdrop-blur-md">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full border border-gold-400/50 text-gold-400"><Users className="h-5 w-5" /></div>
              <h2 className="font-display text-xl font-bold">{content.commitment_title}</h2>
              <p className="mt-3 text-sm leading-6 text-white/80">{content.commitment_description}</p>
            </aside>
          </div>
        </section>

        {!data.reporting_period ? (
          <section className="rounded-3xl border border-slate-200 bg-white px-6 py-14 text-center">
            <EmptyState title="Verified impact reporting is being prepared" description="Published priorities, metrics and evidence will appear here after institutional review." />
          </section>
        ) : <>
          {!!data.priorities.length && <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10">
            <SectionHeading eyebrow="OUR STRATEGIC PRIORITIES" title="Key pillars guiding our impact" />
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {data.priorities.map((item) => <article key={item.id} className="rounded-2xl border border-slate-200 p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-green-700/30">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-green-50 text-green-800"><Icon name={item.icon_name} /></div>
                <h3 className="mt-4 font-display text-base font-bold text-green-950">{item.title}</h3>
                <p className="mt-3 text-xs leading-6 text-slate-600">{item.description}</p>
                {item.detail_url && <Link className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-green-800" to={item.detail_url}>Explore <ArrowRight className="h-3.5 w-3.5" /></Link>}
              </article>)}
            </div>
          </section>}

          {!!data.metrics.length && <section className="rounded-3xl border border-slate-200/80 bg-slate-100/70 p-6 sm:p-10">
            <SectionHeading eyebrow="OUR IMPACT AT A GLANCE" title="Driving measurable change" />
            <p className="mt-2 text-xs text-slate-500">Verified reporting period: {data.reporting_period.name}</p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {data.metrics.map((metric) => <article key={metric.id} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-800"><Icon name={metric.icon_name} /></div>
                <div><p className="font-display text-2xl font-bold text-green-900">{metric.prefix}{metric.display_value}{metric.suffix}</p><h3 className="text-xs font-semibold text-slate-700">{metric.label}</h3>{metric.description && <p className="mt-1 text-[11px] text-slate-500">{metric.description}</p>}</div>
              </article>)}
            </div>
          </section>}

          {!!data.focus_areas.length && <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10">
            <SectionHeading eyebrow="OUR FOCUS AREAS" title="What we focus on" />
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {data.focus_areas.map((area) => <article key={area.id} className="group relative min-h-[310px] overflow-hidden rounded-2xl bg-[#002D00] text-white">
                {area.image_url && <img loading="lazy" src={area.image_url} alt={area.image_alt || ''} width={640} height={720} className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105" />}
                <div className="absolute inset-0 bg-gradient-to-t from-[#002D00] via-[#004D00]/65 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5"><div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white text-green-900"><Icon name={area.icon_name} /></div><h3 className="font-display text-xl font-bold">{area.title}</h3><p className="mt-2 text-xs leading-5 text-white/80">{area.summary}</p>{area.detail_url && <Link to={area.detail_url} className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-gold-400">Explore <ArrowRight className="h-3.5 w-3.5" /></Link>}</div>
              </article>)}
            </div>
          </section>}

          {!!data.featured_initiatives.length && <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10">
            <SectionHeading eyebrow="FEATURED INITIATIVES" title="Programmes putting strategy into action" />
            <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{data.featured_initiatives.map((initiative) => <article key={initiative.id} className="overflow-hidden rounded-2xl border border-slate-200">
              {initiative.image_url && <img loading="lazy" src={initiative.image_url} alt={initiative.image_alt || ''} width={720} height={400} className="aspect-[16/9] w-full object-cover" />}
              <div className="p-5"><h3 className="font-display text-lg font-bold text-green-950">{initiative.title}</h3><p className="mt-2 text-xs leading-6 text-slate-600">{initiative.summary}</p></div>
            </article>)}</div>
          </section>}

          {!!data.sdg_alignments.length && <section className="rounded-3xl border border-slate-200/80 bg-slate-100/70 p-6 sm:p-10">
            <SectionHeading eyebrow="ALIGNED WITH GLOBAL GOALS" title="Supporting the United Nations Sustainable Development Goals" />
            <p className="mt-2 max-w-3xl text-xs text-slate-500">These alignments describe GPSA-UDS activities; they do not imply a formal partnership with the United Nations.</p>
            <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {data.sdg_alignments.map((item) => <a key={item.id} href={item.goal.official_url} target="_blank" rel="noreferrer" className="min-h-40 rounded-2xl p-5 text-white shadow-sm transition hover:-translate-y-0.5" style={{ backgroundColor: item.goal.official_color }}>
                <p className="text-4xl font-bold">{item.goal.number}</p><h3 className="mt-2 text-sm font-bold uppercase">{item.goal.title}</h3><p className="mt-3 text-xs leading-5 text-white/90">{item.summary}</p>
              </a>)}
            </div>
          </section>}

          {!!data.reports.length && <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10">
            <SectionHeading eyebrow="VERIFIED REPORTING" title="Published impact reports" />
            <div className="mt-6 grid gap-4 sm:grid-cols-2">{data.reports.map((report) => <a key={report.id} href={report.download_url} className="flex items-center gap-4 rounded-2xl border border-slate-200 p-5 hover:border-green-700/30"><FileText className="h-7 w-7 text-green-800" /><div><h3 className="font-bold text-slate-900">{report.title}</h3><p className="text-xs text-slate-500">{report.description || 'Download the published report'}</p></div></a>)}</div>
          </section>}
        </>}

        <section className="grid items-center gap-6 rounded-3xl border border-amber-500/25 bg-amber-500/10 p-7 sm:p-10 lg:grid-cols-[90px_1fr_260px]">
          <span className="font-serif text-7xl leading-none text-green-900">“</span><blockquote className="font-display text-lg font-semibold leading-8 text-green-950 sm:text-xl">{content.vision_quote}</blockquote><p className="border-t border-green-200 pt-5 font-bold text-green-950 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">{content.vision_signature}</p>
        </section>

        <section className="flex flex-col items-center justify-between gap-6 rounded-3xl border border-[#002000] bg-gradient-to-r from-[#003816] via-[#004D00] to-[#002D00] p-7 text-white shadow-lg sm:p-9 lg:flex-row">
          <div><h2 className="font-display text-3xl font-bold">{content.cta_title}</h2><p className="mt-1 text-sm text-white/75">{content.cta_description}</p></div>
          <div className="flex flex-wrap justify-center gap-3"><Button variant="gold" onClick={() => location.assign('/about/leadership')}>View Current Leadership</Button><Button variant="outline-white" onClick={() => location.assign('/events')}>Explore Initiatives</Button><Button variant="outline-white" onClick={() => location.assign('/contact')}>Get Involved</Button></div>
        </section>
      </div>
    </main>
  )
}

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return <header><p className="text-[11px] font-bold tracking-wider text-green-800">{eyebrow}</p><h2 className="mt-2 font-display text-2xl font-bold text-green-950 sm:text-3xl">{title}</h2><div className="mt-3 h-0.5 w-10 bg-gold-500" /></header>
}
