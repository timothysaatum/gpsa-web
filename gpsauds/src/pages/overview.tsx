import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowRight, Award, BookOpen, Briefcase, ChevronRight, Eye, Heart, Target,
  Users, Building, CheckCircle2, ShieldCheck, Sparkles, GraduationCap, Smile,
  Handshake, Compass, Lock, Zap
} from 'lucide-react'
import { aboutApi } from '@/api/services'
import { cn } from '@/utils'
import type { AboutContent } from '@/types'
import slide1 from '@/assets/KCP_4243.jpg'
import slide2 from '@/assets/KCP_4248.jpg'
import slide3 from '@/assets/KCP_4495.jpg'
import outdoorStudentsImg from '@/assets/outdoor_students.png'
import ctaStudentsImg from '@/assets/cta_students.png'

const fallback: AboutContent = {
  name: "Ghana Pharmaceutical Students' Association, UDS",
  short_name: 'GPSA-UDS',
  tagline: 'Students first. Pharmacy forward.',
  overview:
    'The Ghana Pharmaceutical Students\' Association at the University for Development Studies is the official representative body for pharmacy students.\n\nWe promote academic excellence, protect student welfare, provide professional-development opportunities and represent the collective interests of our members within the university and the wider pharmacy profession.',
  mission:
    'To promote academic excellence, advocate for students, support welfare, provide professional-development opportunities and represent the collective interests of pharmacy students at UDS.',
  vision:
    'To be a leading student association that empowers pharmacy students to become innovative, ethical and impactful professionals who transform healthcare and communities.',
  values: ['Professionalism', 'Leadership', 'Excellence', 'Integrity', 'Service', 'Unity', 'Innovation'],
  core_values_detailed: [
    { name: 'Professionalism', description: 'Upholding ethical pharmaceutical standards and conduct.' },
    { name: 'Leadership', description: 'Inspiring responsibility, initiative and vision.' },
    { name: 'Excellence', description: 'Striving for distinction in academics and service.' },
    { name: 'Integrity', description: 'Fostering honesty, transparency and trust.' },
    { name: 'Service', description: 'Dedicated to student welfare and public health outreach.' },
    { name: 'Unity', description: 'Fostering solidarity across all year groups and cohorts.' },
    { name: 'Innovation', description: 'Embracing modern approaches to learning and governance.' },
  ],
  pillars: [
    { title: 'Academic Development', body: 'Tutorials, seminars, study resources, and academic advocacy.' },
    { title: 'Student Welfare', body: 'Welfare support, confidential assistance, and advocacy.' },
    { title: 'Professional Development', body: 'Conferences, workshops, career programs, and industry exposure.' },
    { title: 'Community Engagement', body: 'Health screenings, public health campaigns, and community outreach.' },
    { title: 'Social & Student Life', body: 'Orientation, sports, dinners, entertainment, and networking.' },
  ],
  what_we_do: [
    {
      title: 'Academic Development',
      description: 'Strengthening academic performance and learning resources.',
      items: ['Tutorials', 'Academic seminars', 'Study resources', 'Academic advocacy'],
      href: '/academics',
    },
    {
      title: 'Student Welfare',
      description: 'Providing responsive care and emergency assistance.',
      items: ['Welfare support', 'Confidential assistance', 'Advocacy', 'Representation'],
      href: '/welfare',
    },
    {
      title: 'Professional Development',
      description: 'Preparing students for impactful pharmacy careers.',
      items: ['Conferences', 'Workshops', 'Career programmes', 'Industry exposure'],
      href: '/opportunities',
    },
    {
      title: 'Community Engagement',
      description: 'Extending healthcare impact to local communities.',
      items: ['Health screenings', 'Public health campaigns', 'Community outreach', 'Health education'],
      href: '/events',
    },
    {
      title: 'Social & Student Life',
      description: 'Fostering camaraderie, balance and vibrant campus life.',
      items: ['Orientation', 'Games & sports', 'Dinners', 'Entertainment'],
      href: '/events',
    },
  ],
  governance: [
    { title: 'General Assembly', description: 'The highest deliberative body where members discuss and decide on major policies and reports.' },
    { title: 'Executive Board', description: 'Leads the association and is responsible for day-to-day administration and implementation of programmes.' },
    { title: 'Standing Committees', description: 'Support specialised areas including academics, welfare, events, communications and professional development.' },
    { title: 'Judicial Board', description: 'Interprets governing rules and handles constitutional and disciplinary matters within its mandate.' },
    { title: 'Electoral Commission', description: 'Independently manages elections and ensures a fair and transparent electoral process.' },
  ],
  strategic_priorities: [
    { title: 'Academic Excellence', description: 'Strengthen academic support systems and promote a culture of excellence.' },
    { title: 'Responsive Welfare', description: 'Create a safe, supportive and caring environment for all students.' },
    { title: 'Professional Exposure', description: 'Increase student access to industry and professional opportunities.' },
    { title: 'Transparent Leadership', description: 'Uphold accountability, openness and effective communication.' },
    { title: 'Community Impact', description: 'Expand outreach and improve health outcomes in our communities.' },
    { title: 'Digital Transformation', description: 'Leverage technology to improve communication and services.' },
  ],
  impact_metrics: {
    reporting_period: '2025/2026 Impact',
    students_represented: '1,250+',
    programmes_organised: '28',
    welfare_interventions: '320+',
    outreach_beneficiaries: '5,600+',
    opportunities_shared: '150+',
    active_partnerships: '25+',
  },
  president_welcome: {
    name: 'Jacob N. Adjei',
    title: 'President, GPSA-UDS',
    admin_year: '2025/2026 Administration',
    photo_url: slide2,
    message:
      'Welcome to GPSA-UDS. Together, we are building a community where every pharmacy student is supported, every voice is heard and every dream is possible.\n\nAs your President, I encourage you to get involved, take advantage of the opportunities we create and help us shape a stronger, more impactful association.',
  },
  timeline: [
    { year: '2015', title: 'Formation of GPSA-UDS', body: 'GPSA-UDS began formal student representation and advocacy.' },
    { year: '2018', title: 'Growth of welfare & academic support', body: 'A clearer welfare channel was established for student wellbeing.' },
    { year: '2021', title: 'Expansion of professional programmes', body: 'Academic support expanded through shared learning material.' },
    { year: '2024', title: 'Launch of digital student platform', body: 'Events, resources, welfare, news, gallery, and opportunities moved into one public platform.' },
  ],
  partners: [
    { name: 'University for Development Studies', logo_key: 'UDS' },
    { name: 'School of Pharmacy', logo_key: 'SOP' },
    { name: 'National GPSA', logo_key: 'GPSA' },
    { name: 'Pharmaceutical Society of Ghana', logo_key: 'PSGH' },
    { name: 'Pharmacy Council', logo_key: 'PC' },
    { name: 'Korle Bu Teaching Hospital', logo_key: 'KBTH' },
    { name: 'Tobinco Pharmaceuticals', logo_key: 'Tobinco' },
    { name: 'Ernest Chemists Foundation', logo_key: 'Ernest' },
    { name: 'GSK Ghana', logo_key: 'GSK' },
  ],
  stats: { total_users: 1250, active_members: 320, total_events: 28, total_resources: 150 },
  featured_news: null,
  upcoming_events: [],
  open_opportunities: [],
  gallery_highlights: [
    { id: '1', title: 'Pharmacy Outreach 2025', image_url: slide1, thumbnail_url: null, category: 'events' },
    { id: '2', title: 'Academic Seminar', image_url: slide2, thumbnail_url: null, category: 'academic' },
    { id: '3', title: 'Community Health Screening', image_url: slide3, thumbnail_url: null, category: 'outreach' },
    { id: '4', title: 'Executive Inauguration', image_url: slide1, thumbnail_url: null, category: 'social' },
    { id: '5', title: 'Student Welfare Outreach', image_url: slide2, thumbnail_url: null, category: 'welfare' },
  ],
  welfare: {
    emergency_contact: '',
    avg_response_time_hours: 48,
    confidential_percent: 100,
    total_reports: 0,
    total_resolved: 0,
    resolved_this_month: 0,
    trust_items: [],
  },
}

