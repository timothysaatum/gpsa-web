import { FormEvent, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowRight, Briefcase, Heart, Mail, Phone, Plus, Scale,
  ShieldCheck, UserRound, Users, GraduationCap,
  Megaphone, Sprout, FileText
} from 'lucide-react'
import { cmsApi, leadershipApi } from '@/api/services'
import { Badge, Button, EmptyState } from '@/components/ui'
import { cn } from '@/utils'
import type { Leader, LeadershipTerm } from '@/types'

import udsGateHeroRight from '@/assets/uds_gate_hero_right.png'

export const leadershipPageDefaults = {
  hero_eyebrow: 'LEADERSHIP & GOVERNANCE',
  hero_title_primary: 'Led by Students.',
  hero_title_secondary: 'Governed for All.',
  hero_description: 'GPSA-UDS is democratically governed by students, for students. Our leadership structures ensure accountability, transparency, fair representation and meaningful participation of every member.',
  hero_quote: "Good leadership isn't about position. It's about purpose, service and impact.",
  hero_quote_citation: 'Once Pharmily, Always Pharmily.',
  cta_title: 'Your voice. Your association.',
  cta_description: 'Get involved, contribute and help us build a stronger pharmacy future together.',
}

// Governance Bodies (5 Cards)
const governanceBodies = [
  {
    title: 'General Assembly',
    description: 'The supreme decision-making body composed of all registered members. Sets policies and approves major decisions.',
    icon: Users,
  },
  {
    title: 'Executive Board',
    description: 'Responsible for the day-to-day leadership and administration of the association and implementation of decisions of the General Assembly.',
    icon: UserRound,
  },
  {
    title: 'Standing Committees',
    description: 'Specialised committees that support the Executive Board in executing mandates across key functional areas.',
    icon: Users,
  },
  {
    title: 'Judicial Board',
    description: 'Upholds the constitution, interprets rules and handles disciplinary or constitutional matters fairly and impartially.',
    icon: Scale,
  },
  {
    title: 'Electoral Commission',
    description: 'Independent body responsible for conducting free, fair and transparent elections in accordance with the association\'s constitution.',
    icon: Briefcase,
  },
]

// Standing Committees (6 Cards)
const standingCommittees = [
  {
    title: 'Academics',
    description: 'Supports academic excellence, tutorials, research and educational programmes.',
    icon: GraduationCap,
    href: '/academics',
  },
  {
    title: 'Welfare',
    description: 'Oversees student welfare, support systems and advocacy for member well-being.',
    icon: Heart,
    href: '/welfare',
  },
  {
    title: 'Professional Development',
    description: 'Drives professional exposure, career development and industry engagement.',
    icon: Briefcase,
    href: '/opportunities',
  },
  {
    title: 'Public Relations & Communications',
    description: 'Handles media, publicity, communications and information dissemination.',
    icon: Megaphone,
    href: '/news',
  },
  {
    title: 'Sports & Social',
    description: 'Promotes sporting activities, games and social events among members.',
    icon: Users,
    href: '/events',
  },
  {
    title: 'Health Outreach & Community Service',
    description: 'Leads health outreach programmes and community engagement initiatives.',
    icon: Sprout,
    href: '/events',
  },
]

type TermForm = {
  title: string
  academic_year: string
  start_date: string
  end_date: string
  theme: string
  summary: string
  is_current: boolean
}

type LeaderForm = {
  term_id: string
  full_name: string
  office: string
  bio: string
  email: string
  phone: string
  sort_order: number
}

// ── Leadership & Governance Main Page Component ───────────────────────────────

