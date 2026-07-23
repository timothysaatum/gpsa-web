import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Users, Sprout, TrendingUp, Handshake, Star, BookOpen, Heart, Briefcase,
  Globe, Award, GraduationCap, Trophy, ChevronRight, ArrowRight, ShieldCheck
} from 'lucide-react'
import { historyApi } from '@/api/services'
import type { HistoryContent } from '@/types'
import slide1 from '@/assets/KCP_4243.jpg'
import slide2 from '@/assets/KCP_4248.jpg'
import slide3 from '@/assets/KCP_4495.jpg'
import outdoorStudentsImg from '@/assets/outdoor_students.png'
import ctaStudentsImg from '@/assets/cta_students.png'
import udsGateHeroRight from '@/assets/uds_gate_hero_right.png'

export const historyContentTemplate: HistoryContent = {
  hero_eyebrow: 'ABOUT GPSA-UDS',
  hero_title: 'Our History & Legacy',
  hero_intro_primary:
    'From humble beginnings to a vibrant community of leaders, GPSA-UDS has grown through the passion, commitment, and unity of pharmacy students across generations.',
  hero_intro_secondary:
    'Our story is one of service, growth, resilience and the enduring Pharmily spirit that continues to shape our future.',
  milestones: [
    {
      year_label: '2015',
      title: 'The Beginning',
      summary:
        'A small group of passionate pharmacy students laid the foundation for student unity and representation at UDS.',
      icon_name: 'Users',
    },
    {
      year_label: '2018',
      title: 'Official Recognition',
      summary:
        'GPSA-UDS was officially recognised by the School of Pharmacy and the University for Development Studies.',
      icon_name: 'Sprout',
    },
    {
      year_label: '2021',
      title: 'Growth & Expansion',
      summary:
        'Introduction of new welfare initiatives, academic support programmes and professional development activities.',
      icon_name: 'TrendingUp',
    },
    {
      year_label: '2023',
      title: 'Stronger Partnerships',
      summary:
        'Built meaningful partnerships with industry, health institutions and professional bodies to expand opportunities.',
      icon_name: 'Handshake',
    },
    {
      year_label: '2025',
      title: 'Digital Transformation',
      summary:
        'Launched digital platforms, modernised our systems and deepened our impact across campus and communities.',
      icon_name: 'Star',
    },
  ],
  achievements: [
    {
      category: 'Academic Excellence',
      title: 'Academic Excellence',
      summary:
        'Organised countless tutorials, seminars and academic programmes that continue to uplift student performance.',
      icon_name: 'BookOpen',
    },
    {
      category: 'Welfare First',
      title: 'Welfare First',
      summary:
        'Provided welfare support, advocacy and representation that protect and empower students.',
      icon_name: 'Heart',
    },
    {
      category: 'Professional Growth',
      title: 'Professional Growth',
      summary:
        'Created platforms for exposure, internships, workshops and conferences that shape future pharmacists.',
      icon_name: 'Briefcase',
    },
    {
      category: 'Community Impact',
      title: 'Community Impact',
      summary:
        'Led health screenings, outreach programmes and public health campaigns across communities.',
      icon_name: 'Users',
    },
    {
      category: 'National & Global Reach',
      title: 'National & Global Reach',
      summary:
        'Strengthened our presence with National GPSA and expanded our networks beyond borders.',
      icon_name: 'Globe',
    },
    {
      category: 'Leadership Development',
      title: 'Leadership Development',
      summary:
        'Nurtured student leaders who go on to excel in pharmacy and other professional fields.',
      icon_name: 'Award',
    },
  ],
  metrics: [
    { value: '1,250+', label: 'Students represented since inception', icon_name: 'Users' },
    { value: '80+', label: 'Academic programmes organised', icon_name: 'GraduationCap' },
    { value: '320+', label: 'Welfare interventions provided', icon_name: 'Heart' },
    { value: '5,600+', label: 'Community members impacted', icon_name: 'Users' },
    { value: '25+', label: 'Active partnerships and collaborations', icon_name: 'Handshake' },
    { value: '100+', label: 'Student leaders developed', icon_name: 'Award' },
  ],
  traditions: [
    { title: 'Pharmily Unity', description: 'Fostering lifelong solidarity and community spirit.', icon_name: 'Users' },
    { title: 'Excellence in All We Do', description: 'Setting highest standards in academic and clinical endeavors.', icon_name: 'Trophy' },
    { title: 'Service to Humanity', description: 'Dedication to public health screenings and education.', icon_name: 'Heart' },
    { title: 'Leading with Integrity', description: 'Upholding ethical practice and transparency.', icon_name: 'Star' },
    { title: 'Leaving a Lasting Legacy', description: 'Empowering every generation to build for the next.', icon_name: 'Users' },
  ],
  gallery_preview: [
    { id: '1', title: 'Student laboratory practicals', image_url: slide3, thumbnail_url: null, category: 'academic' },
    { id: '2', title: 'GPSA Student Executive delegation', image_url: outdoorStudentsImg, thumbnail_url: null, category: 'leadership' },
    { id: '3', title: 'Pharmacy cohort gathering', image_url: slide1, thumbnail_url: null, category: 'social' },
    { id: '4', title: 'Health week symposium', image_url: slide2, thumbnail_url: null, category: 'academic' },
    { id: '5', title: 'Community health outreach', image_url: outdoorStudentsImg, thumbnail_url: null, category: 'outreach' },
    { id: '6', title: 'Executive inauguration dinner', image_url: ctaStudentsImg, thumbnail_url: null, category: 'social' },
  ],
}

