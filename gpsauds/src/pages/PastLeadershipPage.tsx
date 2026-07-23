import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  Building, Award, Users, Sparkles,
  GraduationCap, Globe, Heart, ArrowRight, Image as ImageIcon,
  CheckCircle2, X, ShieldCheck, FileText, UserPlus
} from 'lucide-react'
import { legacyApi } from '@/api/services'
import type {
  LegacyAdministration, RecognitionCategoryItem, LegacyTimelineEvent, LegacyAwardItem,
  HistoricalRecordSubmissionInput, LeaderNominationInput
} from '@/types'
import { Button, Modal, Input, PageLoader } from '@/components/ui'

export function PastLeadershipPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<string | null>(null)

  // Modals
  const [detailsModalAdmin, setDetailsModalAdmin] = useState<LegacyAdministration | null>(null)
  const [achievementsModalAdmin, setAchievementsModalAdmin] = useState<LegacyAdministration | null>(null)
  const [categoryModal, setCategoryModal] = useState<RecognitionCategoryItem | null>(null)
  const [awardsModalOpen, setAwardsModalOpen] = useState<boolean>(false)
  const [submissionModalOpen, setSubmissionModalOpen] = useState<boolean>(false)
  const [nominationModalOpen, setNominationModalOpen] = useState<boolean>(false)
  const [successToast, setSuccessToast] = useState<string | null>(null)
  const [errorToast, setErrorToast] = useState<string | null>(null)

  // Fetch page data once with high staleTime for instant, freeze-free performance
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['about-legacy'],
    queryFn: () => legacyApi.getPage(),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })

  // Set page document title on mount
  useEffect(() => {
    document.title = "Past Leadership & Recognition | GPSA-UDS"
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  // Submissions mutation
  const submitRecordMutation = useMutation({
    mutationFn: (input: HistoricalRecordSubmissionInput) => legacyApi.submitRecord(input),
    onSuccess: (res) => {
      setSubmissionModalOpen(false)
      setSuccessToast(res.message || "Historical record submitted successfully!")
      setTimeout(() => setSuccessToast(null), 6000)
    },
    onError: () => {
      setErrorToast("We couldn't submit your record. Please check the form and try again.")
      setTimeout(() => setErrorToast(null), 6000)
    },
  })

  // Nomination mutation
  const submitNominationMutation = useMutation({
    mutationFn: (input: LeaderNominationInput) => legacyApi.submitNomination(input),
    onSuccess: (res) => {
      setNominationModalOpen(false)
      setSuccessToast(res.message || "Nomination submitted successfully!")
      setTimeout(() => setSuccessToast(null), 6000)
    },
    onError: () => {
      setErrorToast("We couldn't submit your nomination. Please check the form and try again.")
      setTimeout(() => setErrorToast(null), 6000)
    },
  })

  // Memoized page collections
  const administrations = useMemo(() => data?.administrations || [], [data])
  const timelineEvents = useMemo(() => data?.timeline || [], [data])
  const categories = useMemo(() => data?.recognition_categories || [], [data])
  const awards = useMemo(() => data?.featured_awards || [], [data])
  const { data: categoryHonourees = [], isLoading: honoureesLoading } = useQuery({
    queryKey: ['legacy-honourees', categoryModal?.slug],
    queryFn: () => legacyApi.listHonourees(categoryModal!.slug),
    enabled: Boolean(categoryModal),
  })
  const { data: allAwards = [], isLoading: allAwardsLoading } = useQuery({
    queryKey: ['legacy-awards'],
    queryFn: legacyApi.listAwards,
    enabled: awardsModalOpen,
  })

  // Instant local administration lookup without network re-fetches
  const selectedAdmin = useMemo(() => {
    return (
      (activeTab ? administrations.find((a) => a.academic_year === activeTab) : null) ||
      data?.selected_administration ||
      administrations[0]
    )
  }, [administrations, activeTab, data?.selected_administration])

  if (isLoading) {
    return <PageLoader />
  }

  if (isError) {
    return (
      <main className="section-container min-h-[60vh] flex items-center justify-center py-16">
        <div className="max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="font-display text-2xl font-bold text-green-900">Past leadership is temporarily unavailable</h1>
          <p className="mt-2 text-sm text-slate-600">We couldn't load the archive. Please try again.</p>
          <Button className="mt-5" variant="primary" onClick={() => void refetch()}>Try Again</Button>
        </div>
      </main>
    )
  }

  const handleTabChange = (year: string) => {
    setActiveTab(year)
  }

  // Icon mapping helper
  const renderIcon = (name?: string | null, className: string = "w-5 h-5") => {
    switch (name) {
      case 'Building': return <Building className={className} />
      case 'Award': return <Award className={className} />
      case 'Users': return <Users className={className} />
      case 'GraduationCap': return <GraduationCap className={className} />
      case 'Globe': return <Globe className={className} />
      case 'Star': return <Sparkles className={className} />
      case 'Handshake': return <Heart className={className} />
      default: return <Award className={className} />
    }
  }

  return (
    <div className="min-h-screen bg-[#f8faf7] text-slate-800 font-body">

      {/* Toast Notification */}
      {successToast && (
        <div role="status" aria-live="polite" className="fixed bottom-6 right-6 z-50 max-w-md bg-green-900 text-white px-5 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-green-700 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-6 h-6 text-gold-400 flex-shrink-0" />
          <p className="text-sm font-500">{successToast}</p>
          <button type="button" aria-label="Dismiss notification" onClick={() => setSuccessToast(null)} className="ml-auto text-white/60 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {errorToast && (
        <div role="alert" className="fixed bottom-6 right-6 z-50 max-w-md rounded-2xl border border-red-700 bg-red-900 px-5 py-4 text-sm text-white shadow-2xl">
          <div className="flex items-center gap-3">
            <p>{errorToast}</p>
            <button type="button" aria-label="Dismiss error" onClick={() => setErrorToast(null)} className="ml-auto text-white/70 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── HERO SECTION ────────────────────────────────────────────────────────── */}
      <div className="section-container pt-6 pb-4">
        <section className="relative overflow-hidden bg-[#002D00] text-white rounded-2xl sm:rounded-3xl p-8 sm:p-12 lg:p-14 shadow-lg border border-[#002000]">
          {/* Background Image with Dark Green Overlay */}
          <div className="absolute inset-0 z-0 opacity-25 mix-blend-overlay">
            <img
              src="https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&w=1800&q=80"
              alt="UDS Campus Building"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#002D00] via-[#002D00]/95 to-[#001A00]/90 z-0" />

          <div className="relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

              {/* Left Content */}
              <div className="lg:col-span-7 space-y-5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/30 text-gold-400 text-xs font-700 tracking-wider uppercase">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{data?.hero_eyebrow}</span>
                </div>

                <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-none">
                  {data?.hero_headline_primary} <br />
                  <span className="text-gold-400">{data?.hero_headline_secondary}</span>
                </h1>

                <p className="text-base sm:text-lg text-white/80 max-w-2xl leading-relaxed font-body">
                  {data?.hero_supporting_text}
                </p>

                {/* Stat Cards Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
                  {data?.statistics.map((stat) => (
                    <div key={stat.label} className="bg-white/10 backdrop-blur-md border border-white/15 rounded-xl p-3.5 text-center hover:bg-white/15 transition-all">
                      <span className="text-gold-400 flex justify-center mb-1">{renderIcon(stat.icon_name, "w-5 h-5")}</span>
                      <p className="font-display text-xl font-bold text-white leading-tight">{stat.value}</p>
                      <p className="text-[11px] text-white/70 font-500">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Quote Card (Glassmorphism) */}
              <div className="lg:col-span-5">
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden group">
                  <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-gold-500/10 rounded-full blur-2xl group-hover:bg-gold-500/20 transition-all" />
                  <span className="text-6xl text-gold-400 font-serif leading-none block mb-2 select-none">“</span>
                  <p className="font-display text-xl sm:text-2xl font-600 text-white italic leading-snug mb-6">
                    {data?.hero_quote_text}
                  </p>
                  <div className="pt-4 border-t border-white/15 flex items-center justify-between text-xs text-white/80 font-500">
                    <span className="text-gold-400 font-bold uppercase tracking-wider">GPSA-UDS Motto</span>
                    <span className="italic">{data?.hero_quote_citation}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>
      </div>

      {/* ── SECTION 1: PAST ADMINISTRATIONS ────────────────────────────────────── */}
      <div className="section-container py-6 sm:py-8">
        <section className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-10">
          {/* Section Title & Tabs */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-[#004D00] text-white flex items-center justify-center font-bold text-sm">1</span>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-green-900">Past Administrations</h2>
            </div>

            {/* Year Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
              {administrations.map((administration) => administration.academic_year).map((tab) => (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  aria-pressed={(activeTab ?? selectedAdmin?.academic_year) === tab}
                  className={`px-4 py-2 rounded-full text-xs sm:text-sm font-600 transition-all flex-shrink-0 ${
                    (activeTab ?? selectedAdmin?.academic_year) === tab
                      ? 'bg-[#004D00] text-white shadow-md'
                      : 'bg-slate-50 text-slate-600 hover:bg-green-50 border border-slate-200'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Selected Administration Display Box */}
          {selectedAdmin ? (
            <div className="bg-slate-50/60 rounded-2xl border border-slate-200/80 p-6 sm:p-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">

                {/* Left Column: Group Photo */}
                <div className="lg:col-span-5 relative group rounded-2xl overflow-hidden min-h-[260px] bg-slate-100 flex items-center justify-center">
                  <img
                    src={selectedAdmin.group_photo_url || "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1000&q=80"}
                    alt={selectedAdmin.group_photo_alt || selectedAdmin.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />
                  <button
                    onClick={() => navigate('/gallery')}
                    className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-md text-green-900 px-3.5 py-2 rounded-xl text-xs font-600 flex items-center gap-2 shadow-md hover:bg-white transition-all"
                  >
                    <ImageIcon className="w-4 h-4 text-green-700" />
                    <span>View Gallery</span>
                  </button>
                </div>

                {/* Center Column: Administration Details & Metrics */}
                <div className="lg:col-span-4 flex flex-col justify-between space-y-6">
                  <div>
                    <h3 className="font-display text-2xl font-bold text-green-900 mb-1">{selectedAdmin.title}</h3>
                    {selectedAdmin.theme && (
                      <p className="text-sm font-600 text-green-800 mb-2">
                        <span className="font-bold text-slate-700">Theme:</span> {selectedAdmin.theme}
                      </p>
                    )}
                    <p className="text-xs text-slate-500 flex items-center gap-1.5 mb-4">
                      <Building className="w-3.5 h-3.5 text-green-600" />
                      <span>
                        Term: {selectedAdmin.starts_at && selectedAdmin.ends_at
                          ? `${new Date(`${selectedAdmin.starts_at}T00:00:00`).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })} – ${new Date(`${selectedAdmin.ends_at}T00:00:00`).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}`
                          : selectedAdmin.academic_year}
                      </span>
                    </p>

                    {/* 4 Stat Items Grid */}
                    <div className="grid grid-cols-2 gap-2.5 my-4">
                      <div className="bg-white border border-slate-200/80 p-2.5 rounded-xl">
                        <p className="font-display text-lg font-bold text-green-900">{selectedAdmin.executive_count}</p>
                        <p className="text-[11px] text-slate-500 font-500">Executives</p>
                      </div>
                      <div className="bg-white border border-slate-200/80 p-2.5 rounded-xl">
                        <p className="font-display text-lg font-bold text-green-900">{selectedAdmin.committee_count}</p>
                        <p className="text-[11px] text-slate-500 font-500">Committees</p>
                      </div>
                      <div className="bg-white border border-slate-200/80 p-2.5 rounded-xl">
                        <p className="font-display text-lg font-bold text-green-900">{selectedAdmin.initiatives_count}</p>
                        <p className="text-[11px] text-slate-500 font-500">Initiatives</p>
                      </div>
                      <div className="bg-white border border-slate-200/80 p-2.5 rounded-xl">
                        <p className="font-display text-lg font-bold text-green-900">{selectedAdmin.lives_impacted || "—"}</p>
                        <p className="text-[11px] text-slate-500 font-500">Lives Impacted</p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                    <Button
                      variant="primary"
                      size="sm"
                      className="flex-1 justify-center gap-1.5"
                      onClick={() => setDetailsModalAdmin(selectedAdmin)}
                    >
                      <span>View Administration Details</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 justify-center gap-1.5"
                      onClick={() => setAchievementsModalAdmin(selectedAdmin)}
                    >
                      <span>View Achievements</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Right Column: Top Leadership Card */}
                <div className="lg:col-span-3 bg-white rounded-2xl p-5 border border-slate-200/80 flex flex-col justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Top Leadership</p>

                    {/* President */}
                    {selectedAdmin.top_leadership.president && <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-200/60">
                      {selectedAdmin.top_leadership.president.photo_url ? (
                        <img
                          src={selectedAdmin.top_leadership.president.photo_url}
                          alt={selectedAdmin.top_leadership.president.full_name}
                          className="w-11 h-11 rounded-full object-cover ring-2 ring-green-600/20"
                        />
                      ) : (
                        <span className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center ring-2 ring-green-600/20" aria-hidden="true">
                          <Users className="w-5 h-5 text-slate-500" />
                        </span>
                      )}
                      <div>
                        <p className="text-[11px] font-bold text-green-700 uppercase tracking-wide">President</p>
                        <p className="text-sm font-bold text-slate-900">{selectedAdmin.top_leadership.president.full_name}</p>
                      </div>
                    </div>}

                    {/* Vice President */}
                    {selectedAdmin.top_leadership.vice_president && <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-200/60">
                      {selectedAdmin.top_leadership.vice_president.photo_url ? (
                        <img
                          src={selectedAdmin.top_leadership.vice_president.photo_url}
                          alt={selectedAdmin.top_leadership.vice_president.full_name}
                          className="w-11 h-11 rounded-full object-cover ring-2 ring-green-600/20"
                        />
                      ) : (
                        <span className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center ring-2 ring-green-600/20" aria-hidden="true">
                          <Users className="w-5 h-5 text-slate-500" />
                        </span>
                      )}
                      <div>
                        <p className="text-[11px] font-bold text-green-700 uppercase tracking-wide">Vice President</p>
                        <p className="text-sm font-bold text-slate-900">{selectedAdmin.top_leadership.vice_president.full_name}</p>
                      </div>
                    </div>}

                    {/* Other Executives */}
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">{selectedAdmin.top_leadership.other_executives_count} Other Executives</p>
                        <p className="text-[10px] text-slate-500 font-500">Board & Committee Officers</p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setDetailsModalAdmin(selectedAdmin)}
                    className="mt-6 text-xs font-bold text-green-800 hover:text-green-950 flex items-center justify-between pt-3 border-t border-slate-200/60 group"
                  >
                    <span>View All Executives</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>

              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
              <p className="text-slate-500 font-500">No administration records found for this academic year.</p>
            </div>
          )}
        </section>
      </div>

      {/* ── SECTION 2: LEADERSHIP TIMELINE ─────────────────────────────────────── */}
      <div className="section-container py-6 sm:py-8">
        <section className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-8">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-[#004D00] text-white flex items-center justify-center font-bold text-sm">2</span>
              <div>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-green-900">Leadership Timeline</h2>
                <p className="mt-1 text-xs sm:text-sm text-slate-500">Milestones that shaped our association</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/about/history')}
              className="ml-11 sm:ml-0 text-xs sm:text-sm font-bold text-green-800 hover:text-green-950 flex items-center gap-1.5 group self-start sm:self-auto"
            >
              <span>View Full Timeline</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {timelineEvents.length > 0 ? (
            <div className="-mx-6 overflow-x-auto px-6 pb-3 sm:-mx-10 sm:px-10 scrollbar-none">
              <ol
                aria-label="GPSA-UDS leadership milestones"
                className="relative flex min-w-max lg:min-w-0 lg:grid lg:grid-cols-6"
              >
                <div
                  aria-hidden="true"
                  className="absolute left-5 right-5 top-6 h-px bg-gradient-to-r from-green-800/20 via-gold-500 to-green-800/20"
                />
                {timelineEvents.map((item: LegacyTimelineEvent, index) => (
                  <li
                    key={item.id}
                    className="group relative w-[230px] snap-start px-3 first:pl-0 last:pr-0 lg:w-auto"
                  >
                    <div className="relative z-10 mb-5 flex h-12 w-12 items-center justify-center rounded-full border-4 border-white bg-[#004D00] text-gold-400 shadow-md transition-transform duration-300 group-hover:-translate-y-1 group-hover:shadow-lg">
                      {renderIcon(item.icon_name, "w-5 h-5")}
                    </div>
                    <div className="pr-5">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="text-sm font-bold tracking-wide text-green-800">{item.year_label}</span>
                        <span className="h-px flex-1 bg-slate-200 lg:hidden" aria-hidden="true" />
                      </div>
                      <h3 className="font-display text-base font-bold leading-snug text-slate-900 transition-colors group-hover:text-green-900">
                        {item.title}
                      </h3>
                      <p className="mt-2 text-xs leading-relaxed text-slate-600">
                        {item.summary}
                      </p>
                      <span className="mt-4 block text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                        Milestone {index + 1}
                      </span>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
              <p className="text-sm font-semibold text-slate-700">Timeline records are being prepared.</p>
              <p className="mt-1 text-xs text-slate-500">Explore the full history archive in the meantime.</p>
            </div>
          )}
        </section>
      </div>

      {/* ── SECTION 3: HALL OF RECOGNITION ────────────────────────────────────── */}
      <div className="section-container py-6 sm:py-8">
        <section className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-10">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-[#004D00] text-white flex items-center justify-center font-bold text-sm">3</span>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-green-900">Hall of Recognition</h2>
            </div>
            <button
              onClick={() => setNominationModalOpen(true)}
              className="text-xs sm:text-sm font-bold text-green-800 hover:text-green-950 flex items-center gap-1.5 group"
            >
              <span>Nominate a Leader</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* 6 Category Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((cat: RecognitionCategoryItem) => (
              <button
                type="button"
                key={cat.id}
                onClick={() => setCategoryModal(cat)}
                className="bg-slate-50/60 rounded-2xl p-6 border border-slate-200 hover:border-green-600/50 hover:shadow-card-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2 transition-all cursor-pointer group flex flex-col justify-between text-left"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-green-50 text-green-800 flex items-center justify-center mb-4 group-hover:bg-[#004D00] group-hover:text-gold-400 transition-colors">
                    {renderIcon(cat.icon_name, "w-6 h-6")}
                  </div>
                  <h3 className="font-display font-bold text-lg text-slate-900 mb-2 group-hover:text-green-900 transition-colors">{cat.name}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">{cat.description}</p>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-slate-200/60 text-xs font-bold text-green-800">
                  <span>{cat.honourees_count} {cat.honourees_count === 1 ? 'Honouree' : 'Honourees'}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* ── SECTION 4: AWARDS & ACHIEVEMENTS ───────────────────────────────────── */}
      <div className="section-container py-6 sm:py-8">
        <section className="bg-[#002D00] text-white rounded-2xl sm:rounded-3xl p-8 sm:p-10 lg:p-12 shadow-lg border border-[#002000]">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-gold-500 text-slate-950 flex items-center justify-center font-bold text-sm">4</span>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">Awards & Achievements</h2>
            </div>
            <button
              onClick={() => setAwardsModalOpen(true)}
              className="text-xs sm:text-sm font-bold text-gold-400 hover:text-gold-300 flex items-center gap-1.5 group"
            >
              <span>Browse Featured Awards</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* 4 Award Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {awards.map((award: LegacyAwardItem) => (
              <div key={award.id} className="bg-[#003800]/90 rounded-2xl overflow-hidden border border-white/15 hover:border-gold-500/40 transition-all flex flex-col justify-between group">
                <div className="h-44 overflow-hidden relative">
                  <img
                    src={award.image_url || "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=600&q=80"}
                    alt={award.image_alt || award.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-gold-400 text-[11px] font-bold px-2.5 py-1 rounded-full border border-gold-500/30">
                    {award.award_year}
                  </span>
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="font-display font-bold text-base text-white mb-2 leading-snug group-hover:text-gold-400 transition-colors">
                      {award.title}
                    </h4>
                    <p className="text-xs text-white/80 leading-relaxed font-body mb-4">
                      "{award.citation}"
                    </p>
                  </div>
                  {award.recipient_name && (
                    <div className="pt-3 border-t border-white/15 text-[11px] text-white/70 font-500">
                      Recipient: <span className="text-white font-bold">{award.recipient_name}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ── SECTION 5: HISTORICAL RECORDS SUBMISSION ────────────────────────────── */}
      <div className="section-container py-6 sm:py-8">
        <section className="bg-gradient-to-br from-[#004D00] to-[#002D00] rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-white relative overflow-hidden shadow-lg border border-[#002000]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            <div className="lg:col-span-8 space-y-4">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-gold-500 text-slate-950 flex items-center justify-center font-bold text-sm">5</span>
                <span className="text-gold-400 font-bold text-xs uppercase tracking-wider">HISTORICAL RECOGNITION ARCHIVE</span>
              </div>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-white leading-tight">
                Share Your Records. Preserve Our Legacy.
              </h2>
              <p className="text-sm sm:text-base text-white/80 leading-relaxed max-w-2xl font-body">
                Do you have historical photos, documents or stories that belong in our archives? Help us keep the GPSA-UDS story alive for future generations.
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <Button
                  variant="gold"
                  size="md"
                  className="gap-2"
                  onClick={() => setSubmissionModalOpen(true)}
                >
                  <FileText className="w-4 h-4" />
                  <span>Submit Historical Records</span>
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  className="gap-2 text-white border-white/30 hover:bg-white/10"
                  onClick={() => setNominationModalOpen(true)}
                >
                  <UserPlus className="w-4 h-4 text-gold-400" />
                  <span>Nominate a Leader</span>
                </Button>
              </div>
            </div>
            <div className="lg:col-span-4 hidden lg:flex justify-end">
              <div className="w-44 h-44 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 p-6 flex flex-col items-center justify-center text-center shadow-xl rotate-3 hover:rotate-0 transition-transform">
                <ShieldCheck className="w-12 h-12 text-gold-400 mb-2" />
                <p className="font-display text-sm font-bold text-white">Verified Archives</p>
                <p className="text-[10px] text-white/70 mt-1">Official Institutional Memory</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ── SECTION 6: FINAL CTA BANNER ────────────────────────────────────────── */}
      <div className="section-container pt-6 pb-12">
        <section className="bg-gradient-to-r from-[#003800] via-[#004D00] to-[#002D00] text-white rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-lg border border-[#002000]">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-white max-w-2xl mx-auto leading-tight">
            Together, we build a legacy that inspires.
          </h2>
          <p className="text-base text-gold-400 font-500 max-w-xl mx-auto">
            Honour the past. Celebrate today. Inspire tomorrow.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Button variant="gold" size="md" onClick={() => navigate('/about/leadership')}>
              View Current Leadership
            </Button>
            <Button variant="outline" size="md" className="text-white border-white/30 hover:bg-white/10" onClick={() => navigate('/about/history')}>
              Explore History & Legacy
            </Button>
            <Button variant="outline" size="md" className="text-white border-white/30 hover:bg-white/10" onClick={() => navigate('/events')}>
              Get Involved
            </Button>
          </div>
        </section>
      </div>

      {/* ── MODALS ────────────────────────────────────────────────────────────── */}

      {/* 1. Submission Modal */}
      <Modal
        isOpen={submissionModalOpen}
        onClose={() => setSubmissionModalOpen(false)}
        title="Submit Historical Records"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            submitRecordMutation.mutate({
              submitter_name: fd.get('submitter_name') as string,
              submitter_email: fd.get('submitter_email') as string,
              submitter_phone: (fd.get('submitter_phone') as string) || undefined,
              relationship_to_gpsa: (fd.get('relationship_to_gpsa') as string) || undefined,
              record_type: fd.get('record_type') as string,
              title: fd.get('title') as string,
              description: fd.get('description') as string,
              administration_year: (fd.get('administration_year') as string) || undefined,
              consent_to_archive: fd.get('consent_to_archive') === 'on',
              consent_to_publish: fd.get('consent_to_publish') === 'on',
              file: fd.get('file') instanceof File && (fd.get('file') as File).size > 0 ? fd.get('file') as File : undefined,
            })
          }}
          className="space-y-4"
        >
          <p className="text-xs text-slate-500 mb-4">
            Submissions are saved securely and reviewed by the executive board prior to publication.
          </p>
          <Input label="Your Name *" name="submitter_name" required placeholder="Full Name" />
          <Input label="Your Email *" name="submitter_email" type="email" required placeholder="name@example.com" />
          <Input label="Phone Number" name="submitter_phone" placeholder="+233 XX XXX XXXX" />
          <Input label="Relationship to GPSA-UDS" name="relationship_to_gpsa" placeholder="e.g. Alumnus, former executive" />

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Record Type *</label>
            <select name="record_type" required className="w-full px-3 py-2 border rounded-xl text-sm bg-white border-slate-300">
              <option value="photograph">Photograph / Image</option>
              <option value="administration_list">Administration Member List</option>
              <option value="award_certificate">Award / Certificate Document</option>
              <option value="speech">Speech / Program Guide</option>
              <option value="story">Historical Story / Memory</option>
            </select>
          </div>

          <Input label="Record Title *" name="title" required placeholder="e.g. 2018 General Assembly Group Photo" />
          <Input label="Administration Year" name="administration_year" placeholder="e.g. 2018/2019" />
          <label className="block">
            <span className="block text-xs font-bold text-slate-700 mb-1">Record attachment</span>
            <input name="file" type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,image/jpeg,image/png,image/webp" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm" />
            <span className="mt-1 block text-[11px] text-slate-500">PDF, Office document or image; maximum 50 MB.</span>
          </label>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Description / Historical Context *</label>
            <textarea
              name="description"
              required
              rows={4}
              className="w-full px-3 py-2 border rounded-xl text-sm bg-white border-slate-300"
              placeholder="Provide details about the people, date, and significance of this record..."
            />
          </div>
          <label className="flex items-start gap-2 text-xs text-slate-700">
            <input name="consent_to_archive" type="checkbox" required className="mt-0.5" />
            <span>I consent to GPSA-UDS securely archiving this record. *</span>
          </label>
          <label className="flex items-start gap-2 text-xs text-slate-700">
            <input name="consent_to_publish" type="checkbox" className="mt-0.5" />
            <span>I also consent to publication after review.</span>
          </label>

          <div className="sticky -bottom-5 z-10 -mx-5 flex justify-end gap-3 border-t border-slate-200 bg-white px-5 pb-1 pt-4 sm:-mx-7 sm:px-7">
            <Button type="button" variant="ghost" onClick={() => setSubmissionModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" loading={submitRecordMutation.isPending}>
              Submit Record
            </Button>
          </div>
        </form>
      </Modal>

      {/* 2. Leader Nomination Modal */}
      <Modal
        isOpen={nominationModalOpen}
        onClose={() => setNominationModalOpen(false)}
        title="Nominate a Leader"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            submitNominationMutation.mutate({
              nominee_name: fd.get('nominee_name') as string,
              nominee_email: (fd.get('nominee_email') as string) || undefined,
              category_id: (fd.get('category_id') as string) || undefined,
              administration_year: (fd.get('administration_year') as string) || undefined,
              reason: fd.get('reason') as string,
              achievements: (fd.get('achievements') as string) || undefined,
              nominator_name: fd.get('nominator_name') as string,
              nominator_email: fd.get('nominator_email') as string,
              relationship_to_nominee: (fd.get('relationship_to_nominee') as string) || undefined,
              consent_confirmed: fd.get('consent_confirmed') === 'on',
            })
          }}
          className="space-y-4"
        >
          <p className="text-xs text-slate-500 mb-4">
            Nominate exceptional past leaders, distinguished alumni, or committee champions for official recognition.
          </p>
          <Input label="Nominee Name *" name="nominee_name" required placeholder="Full Name of Nominee" />
          <Input label="Nominee Email" name="nominee_email" type="email" placeholder="nominee@example.com" />
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Recognition Category</label>
            <select name="category_id" className="w-full px-3 py-2 border rounded-xl text-sm bg-white border-slate-300">
              <option value="">Select a category</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </div>
          <Input label="Administration Year" name="administration_year" placeholder="e.g. 2018/2019" />

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Nomination *</label>
            <textarea
              name="reason"
              required
              rows={4}
              className="w-full px-3 py-2 border rounded-xl text-sm bg-white border-slate-300"
              placeholder="Detail their contributions, leadership impact, and service..."
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Notable Achievements</label>
            <textarea name="achievements" rows={3} className="w-full px-3 py-2 border rounded-xl text-sm bg-white border-slate-300" />
          </div>

          <Input label="Your Name (Nominator) *" name="nominator_name" required placeholder="Your Full Name" />
          <Input label="Your Email (Nominator) *" name="nominator_email" type="email" required placeholder="your.email@example.com" />
          <Input label="Relationship to Nominee" name="relationship_to_nominee" placeholder="e.g. Classmate, colleague" />
          <label className="flex items-start gap-2 text-xs text-slate-700">
            <input name="consent_confirmed" type="checkbox" required className="mt-0.5" />
            <span>I confirm that the information provided is accurate to the best of my knowledge. *</span>
          </label>

          <div className="sticky -bottom-5 z-10 -mx-5 flex justify-end gap-3 border-t border-slate-200 bg-white px-5 pb-1 pt-4 sm:-mx-7 sm:px-7">
            <Button type="button" variant="ghost" onClick={() => setNominationModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" loading={submitNominationMutation.isPending}>
              Submit Nomination
            </Button>
          </div>
        </form>
      </Modal>

      {/* 3. Administration Detail Modal */}
      {detailsModalAdmin && (
        <Modal
          isOpen={Boolean(detailsModalAdmin)}
          onClose={() => setDetailsModalAdmin(null)}
          title={detailsModalAdmin.title}
        >
          <div className="space-y-4">
            {detailsModalAdmin.theme && (
              <p className="text-sm font-bold text-green-900">Theme: {detailsModalAdmin.theme}</p>
            )}
            <p className="text-xs text-slate-600">{detailsModalAdmin.summary}</p>
            <div className="pt-4 border-t border-slate-200">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Top Leadership Officers</p>
              <div className="space-y-3">
                {detailsModalAdmin.top_leadership.president && (
                  <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl">
                    <img src={detailsModalAdmin.top_leadership.president.photo_url || ""} alt="President" className="w-10 h-10 rounded-full object-cover" />
                    <div>
                      <p className="text-xs font-bold text-slate-900">{detailsModalAdmin.top_leadership.president.full_name}</p>
                      <p className="text-[11px] text-green-700 font-bold">President</p>
                    </div>
                  </div>
                )}
                {detailsModalAdmin.top_leadership.vice_president && (
                  <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl">
                    <img src={detailsModalAdmin.top_leadership.vice_president.photo_url || ""} alt="Vice President" className="w-10 h-10 rounded-full object-cover" />
                    <div>
                      <p className="text-xs font-bold text-slate-900">{detailsModalAdmin.top_leadership.vice_president.full_name}</p>
                      <p className="text-[11px] text-green-700 font-bold">Vice President</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="pt-4 flex justify-end">
              <Button variant="primary" onClick={() => setDetailsModalAdmin(null)}>Close</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* 4. Achievements Modal */}
      {achievementsModalAdmin && (
        <Modal
          isOpen={Boolean(achievementsModalAdmin)}
          onClose={() => setAchievementsModalAdmin(null)}
          title={`Achievements — ${achievementsModalAdmin.academic_year}`}
        >
          <div className="space-y-4">
            {achievementsModalAdmin.achievements.length > 0 ? (
              achievementsModalAdmin.achievements.map((ach) => (
                <div key={ach.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <h4 className="text-sm font-bold text-slate-900">{ach.title}</h4>
                  <p className="text-xs text-slate-600 mt-1">{ach.summary}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 py-4 text-center">No published achievements are available for this term yet.</p>
            )}
            <div className="pt-4 flex justify-end">
              <Button variant="primary" onClick={() => setAchievementsModalAdmin(null)}>Close</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* 5. Recognition Category Modal */}
      {categoryModal && (
        <Modal
          isOpen={Boolean(categoryModal)}
          onClose={() => setCategoryModal(null)}
          title={categoryModal.name}
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-600">{categoryModal.description}</p>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <Award className="w-8 h-8 text-gold-500 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-900">{categoryModal.name} Honour Roll</p>
              <p className="text-xs text-slate-500 mt-1">{categoryModal.honourees_count} verified {categoryModal.honourees_count === 1 ? 'honouree' : 'honourees'} in this category.</p>
            </div>
            {honoureesLoading ? <p className="py-4 text-center text-xs text-slate-500">Loading honourees…</p> : categoryHonourees.length ? (
              <div className="space-y-3">
                {categoryHonourees.map((honouree) => (
                  <div key={honouree.id} className="rounded-xl border border-slate-200 p-3">
                    <p className="text-sm font-bold text-slate-900">{honouree.full_name}</p>
                    <p className="text-xs font-semibold text-green-800">{honouree.title}{honouree.recognition_year ? ` · ${honouree.recognition_year}` : ''}</p>
                    {honouree.citation && <p className="mt-1 text-xs text-slate-600">{honouree.citation}</p>}
                  </div>
                ))}
              </div>
            ) : <p className="py-3 text-center text-xs text-slate-500">No published honouree profiles are available yet.</p>}
            <div className="pt-4 flex justify-end">
              <Button variant="primary" onClick={() => setCategoryModal(null)}>Close</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* 6. Awards Modal */}
      <Modal
        isOpen={awardsModalOpen}
        onClose={() => setAwardsModalOpen(false)}
        title="Featured Institutional Awards & Honours"
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {allAwardsLoading && <p className="py-5 text-center text-xs text-slate-500">Loading awards…</p>}
          {(allAwards.length ? allAwards : awards).map((a: LegacyAwardItem) => (
            <div key={a.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex justify-between items-start">
                <h4 className="text-sm font-bold text-slate-900">{a.title}</h4>
                <span className="text-[10px] font-bold bg-green-100 text-green-800 px-2 py-0.5 rounded-full">{a.award_year}</span>
              </div>
              <p className="text-xs text-slate-600 mt-1">"{a.citation}"</p>
            </div>
          ))}
          <div className="pt-4 flex justify-end">
            <Button variant="primary" onClick={() => setAwardsModalOpen(false)}>Close</Button>
          </div>
        </div>
      </Modal>

    </div>
  )
}