export function LeadershipPage() {
  const navigate = useNavigate()

  const { data: currentTerm, isLoading, isError, refetch } = useQuery({
    queryKey: ['leadership', 'current'],
    queryFn: leadershipApi.current,
    staleTime: 5 * 60 * 1000,
  })
  const { data: cmsContent } = useQuery({
    queryKey: ['cms-public', 'leadership'],
    queryFn: () => cmsApi.getPublicPage<typeof leadershipPageDefaults>('leadership'),
    retry: false,
  })
  const pageContent = { ...leadershipPageDefaults, ...cmsContent }

  if (isLoading) return <div className="section-container py-20"><p className="text-center text-slate-500">Loading leadership…</p></div>
  if (isError) return <div className="section-container py-20 text-center"><p className="text-slate-700">Leadership information is temporarily unavailable.</p><Button className="mt-4" onClick={() => void refetch()}>Try again</Button></div>
  if (!currentTerm) return <div className="section-container py-20"><EmptyState title="Leadership information is being prepared" description="Please check back soon." /></div>
  const leaders = currentTerm.leaders ?? []

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-800 font-body py-6 space-y-6 sm:space-y-8">
      {/* 1. Hero Section */}
      <LeadershipHero navigate={navigate} content={pageContent} />

      {/* 2. Governance Structure (At a Glance) */}
      <GovernanceStructureSection />

      {/* 3. Meet the Executive Team */}
      <ExecutiveTeamSection term={currentTerm} leaders={leaders} navigate={navigate} />

      {/* 4. Standing Committees */}
      <StandingCommitteesSection navigate={navigate} />

      {/* 5. Governance & Accountability */}
      <GovernanceAccountabilitySection />

      {/* 6. Final Call to Action ("Your voice. Your association.") */}
      <LeadershipCtaSection navigate={navigate} content={pageContent} />

    </div>
  )
}

// Backward compatibility alias
export const AboutLeadershipPage = LeadershipPage

// ── 1. Hero Section ────────────────────────────────────────────────────────────