export function OverviewPage() {
  const navigate = useNavigate()
  const { data } = useQuery({
    queryKey: ['about'],
    queryFn: aboutApi.get,
    staleTime: 5 * 60 * 1000,
  })
  const about = data ?? fallback

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-800 font-body">
      {/* 1. Hero Section */}
      <HeroSection onJoin={() => navigate('/register')} />

      {/* 2. Annual Impact Bar */}
      <AnnualImpactBar impact={about.impact_metrics} />

      {/* 3. Who We Are & President's Welcome Grid */}
      <WhoWeAreAndPresidentGrid about={about} onViewLeadership={() => navigate('/leadership')} />

      {/* 4. Purpose and Beliefs (Mission, Vision, Values) */}
      <PurposeAndBeliefsSection about={about} />

      {/* 5. What We Do Section */}
      <WhatWeDoSection whatWeDo={about.what_we_do ?? fallback.what_we_do!} navigate={navigate} />

      {/* 6. Governance & Priorities Grid */}
      <GovernanceAndPrioritiesGrid about={about} navigate={navigate} />

      {/* 7. Community Moments Gallery Band */}
      <CommunityMomentsSection gallery={about.gallery_highlights} onViewGallery={() => navigate('/gallery')} />

      {/* 8. History & Partners Grid */}
      <HistoryAndPartnersGrid timeline={about.timeline} partners={about.partners ?? fallback.partners!} navigate={navigate} />

      {/* 9. Final Call to Action Banner */}
      <FinalCallToActionBanner navigate={navigate} />
    </div>
  )
}

// Backward compatibility aliases
export const AboutOverviewPage = OverviewPage
export const AboutPage = OverviewPage

// ── 1. Hero Section ────────────────────────────────────────────────────────────