export function HistoryLegacyPage() {
  const navigate = useNavigate()
  const { data: history, isLoading, isError, refetch } = useQuery({
    queryKey: ['history'],
    queryFn: historyApi.get,
    staleTime: 5 * 60 * 1000,
  })

  if (isLoading) return <div className="section-container py-20"><p className="text-center text-slate-500">Loading history…</p></div>
  if (isError) return <div className="section-container py-20 text-center"><p className="text-slate-700">History content is temporarily unavailable.</p><button className="mt-4 btn-primary" onClick={() => void refetch()}>Try again</button></div>
  if (!history) return null

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-800 font-body py-6 space-y-6 sm:space-y-8">
      {/* 1. Hero Section */}
      <HistoryHero history={history} />

      {/* 2. Our Journey Timeline */}
      <HistoryJourneyTimeline milestones={history.milestones} />

      {/* 3. Milestones & Achievements + By The Numbers */}
      <MilestonesAndNumbers
        achievements={history.achievements}
        metrics={history.metrics}
      />

      {/* 4. Traditions — The Pharmily Spirit */}
      <PharmilyTraditionsSection traditions={history.traditions} />

      {/* 5. Historical Photo Gallery Preview */}
      <HistoricalPhotoPreview
        gallery={history.gallery_preview}
        onViewGallery={() => navigate('/gallery')}
      />

      {/* 6. Legacy Call To Action */}
      <LegacyCallToAction navigate={navigate} />
    </div>
  )
}

// ── 1. Hero Section ────────────────────────────────────────────────────────────