function LeadershipHero({ navigate, content }: { navigate: (path: string) => void; content: typeof leadershipPageDefaults }) {
  return (
    <div className="section-container">
      <section className="relative py-14 sm:py-18 lg:py-20 bg-[#002D00] text-white overflow-hidden rounded-2xl sm:rounded-3xl shadow-lg border border-[#002000]">
        {/* Background Gate image on right half */}
        <div className="absolute right-0 top-0 bottom-0 w-full sm:w-[52%] lg:w-[48%] h-full z-0 overflow-hidden">
          <img
            src={udsGateHeroRight}
            alt="UDS Campus Gate"
            className="w-full h-full object-cover object-left-top"
          />
          <div className="absolute inset-y-0 left-0 w-36 bg-gradient-to-r from-[#002D00] via-[#002D00]/70 to-transparent" />
        </div>

        <div className="relative z-10 px-6 sm:px-10 lg:px-12 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8 items-center">
          {/* Left Text */}
          <div className="max-w-xl text-left">
            <p className="text-[#d99b26] font-bold uppercase tracking-[0.18em] text-xs sm:text-sm mb-3">
              {content.hero_eyebrow}
            </p>

            <h1 className="font-body text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-4 leading-[1.12]">
              {content.hero_title_primary}<br />
              {content.hero_title_secondary}
            </h1>

            <p className="text-white/90 text-sm sm:text-base leading-relaxed mb-6 max-w-lg">
              {content.hero_description}
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => document.getElementById('executive-team')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-6 py-3 rounded-xl bg-[#d99b26] hover:bg-[#c4891e] text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
              >
                <span>Meet the Executive Team</span>
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => navigate('/about/faqs')}
                className="px-6 py-3 rounded-xl border border-white/50 hover:border-white hover:bg-white/10 text-white font-semibold text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Our Governance Documents</span>
                <FileText className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Right Quote Box matching leadership.png */}
          <div className="hidden lg:block">
            <div className="bg-[#002200]/80 backdrop-blur-md rounded-2xl p-6 border border-white/15 text-white shadow-xl max-w-md ml-auto">
              <span className="text-amber-400 font-serif text-4xl leading-none block mb-2">“</span>
              <p className="font-display font-semibold text-lg text-white leading-snug mb-4">
                {content.hero_quote}
              </p>
              <p className="text-amber-400 text-xs font-bold uppercase tracking-widest">
                {content.hero_quote_citation}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

// ── 2. Governance Structure (At a Glance) ──────────────────────────────────────

function GovernanceStructureSection() {
  return (
    <div className="section-container">
      <section className="py-12 sm:py-16 bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs px-6 sm:px-10 lg:px-12">
        {/* Section Header */}
        <div className="text-center max-w-xl mx-auto mb-10">
          <p className="text-xs sm:text-sm font-bold uppercase tracking-widest text-[#004D00] mb-2">
            GOVERNANCE STRUCTURE (AT A GLANCE)
          </p>
          <div className="w-12 h-0.5 bg-amber-500 rounded-full mx-auto" />
        </div>

        {/* 5 Cards Grid matching leadership.png */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {governanceBodies.map((body) => {
            const Icon = body.icon
            return (
              <div
                key={body.title}
                className="bg-slate-50/70 hover:bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-[#004D00]/40 transition-all text-center flex flex-col items-center justify-start group"
              >
                <div className="w-12 h-12 rounded-full bg-[#004D00] text-amber-400 flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-display font-bold text-slate-900 text-base mb-2 leading-tight group-hover:text-[#004D00] transition-colors">
                  {body.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {body.description}
                </p>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}

// ── 3. Meet the Executive Team Section ─────────────────────────────────────────

function ExecutiveTeamSection({
  term,
  leaders,
  navigate,
}: {
  term: LeadershipTerm
  leaders: Leader[]
  navigate: (path: string) => void
}) {
  // Separate President and Vice President from remaining executives
  const president = useMemo(() => {
    return leaders.find(l => l.office.toLowerCase().includes('president') && !l.office.toLowerCase().includes('vice')) || leaders[0]
  }, [leaders])

  const vicePresident = useMemo(() => {
    return leaders.find(l => l.office.toLowerCase().includes('vice')) || leaders[1]
  }, [leaders])

  const remainingExecs = useMemo(() => {
    return leaders.filter(l => l.id !== president?.id && l.id !== vicePresident?.id)
  }, [leaders, president, vicePresident])

  return (
    <div id="executive-team" className="section-container">
      <section className="py-12 sm:py-16 bg-[#002D00]/5 rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-sm px-6 sm:px-10 lg:px-12 relative overflow-hidden">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-10 border-b border-slate-200/80 pb-6">
          <div className="text-center sm:text-left mx-auto sm:mx-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#004D00]/10 text-[#004D00] text-xs font-extrabold uppercase tracking-widest mb-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              EXECUTIVE COUNCIL • {term.academic_year || '2025/2026'}
            </span>
            <h2 className="font-display font-extrabold text-2xl sm:text-3xl lg:text-4xl text-slate-900 leading-tight">
              MEET THE EXECUTIVE TEAM – {term.academic_year || '2025/2026'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-xl">
              Student leaders dedicated to accountability, academic excellence, and member representation across all levels.
            </p>
          </div>

          <button
            onClick={() => navigate('/about/leadership')}
            className="px-5 py-2.5 rounded-xl border border-[#004D00]/30 hover:border-[#004D00] text-[#004D00] font-bold text-xs transition-all flex items-center gap-2 bg-white hover:bg-[#004D00] hover:text-white shadow-2xs cursor-pointer shrink-0"
          >
            <span>View All Executives</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {/* ── TOP TIER: Featured President & Vice President ────────────────── */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <div className="h-0.5 w-6 bg-amber-500 rounded-full" />
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#004D00]">
              TOP EXECUTIVE OFFICERS (FEATURED LEADERSHIP)
            </h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* President Card */}
            {president && (
              <div className="bg-gradient-to-br from-white via-amber-500/5 to-emerald-950/5 rounded-3xl p-6 sm:p-7 border-2 border-amber-500/40 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col sm:flex-row gap-6 items-center group relative">
                {/* Image */}
                <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-2xl overflow-hidden bg-slate-100 shrink-0 border-2 border-amber-500/50 shadow-sm relative">
                  {president.photo_url ? (
                    <img
                      src={president.photo_url}
                      alt={president.full_name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-200">
                      <UserRound className="h-14 w-14 text-slate-400" />
                    </div>
                  )}
                  <span className="absolute bottom-2 left-2 right-2 px-2 py-0.5 rounded-md bg-[#003800] text-amber-400 text-[9px] font-black uppercase text-center shadow-xs">
                    CHIEF EXECUTIVE
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 text-center sm:text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#003800] text-amber-400 font-extrabold text-[10px] uppercase tracking-wider mb-2 shadow-xs">
                    ★ PRESIDENT
                  </div>
                  <h3 className="font-display font-extrabold text-2xl text-slate-900 mb-1 group-hover:text-[#004D00] transition-colors">
                    {president.full_name}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">
                    {president.bio || 'Leads the association, chairs executive meetings, and represents pharmacy students across all university and national platforms.'}
                  </p>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-3 border-t border-slate-200/80">
                    {president.email && (
                      <a
                        href={`mailto:${president.email}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-[#004D00] hover:text-white text-slate-700 font-semibold text-xs transition-colors"
                      >
                        <Mail className="h-3.5 w-3.5" />
                        <span>Email Office</span>
                      </a>
                    )}
                    {president.phone && (
                      <a
                        href={`tel:${president.phone}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-[#004D00] hover:text-white text-slate-700 font-semibold text-xs transition-colors"
                      >
                        <Phone className="h-3.5 w-3.5" />
                        <span>Call</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Vice President Card */}
            {vicePresident && (
              <div className="bg-gradient-to-br from-white via-amber-500/5 to-emerald-950/5 rounded-3xl p-6 sm:p-7 border-2 border-amber-500/40 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col sm:flex-row gap-6 items-center group relative">
                {/* Image */}
                <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-2xl overflow-hidden bg-slate-100 shrink-0 border-2 border-amber-500/50 shadow-sm relative">
                  {vicePresident.photo_url ? (
                    <img
                      src={vicePresident.photo_url}
                      alt={vicePresident.full_name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-200">
                      <UserRound className="h-14 w-14 text-slate-400" />
                    </div>
                  )}
                  <span className="absolute bottom-2 left-2 right-2 px-2 py-0.5 rounded-md bg-[#d99b26] text-white text-[9px] font-black uppercase text-center shadow-xs">
                    DEPUTY EXECUTIVE
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 text-center sm:text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#d99b26] text-white font-extrabold text-[10px] uppercase tracking-wider mb-2 shadow-xs">
                    ★ VICE PRESIDENT
                  </div>
                  <h3 className="font-display font-extrabold text-2xl text-slate-900 mb-1 group-hover:text-[#d99b26] transition-colors">
                    {vicePresident.full_name}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">
                    {vicePresident.bio || 'Assists the President, coordinates standing committees, and oversees the execution of executive policies.'}
                  </p>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-3 border-t border-slate-200/80">
                    {vicePresident.email && (
                      <a
                        href={`mailto:${vicePresident.email}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-[#d99b26] hover:text-white text-slate-700 font-semibold text-xs transition-colors"
                      >
                        <Mail className="h-3.5 w-3.5" />
                        <span>Email Office</span>
                      </a>
                    )}
                    {vicePresident.phone && (
                      <a
                        href={`tel:${vicePresident.phone}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-[#d99b26] hover:text-white text-slate-700 font-semibold text-xs transition-colors"
                      >
                        <Phone className="h-3.5 w-3.5" />
                        <span>Call</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── BOTTOM TIER: Executive Officers (General Secretary, Financial Sec, Org Sec, PRO) ── */}
        <div>
          <div className="flex items-center gap-2 mb-6">
            <div className="h-0.5 w-6 bg-slate-400 rounded-full" />
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-700">
              PORTFOLIO EXECUTIVES & SECRETARIES
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {remainingExecs.map((leader) => (
              <div
                key={leader.id}
                className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs hover:shadow-lg hover:border-[#004D00]/40 transition-all duration-300 flex flex-col justify-between group text-center"
              >
                <div>
                  {/* Office Pill Badge */}
                  <div className="mb-3 flex justify-center">
                    <span
                      className={cn(
                        'px-3 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider text-white shadow-2xs',
                        leader.office.toLowerCase().includes('financial') || leader.office.toLowerCase().includes('public')
                          ? 'bg-[#d99b26]'
                          : 'bg-[#003800]'
                      )}
                    >
                      {leader.office}
                    </span>
                  </div>

                  {/* Officer Portrait */}
                  <div className="w-28 h-28 mx-auto rounded-2xl overflow-hidden bg-slate-100 mb-4 border border-slate-200/80 shadow-2xs">
                    {leader.photo_url ? (
                      <img
                        src={leader.photo_url}
                        alt={leader.full_name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                        <UserRound className="h-10 w-10 text-slate-400" />
                      </div>
                    )}
                  </div>

                  {/* Name & Portfolio Bio */}
                  <h3 className="font-display font-bold text-slate-900 text-base mb-1.5 group-hover:text-[#004D00] transition-colors">
                    {leader.full_name}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 mb-4">
                    {leader.bio || 'Executive officer serving GPSA-UDS.'}
                  </p>
                </div>

                {/* Contact Footer */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-center gap-3 text-slate-500">
                  {leader.email && (
                    <a href={`mailto:${leader.email}`} title={leader.email} className="hover:text-[#004D00] transition-colors p-1 bg-slate-50 hover:bg-emerald-50 rounded-md">
                      <Mail className="h-4 w-4" />
                    </a>
                  )}
                  <a href="#" title="LinkedIn Profile" className="hover:text-[#004D00] transition-colors p-1 bg-slate-50 hover:bg-emerald-50 rounded-md">
                    <span className="font-bold text-[11px]">in</span>
                  </a>
                  {leader.phone && (
                    <a href={`tel:${leader.phone}`} title={leader.phone} className="hover:text-[#004D00] transition-colors p-1 bg-slate-50 hover:bg-emerald-50 rounded-md">
                      <Phone className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

// ── 4. Standing Committees Section ─────────────────────────────────────────────

function StandingCommitteesSection({ navigate }: { navigate: (path: string) => void }) {
  return (
    <div className="section-container">
      <section className="py-12 sm:py-16 bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs px-6 sm:px-10 lg:px-12">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-10">
          <div className="text-center sm:text-left mx-auto sm:mx-0">
            <p className="text-xs sm:text-sm font-bold uppercase tracking-widest text-[#004D00] mb-2">
              STANDING COMMITTEES
            </p>
            <div className="w-12 h-0.5 bg-amber-500 rounded-full mx-auto sm:mx-0" />
          </div>

          <button
            onClick={() => navigate('/about/faqs')}
            className="px-5 py-2 rounded-xl border border-slate-300 hover:border-[#004D00] text-slate-800 font-semibold text-xs transition-all flex items-center gap-2 bg-white hover:bg-slate-50 shadow-2xs cursor-pointer shrink-0"
          >
            <span>View All Committees</span>
            <ArrowRight className="h-3.5 w-3.5 text-[#004D00]" />
          </button>
        </div>

        {/* 6 Committee Cards Grid matching leadership.png */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          {standingCommittees.map((c) => {
            const Icon = c.icon
            return (
              <div
                key={c.title}
                className="bg-slate-50/70 hover:bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-[#004D00]/40 transition-all flex flex-col justify-between group text-center"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-[#004D00] text-amber-400 flex items-center justify-center mx-auto mb-3 shadow-xs group-hover:scale-110 transition-transform">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-display font-bold text-slate-900 text-sm mb-2 leading-tight group-hover:text-[#004D00] transition-colors">
                    {c.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">
                    {c.description}
                  </p>
                </div>

                <button
                  onClick={() => navigate(c.href)}
                  className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-[#004D00] hover:text-emerald-700 transition-colors pt-2 border-t border-slate-200/60 cursor-pointer"
                >
                  <span>View Committee</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}

// ── 5. Governance & Accountability Banner ─────────────────────────────────────

function GovernanceAccountabilitySection() {
  return (
    <div className="section-container">
      <section className="bg-gradient-to-r from-[#003816] via-[#004D00] to-[#002D00] text-white rounded-2xl sm:rounded-3xl p-6 sm:p-10 border border-[#002000] shadow-xl overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-8 lg:gap-12 items-center">
          {/* Left Shield + Text */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-400/40 text-amber-400 flex items-center justify-center shrink-0 shadow-sm">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mb-2">
                Governance & Accountability
              </h2>
              <p className="text-white/85 text-xs sm:text-sm leading-relaxed max-w-lg">
                We are committed to transparency, accountability and ethical leadership. Our constitution, policies and procedures guide every decision we make.
              </p>
            </div>
          </div>

          {/* Right 3 Items matching leadership.png */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t lg:border-t-0 sm:border-l border-white/15 pt-6 lg:pt-0 sm:pl-6 text-left">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                <FileText className="h-4 w-4" />
                <span>Constitution</span>
              </div>
              <p className="text-[11px] text-white/75 leading-tight">
                Guiding our structure and operations.
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                <Users className="h-4 w-4" />
                <span>Policies</span>
              </div>
              <p className="text-[11px] text-white/75 leading-tight">
                Ensuring fairness and consistency.
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                <ShieldCheck className="h-4 w-4" />
                <span>Transparency</span>
              </div>
              <p className="text-[11px] text-white/75 leading-tight">
                Accountable to every member.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

// ── 6. Final Call to Action Section ───────────────────────────────────────────

function LeadershipCtaSection({ navigate, content }: { navigate: (path: string) => void; content: typeof leadershipPageDefaults }) {
  return (
    <div className="section-container">
      <section className="bg-amber-500/10 rounded-2xl sm:rounded-3xl border border-amber-500/25 p-6 sm:p-8 text-slate-900 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Left Icon + Copy */}
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-12 h-12 rounded-full bg-[#004D00] text-amber-400 flex items-center justify-center shrink-0 shadow-sm">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
                {content.cta_title}
              </h2>
              <p className="text-slate-600 text-xs sm:text-sm mt-0.5">
                {content.cta_description}
              </p>
            </div>
          </div>

          {/* Right Action Buttons matching leadership.png */}
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 shrink-0 w-full sm:w-auto">
            <button
              onClick={() => navigate('/register')}
              className="px-6 py-3 rounded-xl bg-[#004D00] hover:bg-[#003800] text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer"
            >
              Join GPSA-UDS
            </button>
            <button
              onClick={() => navigate('/opportunities')}
              className="px-6 py-3 rounded-xl border border-slate-300 hover:border-[#004D00] text-slate-800 font-semibold text-xs sm:text-sm transition-all hover:bg-slate-50 cursor-pointer"
            >
              Get Involved
            </button>
            <button
              onClick={() => navigate('/contact')}
              className="px-6 py-3 rounded-xl border border-slate-300 hover:border-[#004D00] text-slate-800 font-semibold text-xs sm:text-sm transition-all hover:bg-slate-50 cursor-pointer"
            >
              Contact Us
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

// ── 7. Admin Leadership Manager ────────────────────────────────────────────────

// Retained as an exported compatibility component for older admin routes.
// New management workflows live exclusively under /admin/leadership.
export function LeadershipManager({ terms }: { terms: LeadershipTerm[] }) {
  const qc = useQueryClient()
  const [termForm, setTermForm] = useState<TermForm>({
    title: '',
    academic_year: '',
    start_date: '',
    end_date: '',
    theme: '',
    summary: '',
    is_current: false,
  })
  const [leaderForm, setLeaderForm] = useState<LeaderForm>({
    term_id: terms[0]?.id ?? '',
    full_name: '',
    office: '',
    bio: '',
    email: '',
    phone: '',
    sort_order: 0,
  })

  const refresh = () => qc.invalidateQueries({ queryKey: ['leadership'] })

  const createTerm = useMutation({
    mutationFn: () => leadershipApi.createTerm({
      ...termForm,
      start_date: termForm.start_date || null,
      end_date: termForm.end_date || null,
      theme: termForm.theme || null,
      summary: termForm.summary || null,
    }),
    onSuccess: () => {
      setTermForm({ title: '', academic_year: '', start_date: '', end_date: '', theme: '', summary: '', is_current: false })
      refresh()
    },
  })

  const createLeader = useMutation({
    mutationFn: () => leadershipApi.createLeader({
      ...leaderForm,
      bio: leaderForm.bio || null,
      email: leaderForm.email || null,
      phone: leaderForm.phone || null,
    }),
    onSuccess: () => {
      setLeaderForm((form) => ({ ...form, full_name: '', office: '', bio: '', email: '', phone: '', sort_order: form.sort_order + 1 }))
      refresh()
    },
  })

  const submitTerm = (event: FormEvent) => {
    event.preventDefault()
    createTerm.mutate()
  }

  const submitLeader = (event: FormEvent) => {
    event.preventDefault()
    createLeader.mutate()
  }

  return (
    <div className="section-container">
      <section className="py-12 bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-10 shadow-xs">
        <div className="mb-8">
          <Badge variant="purple" className="mb-3">Executive Administration Tools</Badge>
          <h2 className="section-title">Manage Leadership Records</h2>
          <p className="section-sub">Add administrations, assign executive officers, and manage officer contact visibility.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <form onSubmit={submitTerm} className="rounded-xl border border-slate-200 bg-slate-50/70 p-5 space-y-4">
            <h3 className="font-display text-2xl font-bold text-slate-900">Add Administration Term</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Title" value={termForm.title} onChange={(val) => setTermForm((f) => ({ ...f, title: val }))} required placeholder="2025/2026 Executive Council" />
              <Field label="Academic Year" value={termForm.academic_year} onChange={(val) => setTermForm((f) => ({ ...f, academic_year: val }))} required placeholder="2025/2026" />
              <Field label="Start Date" type="date" value={termForm.start_date} onChange={(val) => setTermForm((f) => ({ ...f, start_date: val }))} />
              <Field label="End Date" type="date" value={termForm.end_date} onChange={(val) => setTermForm((f) => ({ ...f, end_date: val }))} />
              <div className="sm:col-span-2">
                <Field label="Theme" value={termForm.theme} onChange={(val) => setTermForm((f) => ({ ...f, theme: val }))} placeholder="Led by Students. Governed for All." />
              </div>
              <label className="sm:col-span-2">
                <span className="form-label">Summary</span>
                <textarea className="form-input min-h-[90px]" value={termForm.summary} onChange={(e) => setTermForm((f) => ({ ...f, summary: e.target.value }))} />
              </label>
              <label className="sm:col-span-2 flex items-center gap-3 text-sm font-semibold text-slate-800">
                <input type="checkbox" checked={termForm.is_current} onChange={(e) => setTermForm((f) => ({ ...f, is_current: e.target.checked }))} />
                Set as Current Administration
              </label>
            </div>
            <Button type="submit" variant="primary" loading={createTerm.isPending} leftIcon={<Plus className="h-4 w-4" />}>
              Save Term
            </Button>
          </form>

          <form onSubmit={submitLeader} className="rounded-xl border border-slate-200 bg-slate-50/70 p-5 space-y-4">
            <h3 className="font-display text-2xl font-bold text-slate-900">Add Executive Officer</h3>
            {!terms.length ? (
              <EmptyState title="Create an administration first" description="Officers belong to an administration term." />
            ) : (
              <>
                <label className="block mb-3">
                  <span className="form-label">Administration</span>
                  <select className="form-select" value={leaderForm.term_id || terms[0]?.id} onChange={(e) => setLeaderForm((f) => ({ ...f, term_id: e.target.value }))}>
                    {terms.map((term) => <option key={term.id} value={term.id}>{term.academic_year} - {term.title}</option>)}
                  </select>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Full Name" value={leaderForm.full_name} onChange={(val) => setLeaderForm((f) => ({ ...f, full_name: val }))} required placeholder="Jacob N. Adjei" />
                  <Field label="Office / Position" value={leaderForm.office} onChange={(val) => setLeaderForm((f) => ({ ...f, office: val }))} required placeholder="President" />
                  <Field label="Email" type="email" value={leaderForm.email} onChange={(val) => setLeaderForm((f) => ({ ...f, email: val }))} placeholder="president@gpsauds.org" />
                  <Field label="Phone" value={leaderForm.phone} onChange={(val) => setLeaderForm((f) => ({ ...f, phone: val }))} placeholder="+233 24 123 4567" />
                  <Field label="Sort Order" type="number" value={String(leaderForm.sort_order)} onChange={(val) => setLeaderForm((f) => ({ ...f, sort_order: Number(val) }))} />
                  <label className="sm:col-span-2">
                    <span className="form-label">Portfolio Description</span>
                    <textarea className="form-input min-h-[90px]" value={leaderForm.bio} onChange={(e) => setLeaderForm((f) => ({ ...f, bio: e.target.value }))} />
                  </label>
                </div>
                <Button type="submit" variant="primary" loading={createLeader.isPending} leftIcon={<Plus className="h-4 w-4" />}>
                  Save Officer
                </Button>
              </>
            )}
          </form>
        </div>
      </section>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
  placeholder,
}: {
  label: string
  value: string
  onChange: (val: string) => void
  type?: string
  required?: boolean
  placeholder?: string
}) {
  return (
    <label className="block">
      <span className="form-label">{label}</span>
      <input className="form-input" type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} placeholder={placeholder} />
    </label>
  )
}