function HeroSection({ onJoin }: { onJoin: () => void }) {
  const scrollToWhatWeDo = () => {
    document.getElementById('what-we-do')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="bg-white py-12 lg:py-16 border-b border-slate-100 relative overflow-hidden">
      <div className="section-container grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-16 items-center">
        {/* Left Column Text */}
        <div className="space-y-6 z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#004D00]/10 border border-[#004D00]/20 text-[#004D00] text-xs font-700 uppercase tracking-widest">
            <Sparkles className="h-3.5 w-3.5 text-amber-600" />
            <span>ABOUT GPSA-UDS</span>
          </div>

          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-[1.08] tracking-tight">
            Students first.<br />
            <span className="text-[#004D00]">Pharmacy forward.</span>
          </h1>

          <div className="space-y-4 text-slate-600 text-base sm:text-lg leading-relaxed max-w-xl">
            <p>
              The Ghana Pharmaceutical Students' Association at the University for Development Studies is the official representative body for pharmacy students.
            </p>
            <p>
              We promote academic excellence, protect student welfare, provide professional-development opportunities and represent the collective interests of our members within the university and the wider pharmacy profession.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={onJoin}
              className="px-6 py-3.5 rounded-xl bg-[#004D00] hover:bg-[#003800] text-white font-600 text-sm shadow-lg shadow-[#004D00]/20 transition-all flex items-center gap-2 transform active:scale-95"
            >
              <span>Join GPSA-UDS</span>
              <ArrowRight className="h-4 w-4 text-amber-400" />
            </button>
            <button
              onClick={scrollToWhatWeDo}
              className="px-6 py-3.5 rounded-xl border border-slate-300 hover:border-slate-400 text-slate-800 font-600 text-sm transition-all hover:bg-slate-50"
            >
              Explore Our Work
            </button>
          </div>
        </div>

        {/* Right Column Photo Collage - Angled Seamless Layout matching overview.png */}
        <div className="relative">
          {/* Right Column Photo Collage - 2 Top + 2 Below 2x2 Grid matching overview.png */}
          <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-slate-900/5 p-1.5 border border-slate-200/80 [clip-path:polygon(6%_0,100%_0,100%_100%,0%_100%)] sm:[clip-path:polygon(8%_0,100%_0,100%_100%,0%_100%)]">
            <div className="space-y-2">
              {/* Top 2 Images */}
              <div className="grid grid-cols-2 gap-2">
                <div className="relative h-48 sm:h-56 rounded-2xl overflow-hidden group">
                  <img
                    src={slide1}
                    alt="GPSA Executive team"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                </div>

                <div className="relative h-48 sm:h-56 rounded-2xl overflow-hidden group">
                  <img
                    src={slide3}
                    alt="Community outreach"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                </div>
              </div>

              {/* Bottom 2 Images */}
              <div className="grid grid-cols-2 gap-2">
                <div className="relative h-48 sm:h-56 rounded-2xl overflow-hidden group">
                  <img
                    src={slide2}
                    alt="Students in lab"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                </div>

                <div className="relative h-48 sm:h-56 rounded-2xl overflow-hidden group">
                  <img
                    src={slide1}
                    alt="Academic seminar"
                    className="w-full h-full object-cover object-bottom group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                </div>
              </div>
            </div>
          </div>

          {/* Floating Dark Green Overlay Card with Rx Emblem Watermark */}
          <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 bg-[#004D00] text-white p-5 sm:p-6 rounded-2xl shadow-2xl max-w-[260px] sm:max-w-[285px] border border-amber-400/40 z-10 overflow-hidden transform hover:-translate-y-1 transition-all">
            {/* Rx Crest Emblem Watermark */}
            <div className="absolute -right-4 -bottom-4 text-white/10 pointer-events-none select-none">
              <svg className="w-36 h-36" viewBox="0 0 100 100" fill="currentColor">
                <path d="M20 15 h35 a18 18 0 0 1 0 36 h-18 v34 h-12 v-70 z M32 27 v12 h23 a6 6 0 0 0 0 -12 h-23 z" />
                <path d="M38 46 l34 39 h-14 l-31 -35 z" />
                <path d="M48 55 l18 -15 l8 9 l-18 15 z" />
              </svg>
            </div>

            <h4 className="font-display text-xl sm:text-2xl font-bold text-white leading-tight mb-2 relative z-10">
              Advocacy, care and excellence.
            </h4>
            <p className="text-xs sm:text-sm text-white/80 leading-relaxed relative z-10">
              Uniting students to build a stronger pharmacy future.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── 2. Annual Impact Bar ──────────────────────────────────────────────────────

function AnnualImpactBar({ impact }: { impact?: AboutContent['impact_metrics'] }) {
  const m = impact ?? fallback.impact_metrics!

  const metrics = [
    { value: m.students_represented, label: 'Students Represented', icon: Users },
    { value: m.programmes_organised, label: 'Academic Programmes Organised', icon: BookOpen },
    { value: m.welfare_interventions, label: 'Welfare Interventions', icon: Heart },
    { value: m.outreach_beneficiaries, label: 'Outreach Beneficiaries', icon: Users },
    { value: m.opportunities_shared, label: 'Opportunities Shared', icon: Briefcase },
    { value: m.active_partnerships, label: 'Active Partnerships', icon: Handshake },
  ]

  return (
    <div className="section-container py-6">
      <section className="bg-gradient-to-r from-[#002D00] via-[#004D00] to-[#002D00] text-white py-8 px-6 rounded-2xl shadow-xl relative overflow-hidden border border-[#002D00]">
        {/* Subtle background glow pattern */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#C8912E_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-y-6 gap-x-2 divide-y sm:divide-y-0 lg:divide-x divide-white/15 text-center relative z-10">
          {metrics.map(({ value, label, icon: Icon }, idx) => (
            <div key={label} className={cn('pt-4 sm:pt-0 flex flex-col items-center justify-center px-2', idx > 0 && 'lg:pl-3')}>
              <div className="w-9 h-9 rounded-xl bg-white/10 border border-amber-400/30 flex items-center justify-center mb-2.5 shadow-sm">
                <Icon className="h-4.5 w-4.5 text-amber-400" />
              </div>
              <p className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-amber-400 leading-none mb-1">
                {value}
              </p>
              <p className="text-xs sm:text-sm font-500 text-white/90 leading-tight max-w-[130px] mx-auto">
                {label}
              </p>
            </div>
          ))}
        </div>

        <div className="text-center mt-6 pt-4 border-t border-white/15 max-w-7xl mx-auto flex justify-center relative z-10">
          <span className="text-[11px] font-bold text-amber-400 uppercase tracking-widest bg-[#002D00]/80 px-4 py-1 rounded-full border border-amber-400/30 shadow-inner">
            {m.reporting_period}
          </span>
        </div>
      </section>
    </div>
  )
}

// ── 3. Who We Are & President's Welcome Grid ──────────────────────────────────

function WhoWeAreAndPresidentGrid({ about, onViewLeadership }: { about: AboutContent; onViewLeadership: () => void }) {
  const p = about.president_welcome ?? fallback.president_welcome!

  return (
    <section className="py-16 lg:py-20">
      <div className="section-container grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">

        {/* Left Card: Who We Are */}
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div>
            <p className="text-xs font-700 uppercase tracking-widest text-[#004D00] mb-2 flex items-center gap-1.5">
              <Building className="h-3.5 w-3.5 text-amber-600" />
              <span>WHO WE ARE</span>
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
              {about.name}
            </h2>
            <div className="space-y-4 text-slate-600 text-sm sm:text-base leading-relaxed">
              <p>
                We are the recognised student body representing all pharmacy students at the University for Development Studies.
              </p>
              <p>
                We work in collaboration with the Faculty of Applied Sciences and Technology, Department of Pharmacy, University administration, National GPSA and the pharmacy profession to advance the academic, welfare and professional interests of our members.
              </p>
              <p>
                Our purpose is to represent students, support academic excellence, promote welfare, build leadership and prepare students to become competent, compassionate and ethical pharmacy professionals.
              </p>
            </div>
          </div>

          {/* Institutional Flow Diagram */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-1.5 text-center text-xs">
              <div className="flex-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex flex-col justify-center items-center w-full min-h-[72px]">
                <Building className="h-4 w-4 mb-1 text-slate-600" />
                <span className="font-600 text-slate-800 text-[11px] leading-tight">University for Development Studies</span>
              </div>

              <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0 hidden sm:block" />

              <div className="flex-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex flex-col justify-center items-center w-full min-h-[72px]">
                <GraduationCap className="h-4 w-4 mb-1 text-slate-600" />
                <span className="font-600 text-slate-800 text-[11px] leading-tight">School of Pharmacy</span>
              </div>

              <ChevronRight className="h-3.5 w-3.5 text-[#004D00] shrink-0 hidden sm:block font-bold" />

              <div className="flex-1 bg-[#004D00]/10 border border-[#004D00]/30 p-2.5 rounded-xl flex flex-col justify-center items-center w-full min-h-[72px] shadow-xs">
                <ShieldCheck className="h-4 w-4 mb-1 text-[#004D00]" />
                <span className="font-700 text-[#004D00] text-[11px] leading-tight">GPSA-UDS</span>
              </div>

              <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0 hidden sm:block" />

              <div className="flex-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex flex-col justify-center items-center w-full min-h-[72px]">
                <Users className="h-4 w-4 mb-1 text-slate-600" />
                <span className="font-600 text-slate-800 text-[11px] leading-tight">Pharmacy Students</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Card: President's Welcome */}
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div>
            <p className="text-xs font-700 uppercase tracking-widest text-[#004D00] mb-2 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-600" />
              <span>PRESIDENT'S WELCOME</span>
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 mb-6">
              A message from our President
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-6 items-start">
              {/* President Profile */}
              <div className="flex flex-col items-center text-center">
                <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-amber-500 shadow-md mb-3">
                  <img
                    src={p.photo_url ?? slide2}
                    alt={p.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h4 className="font-display font-bold text-slate-900 text-base leading-tight">
                  {p.name}
                </h4>
                <p className="text-xs text-slate-500 font-500 mt-0.5">{p.title}</p>
                <span className="mt-2 text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#004D00]/10 text-[#004D00] border border-[#004D00]/20">
                  {p.admin_year}
                </span>
              </div>

              {/* Welcome Message Text */}
              <div className="text-slate-600 text-sm leading-relaxed space-y-3">
                {p.message.split('\n\n').map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
            <button
              onClick={onViewLeadership}
              className="px-5 py-2.5 rounded-xl border border-slate-300 hover:border-slate-400 text-slate-800 font-600 text-xs transition-all flex items-center gap-2 hover:bg-slate-50"
            >
              <span>Meet the Executive Team</span>
              <ChevronRight className="h-4 w-4 text-[#004D00]" />
            </button>
          </div>
        </div>

      </div>
    </section>
  )
}

// ── 4. Purpose and Beliefs (Mission, Vision, Core Values) ──────────────────────

function PurposeAndBeliefsSection({ about }: { about: AboutContent }) {
  const values = about.core_values_detailed ?? fallback.core_values_detailed!

  const valueIcons: Record<string, typeof ShieldCheck> = {
    Professionalism: ShieldCheck,
    Leadership: Compass,
    Excellence: Award,
    Integrity: Lock,
    Service: Heart,
    Unity: Users,
    Innovation: Zap,
  }

  return (
    <section className="py-16 lg:py-20 bg-slate-100/70 border-y border-slate-200/80">
      <div className="section-container">
        <div className="text-center mb-12">
          <p className="text-xs font-700 uppercase tracking-widest text-[#004D00] mb-2">
            OUR PURPOSE AND BELIEFS
          </p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900">
            Mission, Vision & Core Values
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {/* Mission Card (Brand Primary Green) */}
          <div className="bg-[#004D00] text-white rounded-2xl p-8 shadow-xl flex flex-col justify-between border border-[#003800] relative overflow-hidden">
            <div className="relative z-10">
              <div className="w-11 h-11 rounded-full bg-amber-400/20 border border-amber-400/40 flex items-center justify-center mb-6">
                <Target className="h-5.5 w-5.5 text-amber-400" />
              </div>
              <h3 className="font-display text-2xl font-bold text-white mb-4">Our Mission</h3>
              <p className="text-amber-100/90 text-sm sm:text-base leading-relaxed">
                {about.mission}
              </p>
            </div>
          </div>

          {/* Vision Card (Brand Amber / Gold) */}
          <div className="bg-[#C8912E] text-slate-950 rounded-2xl p-8 shadow-xl flex flex-col justify-between border border-amber-600/30 relative overflow-hidden">
            <div className="relative z-10">
              <div className="w-11 h-11 rounded-full bg-slate-950/20 border border-slate-950/40 flex items-center justify-center mb-6">
                <Eye className="h-5.5 w-5.5 text-slate-950" />
              </div>
              <h3 className="font-display text-2xl font-bold text-slate-950 mb-4">Our Vision</h3>
              <p className="text-slate-950/90 text-sm sm:text-base leading-relaxed font-500">
                {about.vision}
              </p>
            </div>
          </div>

          {/* Core Values Card (Clean White with 2-Column Grid matching overview.png) */}
          <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-xl flex flex-col justify-between">
            <div>
              <h3 className="font-display text-2xl font-bold text-slate-900 mb-6">Our Core Values</h3>
              <div className="grid grid-cols-2 gap-3.5">
                {values.map((v) => {
                  const Icon = valueIcons[v.name] ?? Sparkles
                  return (
                    <div key={v.name} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 hover:border-[#004D00]/30 transition-colors">
                      <div className="w-7 h-7 rounded-full bg-[#004D00] text-amber-400 flex items-center justify-center shrink-0 shadow-xs">
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <span className="font-700 text-slate-900 text-xs sm:text-sm leading-tight">{v.name}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── 5. What We Do Section ─────────────────────────────────────────────────────

function WhatWeDoSection({ whatWeDo, navigate }: { whatWeDo: AboutContent['what_we_do']; navigate: ReturnType<typeof useNavigate> }) {
  const categoryIcons = [BookOpen, Heart, Briefcase, Users, Smile]

  return (
    <section id="what-we-do" className="py-16 lg:py-24">
      <div className="section-container">
        <div className="text-center mb-14">
          <p className="text-xs font-700 uppercase tracking-widest text-[#004D00] mb-2">WHAT WE DO</p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900">
            Empowering Pharmacy Students Across 5 Pillars
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {whatWeDo?.map((item, idx) => {
            const Icon = categoryIcons[idx % categoryIcons.length]
            return (
              <div
                key={item.title}
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group hover:border-[#004D00]/40"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-[#004D00]/10 flex items-center justify-center mb-4 text-[#004D00] group-hover:bg-[#004D00] group-hover:text-white transition-colors">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-base font-bold text-slate-900 mb-3">
                    {item.title}
                  </h3>
                  <ul className="space-y-1.5 text-xs text-slate-600 mb-6">
                    {item.items.map((subItem) => (
                      <li key={subItem} className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        <span>{subItem}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {item.href && (
                  <button
                    onClick={() => navigate(item.href!)}
                    className="text-xs font-600 text-[#004D00] hover:text-amber-700 transition-colors flex items-center gap-1 mt-auto pt-4 border-t border-slate-100"
                  >
                    <span>Learn more</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ── 6. Governance & Priorities Grid ───────────────────────────────────────────

function GovernanceAndPrioritiesGrid({ about, navigate }: { about: AboutContent; navigate: ReturnType<typeof useNavigate> }) {
  const gov = about.governance ?? fallback.governance!
  const prio = about.strategic_priorities ?? fallback.strategic_priorities!

  return (
    <section className="py-16 lg:py-20 bg-slate-100/70 border-y border-slate-200/80">
      <div className="section-container grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">

        {/* Left Column: Governance */}
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-xs font-700 uppercase tracking-widest text-[#004D00] mb-2">GOVERNANCE AT A GLANCE</p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 mb-6">
              How GPSA-UDS is Governed
            </h2>

            <div className="space-y-4">
              {gov.map((g) => (
                <div key={g.title} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-[#004D00]/10 text-[#004D00] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-700 text-slate-900 text-sm">{g.title}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">{g.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100">
            <button
              onClick={() => navigate('/leadership')}
              className="px-5 py-2.5 rounded-xl border border-slate-300 hover:border-slate-400 text-slate-800 font-600 text-xs transition-all flex items-center gap-2 hover:bg-slate-50"
            >
              <span>Explore Leadership & Governance</span>
              <ArrowRight className="h-3.5 w-3.5 text-[#004D00]" />
            </button>
          </div>
        </div>

        {/* Right Column: Priorities */}
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-xs font-700 uppercase tracking-widest text-[#004D00] mb-2">STRATEGIC ROADMAP</p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 mb-6">
              Our Priorities for 2025/2026
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {prio.map((p) => (
                <div key={p.title} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
                  <div className="flex items-center gap-2 text-[#004D00] font-700 text-xs mb-1">
                    <CheckCircle2 className="h-4 w-4 text-amber-600" />
                    <span>{p.title}</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{p.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100">
            <button
              onClick={() => navigate('/about')}
              className="px-5 py-2.5 rounded-xl border border-slate-300 hover:border-slate-400 text-slate-800 font-600 text-xs transition-all flex items-center gap-2 hover:bg-slate-50"
            >
              <span>View Our Strategic Plan</span>
              <ArrowRight className="h-3.5 w-3.5 text-[#004D00]" />
            </button>
          </div>
        </div>

      </div>
    </section>
  )
}

// ── 7. Community Moments Gallery ──────────────────────────────────────────────

function CommunityMomentsSection({ gallery, onViewGallery }: { gallery: AboutContent['gallery_highlights']; onViewGallery: () => void }) {
  const fallbackGallery = [
    { id: '1', title: 'Student leadership & advocacy', image_url: slide1, thumbnail_url: null, category: 'social' },
    { id: '2', title: 'Health outreach screening', image_url: slide2, thumbnail_url: null, category: 'outreach' },
    { id: '3', title: 'Academic practical session', image_url: slide3, thumbnail_url: null, category: 'academic' },
    { id: '4', title: 'Committee planning workshop', image_url: slide1, thumbnail_url: null, category: 'welfare' },
    { id: '5', title: 'Executive inauguration dinner', image_url: slide2, thumbnail_url: null, category: 'social' },
  ]

  const displayImages = (gallery && gallery.length >= 5 ? gallery : [...(gallery ?? []), ...fallbackGallery]).slice(0, 5)

  return (
    <section className="py-16 lg:py-20">
      <div className="section-container">
        <div className="text-center mb-10">
          <p className="text-xs font-700 uppercase tracking-widest text-[#004D00] mb-2">GALLERY</p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900">
            Community Moments
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 items-stretch">
          {displayImages.map((img, idx) => (
            <div key={img.id || idx} className="relative h-48 rounded-2xl overflow-hidden shadow-sm border border-slate-200 group bg-slate-100">
              <img
                src={img.thumbnail_url ?? img.image_url ?? slide1}
                alt={img.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <p className="absolute bottom-3 left-3 right-3 text-white text-[11px] font-600 leading-tight line-clamp-2">
                {img.title}
              </p>
            </div>
          ))}

          {/* Final Summary Card (Brand Primary Green) */}
          <div className="bg-[#004D00] text-white p-5 rounded-2xl shadow-sm border border-[#003800] flex flex-col justify-between items-start min-h-[192px]">
            <div>
              <p className="font-display font-bold text-lg leading-tight text-white mb-2">
                More memories.<br />More impact.
              </p>
            </div>
            <button
              onClick={onViewGallery}
              className="w-full py-2.5 px-3 rounded-xl bg-amber-400 text-slate-950 hover:bg-amber-300 font-bold text-xs transition-all mt-auto text-center shadow-sm transform active:scale-95"
            >
              View Photo Archive
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── 8. History & Partners Grid ────────────────────────────────────────────────

// ── 8. History & Partners Grid ────────────────────────────────────────────────

function LogoUDS() {
  return (
    <div className="w-8 h-8 rounded-full border border-blue-900/40 bg-blue-50/80 flex items-center justify-center p-0.5 shrink-0 shadow-2xs">
      <svg viewBox="0 0 36 36" className="w-full h-full text-blue-950" fill="currentColor">
        <circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="2.5" />
        <polygon points="18,6 22,14 30,18 22,22 18,30 14,22 6,18 14,14" fill="#1d4ed8" />
        <circle cx="18" cy="18" r="4" fill="#eab308" />
      </svg>
    </div>
  )
}

function LogoSOP() {
  return (
    <div className="w-8 h-8 rounded-full border border-emerald-800/40 bg-emerald-50/80 flex items-center justify-center p-0.5 shrink-0 shadow-2xs">
      <svg viewBox="0 0 36 36" className="w-full h-full text-emerald-800" fill="none" stroke="currentColor">
        <path d="M18 4 L30 12 L30 24 L18 32 L6 24 L6 12 Z" strokeWidth="2" fill="#ecfdf5" />
        <path d="M12 18 C12 22 24 22 24 18 C24 14 12 14 12 18" strokeWidth="2" strokeLinecap="round" />
        <line x1="18" y1="12" x2="18" y2="24" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  )
}

function LogoGPSA() {
  return (
    <div className="w-8 h-8 rounded-full border border-emerald-700/40 bg-emerald-50 flex items-center justify-center p-0.5 shrink-0 shadow-2xs">
      <svg viewBox="0 0 36 36" className="w-full h-full" fill="currentColor">
        <path d="M18 3 L32 8 V18 C32 26 26 32 18 34 C10 32 4 26 4 18 V8 L18 3 Z" fill="#047857" />
        <text x="18" y="22" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold" fontFamily="sans-serif">Rx</text>
      </svg>
    </div>
  )
}

function LogoPSGH() {
  return (
    <div className="w-8 h-8 rounded-full border border-blue-900/40 bg-blue-50 flex items-center justify-center p-0.5 shrink-0 shadow-2xs">
      <svg viewBox="0 0 36 36" className="w-full h-full text-blue-900" fill="none" stroke="currentColor">
        <circle cx="18" cy="18" r="15" strokeWidth="2" fill="#eff6ff" />
        <circle cx="18" cy="18" r="10" strokeWidth="1.5" strokeDasharray="2 2" />
        <path d="M14 18 h8 M18 14 v8" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    </div>
  )
}

function LogoPC() {
  return (
    <div className="w-8 h-8 rounded-full border border-cyan-800/40 bg-cyan-50 flex items-center justify-center p-0.5 shrink-0 shadow-2xs">
      <svg viewBox="0 0 36 36" className="w-full h-full" fill="none">
        <circle cx="18" cy="18" r="15" stroke="#0891b2" strokeWidth="2" fill="#ecfeff" />
        <path d="M12 24 C12 16 24 16 24 24" stroke="#e11d48" strokeWidth="2" strokeLinecap="round" />
        <path d="M18 10 v10" stroke="#0891b2" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  )
}

function LogoKBTH() {
  return (
    <div className="w-8 h-8 rounded-full border border-teal-800/40 bg-teal-50 flex items-center justify-center p-0.5 shrink-0 shadow-2xs">
      <svg viewBox="0 0 36 36" className="w-full h-full">
        <circle cx="18" cy="18" r="15" fill="#f0fdf4" stroke="#0d9488" strokeWidth="2" />
        <path d="M18 10 v16 M10 18 h16" stroke="#059669" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </div>
  )
}

function LogoMedochemie() {
  return (
    <div className="h-7 px-2 rounded bg-emerald-800 text-white flex items-center justify-center font-bold text-[10px] tracking-tight shrink-0 border border-emerald-900 shadow-2xs">
      <span className="text-emerald-300 mr-0.5">m</span>tc
    </div>
  )
}

function LogoErnest() {
  return (
    <div className="w-8 h-8 rounded-full border border-red-600/40 bg-red-50 flex items-center justify-center p-0.5 shrink-0 shadow-2xs">
      <svg viewBox="0 0 36 36" className="w-full h-full">
        <circle cx="18" cy="18" r="15" fill="#fef2f2" stroke="#dc2626" strokeWidth="1.5" />
        <path d="M18 8 L21 15 L28 18 L21 21 L18 28 L15 21 L8 18 L15 15 Z" fill="#dc2626" />
      </svg>
    </div>
  )
}

function LogoGSK() {
  return (
    <div className="w-8 h-7 rounded-lg bg-[#ff6000] text-white flex items-center justify-center font-bold text-[11px] tracking-tight shrink-0 shadow-2xs">
      gsk
    </div>
  )
}

function LogoOthers() {
  return (
    <div className="w-8 h-8 rounded-full bg-blue-100/80 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs">
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
        <circle cx="6" cy="12" r="2" />
        <circle cx="12" cy="12" r="2" />
        <circle cx="18" cy="12" r="2" />
      </svg>
    </div>
  )
}

function HistoryAndPartnersGrid({
  timeline,
  partners: _partners,
  navigate,
}: {
  timeline: AboutContent['timeline']
  partners?: AboutContent['partners']
  navigate: ReturnType<typeof useNavigate>
}) {
  const partnerList = [
    { name: 'UDS', component: <LogoUDS /> },
    { name: 'School of Pharmacy', component: <LogoSOP /> },
    { name: 'National GPSA', component: <LogoGPSA /> },
    { name: 'Pharmaceutical Society of Ghana', component: <LogoPSGH /> },
    { name: 'Pharmacy Council', component: <LogoPC /> },
    { name: 'Korle Bu Teaching Hospital', component: <LogoKBTH /> },
    { name: 'Medochemie Ghana Ltd.', component: <LogoMedochemie /> },
    { name: 'Ernest Chemists Foundation', component: <LogoErnest /> },
    { name: 'GSK Ghana', component: <LogoGSK /> },
    { name: 'Others', component: <LogoOthers /> },
  ]

  return (
    <section className="py-12 lg:py-16 bg-slate-100/70 border-t border-slate-200/80">
      <div className="section-container grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">

        {/* Left Column: Our Story with Connected Timeline & Capsule Image (matching overview.png) */}
        <div className="bg-white rounded-2xl p-7 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-amber-700 mb-1.5">OUR STORY</p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 mb-2.5">
              A Legacy of Growth and Impact
            </h2>

            <p className="text-slate-600 text-xs sm:text-sm mb-4 leading-relaxed max-w-sm">
              Founded by passionate pharmacy students, GPSA-UDS has grown into a strong pillar of student life at UDS.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 my-2">
              {/* Connected Vertical Timeline matching overview.png */}
              <div className="relative pl-2 my-2 self-start sm:self-center">
                {/* Connecting vertical line */}
                <div className="absolute left-[15px] top-2.5 bottom-2.5 w-[2px] bg-emerald-800/80" />

                <ul className="space-y-3.5 relative z-10">
                  {timeline.map((item) => (
                    <li key={item.year} className="flex items-center gap-3">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#004D00] border-2 border-white ring-1 ring-emerald-800/50 shrink-0" />
                      <span className="font-bold text-slate-900 min-w-[36px] text-xs font-mono">{item.year}</span>
                      <span className="text-slate-700 text-xs font-medium">{item.title}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Large Capsule Outdoor Photo with Green Outline Ring matching overview.png */}
              <div className="relative shrink-0 my-auto">
                <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-[36px] sm:rounded-[44px] p-1.5 bg-emerald-500/20 border-2 border-emerald-600/50 shadow-md overflow-hidden transition-transform duration-500 hover:scale-105">
                  <img
                    src={outdoorStudentsImg}
                    alt="GPSA UDS Pharmacy Students"
                    className="w-full h-full object-cover rounded-[30px] sm:rounded-[38px]"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-slate-100 flex justify-center">
            <button
              onClick={() => navigate('/leadership')}
              className="px-6 py-2 rounded-lg border border-slate-300 hover:border-emerald-700 text-slate-800 font-semibold text-xs transition-all flex items-center justify-center gap-2 hover:bg-slate-50 shadow-2xs"
            >
              <span>Explore Leadership & Legacy</span>
            </button>
          </div>
        </div>

        {/* Right Column: Our Partners matching overview.png */}
        <div className="bg-white rounded-2xl p-7 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-amber-700 mb-4">OUR PARTNERS</p>

            {/* 5-Column x 2-Row Brand Partner Grid matching overview.png */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-y-7 gap-x-3 items-center py-4 my-2">
              {partnerList.map((partner) => (
                <div key={partner.name} className="flex items-center gap-2">
                  {partner.component}
                  <span className="text-[11px] font-medium text-slate-800 leading-tight">
                    {partner.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-slate-100 flex justify-center">
            <button
              onClick={() => navigate('/about')}
              className="px-6 py-2 rounded-lg border border-slate-300 hover:border-emerald-700 text-slate-800 font-semibold text-xs transition-all flex items-center justify-center gap-2 hover:bg-slate-50 shadow-2xs"
            >
              <span>View All Partners</span>
            </button>
          </div>
        </div>

      </div>
    </section>
  )
}

// ── 9. Final Call to Action Banner ───────────────────────────────────────────

function FinalCallToActionBanner({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  return (
    <div className="section-container py-8">
      <section className="bg-gradient-to-r from-[#003816] via-[#004D00] to-[#003012] text-white p-3 sm:p-4 pr-6 sm:pr-8 rounded-2xl sm:rounded-3xl shadow-xl border border-[#003816] overflow-hidden">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-5 lg:gap-8">

          {/* Left Thumbnail Photo matching overview.png */}
          <div className="w-full lg:w-48 h-32 lg:h-24 rounded-xl sm:rounded-2xl overflow-hidden shrink-0 shadow-md">
            <img
              src={ctaStudentsImg}
              alt="GPSA Students Celebrating"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Middle Heading & Text matching overview.png */}
          <div className="text-center lg:text-left space-y-1.5 flex-1 max-w-xl">
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Your voice belongs here.
            </h2>
            <p className="text-white/85 text-xs sm:text-sm leading-relaxed">
              Join GPSA-UDS, participate in our programmes, access resources and let us support you on your pharmacy journey.
            </p>
          </div>

          {/* Right Action Buttons matching overview.png */}
          <div className="flex flex-wrap items-center justify-center lg:justify-end gap-3 shrink-0 w-full lg:w-auto">
            <button
              onClick={() => navigate('/register')}
              className="px-5 py-2.5 rounded-lg sm:rounded-xl bg-[#d99b26] hover:bg-[#c4891e] text-white font-bold text-xs shadow-md transition-all transform active:scale-95"
            >
              Join GPSA-UDS
            </button>
            <button
              onClick={() => navigate('/welfare')}
              className="px-5 py-2.5 rounded-lg sm:rounded-xl border border-white/50 hover:border-white hover:bg-white/10 text-white font-semibold text-xs transition-all"
            >
              Welfare Support
            </button>
            <button
              onClick={() => navigate('/contact')}
              className="px-5 py-2.5 rounded-lg sm:rounded-xl border border-white/50 hover:border-white hover:bg-white/10 text-white font-semibold text-xs transition-all"
            >
              Contact Us
            </button>
          </div>

        </div>
      </section>
    </div>
  )
}