function HistoryHero({ history }: { history: HistoryContent }) {
  return (
    <div className="section-container">
      <section className="relative py-14 sm:py-18 lg:py-20 bg-[#002D00] text-white overflow-hidden rounded-2xl sm:rounded-3xl shadow-lg border border-[#002000]">
        {/* Crisp UDS Campus Gate building image on right half matching history_and_legacy.png */}
        <div className="absolute right-0 top-0 bottom-0 w-full sm:w-[52%] lg:w-[48%] h-full z-0 overflow-hidden">
          <img
            src={udsGateHeroRight}
            alt="UDS Campus Gate"
            className="w-full h-full object-cover object-left-top"
          />
          {/* Soft edge blend on left side to transition smoothly into dark green background */}
          <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#002D00] via-[#002D00]/60 to-transparent" />
        </div>

        <div className="relative z-10 px-6 sm:px-10 lg:px-12">
          <div className="max-w-xl text-left">
            {/* Eyebrow: text only in amber/gold */}
            <p className="text-[#d99b26] font-bold uppercase tracking-[0.18em] text-xs sm:text-sm mb-3">
              {history.hero_eyebrow}
            </p>

            {/* Main Title: Clean sans-serif bold matching history_and_legacy.png */}
            <h1 className="font-body text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-4 leading-[1.12]">
              {history.hero_title}
            </h1>

            <div className="space-y-3.5 text-white/90 text-sm sm:text-base leading-relaxed max-w-lg">
              <p>{history.hero_intro_primary}</p>
              <p className="text-white/85">{history.hero_intro_secondary}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

// ── 2. Our Journey Timeline ───────────────────────────────────────────────────

function HistoryJourneyTimeline({ milestones }: { milestones: HistoryContent['milestones'] }) {
  const milestoneIcons = [Users, Sprout, TrendingUp, Handshake, Star]

  return (
    <div className="section-container">
      <section className="py-12 sm:py-16 bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs px-6 sm:px-10">
        {/* Section Header */}
        <div className="text-center max-w-xl mx-auto mb-12">
          <div className="inline-flex items-center gap-3">
            <span className="h-px w-8 bg-amber-500" />
            <p className="text-xs font-bold uppercase tracking-widest text-[#004D00]">
              OUR JOURNEY
            </p>
            <span className="h-px w-8 bg-amber-500" />
          </div>
        </div>

        {/* Desktop Horizontal Timeline matching history_and_legacy.png */}
        <div className="hidden lg:block relative py-6">
          {/* Main horizontal connecting bar */}
          <div className="absolute top-[52px] left-8 right-8 h-[3px] bg-gradient-to-r from-emerald-800 via-emerald-600 to-amber-500 rounded-full z-0" />
          {/* Timeline end arrow */}
          <div className="absolute top-[44px] right-2 text-amber-600 z-0">
            <ChevronRight className="h-5 w-5 font-bold" />
          </div>

          <div className="grid grid-cols-5 gap-4 relative z-10">
            {milestones.map((m, idx) => {
              const Icon = milestoneIcons[idx % milestoneIcons.length]
              return (
                <div key={m.year_label} className="flex flex-col items-center text-center group">
                  {/* Icon Circle */}
                  <div className="w-14 h-14 rounded-full bg-[#004D00] border-4 border-white text-amber-400 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-slate-950 transition-all duration-300 mb-4 cursor-pointer">
                    <Icon className="h-6 w-6" />
                  </div>

                  {/* Year Label */}
                  <span className="font-display text-2xl font-extrabold text-slate-900 mb-1">
                    {m.year_label}
                  </span>

                  {/* Title */}
                  <h4 className="font-display font-bold text-slate-900 text-sm mb-2 group-hover:text-[#004D00] transition-colors">
                    {m.title}
                  </h4>

                  {/* Summary copy */}
                  <p className="text-xs text-slate-600 leading-relaxed max-w-[210px] mx-auto">
                    {m.summary}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Mobile / Tablet Vertical Timeline */}
        <div className="lg:hidden relative pl-6 space-y-8">
          <div className="absolute left-3 top-3 bottom-3 w-[2px] bg-emerald-800/80" />

          {milestones.map((m, idx) => {
            const Icon = milestoneIcons[idx % milestoneIcons.length]
            return (
              <div key={m.year_label} className="relative flex items-start gap-4">
                <div className="absolute -left-6 top-0 w-8 h-8 rounded-full bg-[#004D00] text-amber-400 flex items-center justify-center border-2 border-white shadow-md">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="pl-4 bg-slate-50 p-4 rounded-xl border border-slate-200 w-full">
                  <span className="font-mono font-bold text-amber-700 text-xs">{m.year_label}</span>
                  <h4 className="font-display text-base font-bold text-slate-900 mb-1">{m.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{m.summary}</p>
                </div>
              </div>
            )
          })}
        </div>

      </section>
    </div>
  )
}

// ── 3. Milestones & Achievements + By The Numbers ──────────────────────────────

function MilestonesAndNumbers({
  achievements,
  metrics,
}: {
  achievements: HistoryContent['achievements']
  metrics: HistoryContent['metrics']
}) {
  const achievementIcons = [BookOpen, Heart, Briefcase, Users, Globe, Award]
  const metricIcons = [Users, GraduationCap, Heart, Users, Handshake, Award]

  return (
    <div className="section-container">
      <section className="py-12 sm:py-16 bg-slate-100/70 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs px-6 sm:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-start">

          {/* Left Column: Milestones & Achievements (3x2 Grid) */}
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900 mb-6 text-center lg:text-left tracking-tight">
              MILESTONES & ACHIEVEMENTS
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {achievements.map((item, idx) => {
                const Icon = achievementIcons[idx % achievementIcons.length]
                return (
                  <div
                    key={item.title}
                    className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs hover:shadow-md transition-all hover:border-[#004D00]/40 flex flex-col justify-between"
                  >
                    <div>
                      <div className="w-9 h-9 rounded-xl bg-[#004D00]/10 text-[#004D00] flex items-center justify-center mb-3">
                        <Icon className="h-4.5 w-4.5" />
                      </div>
                      <h3 className="font-display font-bold text-slate-900 text-sm mb-2 leading-tight">
                        {item.title}
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {item.summary}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right Column: By The Numbers (6 Metric Rows) */}
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900 mb-6 text-center lg:text-left tracking-tight">
              BY THE NUMBERS
            </h2>

            <div className="space-y-3">
              {metrics.map((metric, idx) => {
                const Icon = metricIcons[idx % metricIcons.length]
                return (
                  <div
                    key={metric.label}
                    className="bg-white rounded-2xl p-3.5 px-5 border border-slate-200/90 shadow-2xs flex items-center justify-between gap-4 hover:border-amber-500/40 transition-all"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-[#004D00] text-amber-400 flex items-center justify-center shrink-0 shadow-xs">
                        <Icon className="h-5 w-5" />
                      </div>
                      <p className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                        {metric.value}
                      </p>
                    </div>

                    <p className="text-xs font-semibold text-slate-600 leading-tight max-w-[200px] text-right">
                      {metric.label}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>

        </div>
      </section>
    </div>
  )
}

// ── 4. Our Traditions — The Pharmily Spirit ────────────────────────────────────

function PharmilyTraditionsSection({ traditions }: { traditions: HistoryContent['traditions'] }) {
  const traditionIcons = [Users, Trophy, Heart, Star, ShieldCheck]

  return (
    <div className="section-container">
      <section className="py-12 sm:py-16 bg-gradient-to-r from-[#003816] via-[#004D00] to-[#002D00] text-white rounded-2xl sm:rounded-3xl shadow-lg border border-[#002810] px-6 sm:px-10 lg:px-12 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-10 lg:gap-12 items-center">

          {/* Left Side Text */}
          <div className="space-y-4">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight leading-tight">
              OUR TRADITIONS — THE PHARMILY SPIRIT
            </h2>

            <div className="space-y-3 text-white/85 text-sm sm:text-base leading-relaxed max-w-md">
              <p>
                More than activities, traditions are what bind us.
              </p>
              <p>
                From orientation to our signature Pharmily dinner, from outreach to games, we celebrate unity, resilience and the passion for pharmacy.
              </p>
            </div>
          </div>

          {/* Right Side 5 Horizontal Tradition Items matching history_and_legacy.png */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4 divide-y sm:divide-y-0 sm:divide-x divide-white/15 text-center">
            {traditions.map((t, idx) => {
              const Icon = traditionIcons[idx % traditionIcons.length]
              return (
                <div key={t.title} className={idx > 0 ? 'pt-3 sm:pt-0 sm:pl-2' : ''}>
                  <div className="w-10 h-10 rounded-full bg-white/10 border border-amber-400/30 text-amber-400 flex items-center justify-center mx-auto mb-2.5 shadow-sm">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h4 className="font-display font-bold text-white text-xs leading-tight mb-1">
                    {t.title}
                  </h4>
                </div>
              )
            })}
          </div>

        </div>
      </section>
    </div>
  )
}

// ── 5. Historical Photo Preview ────────────────────────────────────────────────

function HistoricalPhotoPreview({
  gallery,
  onViewGallery,
}: {
  gallery: HistoryContent['gallery_preview']
  onViewGallery: () => void
}) {
  const photos = gallery.slice(0, 6)

  return (
    <div className="section-container">
      <section className="py-12 sm:py-16 bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs px-6 sm:px-10 lg:px-12">
        {/* Section Header: centered title with amber line underneath matching template */}
        <div className="text-center max-w-xl mx-auto mb-10">
          <p className="text-xs font-bold uppercase tracking-widest text-[#004D00] mb-2">
            A PEEK INTO OUR JOURNEY
          </p>
          <div className="w-12 h-0.5 bg-amber-500 rounded-full mx-auto" />
        </div>

        {/* 6 Photo Cards Grid matching history_and_legacy.png 100% */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4 items-stretch mb-10">
          {photos.map((photo, idx) => (
            <div
              key={photo.id || idx}
              className="relative h-40 sm:h-44 rounded-2xl overflow-hidden border border-slate-200/90 shadow-2xs group bg-slate-100 hover:shadow-md hover:scale-[1.02] transition-all duration-300 cursor-pointer"
            >
              <img
                src={photo.thumbnail_url ?? photo.image_url ?? slide1}
                alt={photo.title || `Gallery photo ${idx + 1}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          ))}
        </div>

        {/* View Full Photo Archive Button matching history_and_legacy.png */}
        <div className="flex justify-center">
          <button
            onClick={onViewGallery}
            className="px-6 py-2.5 rounded-xl border-2 border-[#004D00] text-[#004D00] font-bold text-xs sm:text-sm hover:bg-[#004D00]/5 transition-all flex items-center gap-2 shadow-2xs cursor-pointer active:scale-95"
          >
            <span>View Full Photo Archive</span>
            <ArrowRight className="h-4 w-4 text-[#004D00]" />
          </button>
        </div>

      </section>
    </div>
  )
}

// ── 6. Legacy Call To Action ───────────────────────────────────────────────────

function LegacyCallToAction({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  return (
    <div className="section-container">
      <section className="bg-gradient-to-r from-[#003816] via-[#004D00] to-[#003012] text-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-xl border border-[#003816] overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">

          {/* Left Icon + Text matching history_and_legacy.png */}
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-12 h-12 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-400 flex items-center justify-center shrink-0 shadow-sm">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Be part of the legacy.
              </h2>
              <p className="text-white/85 text-xs sm:text-sm leading-relaxed mt-0.5">
                Your story continues the story of GPSA-UDS.
              </p>
            </div>
          </div>

          {/* Right Action Buttons matching history_and_legacy.png */}
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 shrink-0 w-full sm:w-auto">
            <button
              onClick={() => navigate('/register')}
              className="px-6 py-3 rounded-xl bg-[#d99b26] hover:bg-[#c4891e] text-white font-bold text-xs shadow-md transition-all transform active:scale-95"
            >
              Join GPSA-UDS
            </button>
            <button
              onClick={() => navigate('/leadership')}
              className="px-6 py-3 rounded-xl border border-white/50 hover:border-white hover:bg-white/10 text-white font-semibold text-xs transition-all flex items-center gap-2"
            >
              <span>Explore Leadership</span>
              <ArrowRight className="h-3.5 w-3.5 text-white" />
            </button>
          </div>

        </div>
      </section>
    </div>
  )
}
