/**
 *
 * ── Backend integration checklist ──────────────────────────────────────────
 * 1. EXECUTIVES:  Replace the EXECUTIVES array with a useQuery() call to
 *                 your executives/committee API endpoint.
 *                 Each exec needs: name, role, photo_url, level (optional).
 *
 * 2. STATS:       Wire the STATS array values to real aggregated API data
 *                 (e.g. total members, resources count, events count).
 *
 * 3. SOCIAL LINKS: Replace '#' hrefs in the ContactSection with real URLs.
 *
 * 4. HISTORY:     Replace TIMELINE items with CMS / API driven content.
 * ───────────────────────────────────────────────────────────────────────────
 */

import { useNavigate } from 'react-router-dom'
import {
  BookOpen, Heart, Briefcase, Users,
  Target, Eye, Award, ArrowRight, Zap,
} from 'lucide-react'
import { Button } from '@/components/ui'
import { PageHeader } from '@/components/shared'
import { cn } from '@/utils'

// ─────────────────────────────────────────────────────────────────────────────
// Static data — swap with API calls when ready
// ─────────────────────────────────────────────────────────────────────────────

const STATS = [
  { value: '5,000+', label: 'Students Represented',   icon: Users  },
  { value: '20+',    label: 'Core & Associates',       icon: BookOpen },
  { value: '50+',    label: 'Events Per Year',         icon: Award  },
  { value: '1',      label: 'United Force',            icon: Target },
]

/**
 * EXECUTIVES — replace with useQuery(() => executivesApi.list())
 * Add `photo_url` field to each object; swap the placeholder <div> for:
 *   <img src={exec.photo_url} alt={exec.name}
 *        className="w-full h-full object-cover object-top" />
 */
const EXECUTIVES = [
  { name: 'President Name',            role: 'President',           level: 600 },
  { name: 'Vice-President Name',       role: 'Vice President',      level: 500 },
  { name: 'Secretary Name',            role: 'General Secretary',   level: 400 },
  { name: 'Financial Secretary Name',  role: 'Fin. Secretary',      level: 400 },
  { name: 'Welfare Officer Name',      role: 'Welfare Officer',     level: 300 },
  { name: 'PRO Name',                  role: 'Public Relations',    level: 300 },
  { name: 'Academic Officer Name',     role: 'Academic Officer',    level: 200 },
  { name: 'Treasurer Name',            role: 'Treasurer',           level: 200 },
]

const TIMELINE = [
  { year: '2015', title: 'GPSA-UDS Founded', body: 'The Graduate Pharmacy Students Association was formally established at UDS to represent and empower pharmacy students.' },
  { year: '2018', title: 'GPSA-UDS Welfare Launched', body: 'A dedicated welfare arm was created to handle student wellbeing, mental health support, and financial aid coordination.' },
  { year: '2021', title: 'Academic Hub Introduced', body: 'A centralised digital resource library was launched, making past questions, lecture notes, and lab reports accessible to all levels.' },
  { year: '2023', title: 'MOU with Tamale Teaching Hospital', body: 'GPSA-UDS formalised a partnership with the Tamale Teaching Hospital to provide structured clinical attachment for Level 400–600 students.' },
  { year: '2025', title: 'Student Portal Goes Live', body: 'A full-featured online portal was launched — enabling event registration, resource downloads, welfare reporting, and opportunity discovery.' },
]

const PRINCIPLES = [
  {
    icon: Target,
    title: 'Our Mission',
    desc: 'Empowering every pharmacy student to thrive academically, socially, and professionally.',
    iconColor: '#fff',
    iconBg: 'rgba(255,255,255,0.15)',
    cardBg: 'linear-gradient(90deg, #A8D5BA 0%, #00B140 100%)',
    textColor: '#fff',
  },
  {
    icon: Eye,
    title: 'Our Vision',
    desc: 'Ghana\'s most impactful pharmacy students\' body, known for excellence and community service.',
    iconColor: '#fff',
    iconBg: 'rgba(255,255,255,0.15)',
    cardBg: 'linear-gradient(90deg, #A8D5BA 0%, #00B140 100%)',
    textColor: '#fff',
  },
  {
    icon: Zap,
    title: 'Our Values',
    desc: 'Integrity, accountability, student-centric, innovative, collaborative, and advocacy-driven.',
    iconColor: '#fff',
    iconBg: 'rgba(255,255,255,0.15)',
    cardBg: 'linear-gradient(90deg, #A8D5BA 0%, #00B140 100%)',
    textColor: '#fff',
  },
]

const PILLARS = [
  {
    icon: BookOpen,
    title: 'Academics',
    desc: 'Structured resources — past questions, lecture slides, lab reports, and tutorial videos — to help every student study smarter and perform better.',
    iconColor: '#3CB559',
    iconBg: 'rgba(60,181,89,0.09)',
    border: 'hover:border-green-300',
  },
  {
    icon: Heart,
    title: 'Welfare',
    desc: 'GPSA-UDS Welfare ensures every student has access to support — whether academic pressure, financial difficulty, health concerns, or personal struggles.',
    iconColor: '#e05252',
    iconBg: 'rgba(224,82,82,0.08)',
    border: 'hover:border-red-200',
  },
  {
    icon: Briefcase,
    title: 'Opportunities',
    desc: 'Internships, scholarships, jobs, and training programmes curated for pharmacy students — bridging the gap between campus and professional practice.',
    iconColor: '#C8991A',
    iconBg: 'rgba(242,193,46,0.10)',
    border: 'hover:border-gold-200',
  },
  {
    icon: Users,
    title: 'Community',
    desc: 'Inter-level bonding, social events, cultural activities, and outreach programmes that make GPSA-UDS a family — not just an association.',
    iconColor: '#185FA5',
    iconBg: 'rgba(24,95,165,0.08)',
    border: 'hover:border-blue-200',
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function TeamIntroSection() {
  return (
    <section className="section-padding" style={{ background: '#f4f7f4' }}>
      <div className="section-container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left: Team Photo */}
          <div className="flex justify-center lg:justify-start">
            <div className="relative w-full max-w-md">
              <div
                className="aspect-[3/4] rounded-3xl overflow-hidden shadow-lg"
                style={{ background: 'linear-gradient(145deg, #e8f5e9 0%, #f1f8f6 100%)' }}
              >
                {/* Placeholder for team photo */}
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                  <Users className="h-24 w-24 text-gray-400 mb-4" />
                  <p className="text-sm text-gray-600 text-center px-6">Team photo coming soon</p>
                </div>
              </div>
              {/* Accent decoration */}
              <div
                className="absolute -bottom-4 -right-4 w-32 h-32 rounded-full opacity-30 blur-3xl"
                style={{ background: '#F2C12E' }}
              />
            </div>
          </div>

          {/* Right: Description */}
          <div>
            <p className="text-xs font-700 uppercase tracking-widest mb-3" style={{ color: '#3CB559' }}>
              about the gpsa-uds
            </p>
            <h2
              className="font-display font-bold leading-snug mb-4"
              style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', color: '#1B3D22' }}
            >
              The official representation body of all students within the University of Medicine
            </h2>
            <p className="text-sm leading-relaxed text-muted mb-6">
              GPSA-UDS is the official representative body of all students of the university within the University for Development Studies. The GPSA serves to represent the interests and voices of pharmacy students while advocating for their welfare, rights, and academic excellence.
            </p>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-1"
                  style={{ background: 'rgba(60,181,89,0.15)' }}
                >
                  <BookOpen className="h-4 w-4" style={{ color: '#3CB559' }} />
                </div>
                <div>
                  <p className="font-body font-700 text-[#1B3D22] text-sm">Academic Excellence</p>
                  <p className="text-xs text-muted">Supporting student success through resources and mentorship</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-1"
                  style={{ background: 'rgba(60,181,89,0.15)' }}
                >
                  <Heart className="h-4 w-4" style={{ color: '#3CB559' }} />
                </div>
                <div>
                  <p className="font-body font-700 text-[#1B3D22] text-sm">Student Welfare</p>
                  <p className="text-xs text-muted">Ensuring holistic support for all members of our community</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function BuiltOnPrinciple() {
  return (
    <section className="section-padding">
      <div className="section-container">
        <div className="mb-10 text-center">
          <h2
            className="font-display font-bold"
            style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', color: '#1B3D22' }}
          >
            Built on Principle
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PRINCIPLES.map(({ icon: Icon, title, desc, iconColor, iconBg, cardBg, textColor }) => (
            <div
              key={title}
              className="rounded-2xl p-8 relative overflow-hidden transition-all hover:shadow-lg group"
              style={{ background: cardBg }}
            >
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: 'radial-gradient(ellipse at 80% 0%, rgba(242,193,46,0.12) 0%, transparent 60%)' }}
              />
              <div className="relative z-10">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: iconBg, color: iconColor }}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <h3
                  className="font-body font-700 text-lg mb-3"
                  style={{ color: textColor }}
                >
                  {title}
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: textColor, opacity: 0.85 }}
                >
                  {desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}


function StatsBanner() {
  return (
    <div
      className="relative overflow-hidden"
      style={{ background: 'linear-gradient(90deg, #A8D5BA 0%, #00B140 100%)' }}
    >
      {/* Pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='20' cy='20' r='1.5' fill='white'/%3E%3C/svg%3E")`,
        }}
      />
      <div className="section-container py-10 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-0 divide-x divide-white/10">
          {STATS.map(({ value, label, icon: Icon }) => (
            <div key={label} className="flex flex-col items-center justify-center text-center px-6 py-4">
              <Icon className="h-5 w-5 mb-3 opacity-50" style={{ color: '#7DD98A' }} />
              <p
                className="font-display font-bold leading-none mb-1"
                style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', color: '#fff' }}
              >
                {value}
              </p>
              <p className="text-xs font-500 uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.45)' }}>
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function WhatWeDo() {
  return (
    <section className="section-padding">
      <div className="section-container">
        <div className="mb-10 text-center">
          <h2
            className="font-display font-bold"
            style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', color: '#1B3D22' }}
          >
            What We Do
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PILLARS.map(({ icon: Icon, title, desc, iconColor, iconBg, border }) => (
            <div
              key={title}
              className={cn(
                'card p-6 border border-transparent transition-all hover:shadow-card-md hover:-translate-y-1',
                border,
              )}
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center mb-5"
                style={{ background: iconBg }}
              >
                <Icon className="h-5 w-5" style={{ color: iconColor }} />
              </div>
              <h3 className="font-body font-700 text-[#1B3D22] text-base mb-2">{title}</h3>
              <p className="text-sm text-muted leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function ExecutiveTeam() {
  return (
    <section className="section-padding">
      <div className="section-container">
        <div className="mb-10 text-center">
          <h2
            className="font-display font-bold"
            style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', color: '#1B3D22' }}
          >
            Meet Your SRC Executives
          </h2>
        </div>

        {/* President featured */}
        <div className="mb-8 flex justify-center">
          <ExecutiveCard exec={EXECUTIVES[0]} featured />
        </div>

        {/* Rest of exec */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {EXECUTIVES.slice(1).map((exec) => (
            <ExecutiveCard key={exec.role} exec={exec} />
          ))}
        </div>

        <p className="text-center text-xs text-muted mt-8 max-w-md mx-auto leading-relaxed">
          To update names, photos, or roles — edit the <code className="font-mono bg-cream-dark px-1 rounded">EXECUTIVES</code> array
          in <code className="font-mono bg-cream-dark px-1 rounded">AboutPage.tsx</code>, or wire it to your executives API endpoint.
        </p>
      </div>
    </section>
  )
}

interface ExecData {
  name: string
  role: string
  level: number
}

function ExecutiveCard({ exec, featured }: { exec: ExecData; featured?: boolean }) {
  return (
    <div
      className={cn(
        'card text-center flex flex-col items-center gap-0 transition-all hover:shadow-card-md hover:-translate-y-0.5',
        featured ? 'p-8 max-w-xs w-full' : 'p-4',
      )}
    >
      {/*
        Photo area — swap the inner <div> block with:
          <img
            src={exec.photo_url}
            alt={exec.name}
            className="w-full h-full object-cover object-top"
          />
        once your API returns photo_url.
      */}
      <div
        className={cn(
          'overflow-hidden flex-shrink-0 mx-auto mb-4',
          featured ? 'w-24 h-24 rounded-2xl' : 'w-14 h-14 rounded-xl',
        )}
        style={{
          border: featured ? '3px solid rgba(60,181,89,0.4)' : '2px solid rgba(60,181,89,0.2)',
          boxShadow: featured ? '0 0 0 5px rgba(60,181,89,0.08)' : undefined,
        }}
      >
        {/* Silhouette placeholder — delete when real photo available */}
        <div
          className="w-full h-full flex flex-col items-end justify-end"
          style={{ background: 'linear-gradient(90deg, #A8D5BA 0%, #00B140 100%)' }}
        >
          <svg
            viewBox="0 0 60 60"
            className="w-full opacity-25"
            fill="white"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="30" cy="20" r="12" />
            <ellipse cx="30" cy="56" rx="22" ry="16" />
          </svg>
        </div>
      </div>

      {/* Gold accent rule for featured */}
      {featured && (
        <div
          className="w-8 h-0.5 rounded-full mb-3"
          style={{ background: 'linear-gradient(90deg,#F2C12E,#f5cf55)' }}
        />
      )}

      <p
        className={cn(
          'font-body font-700 text-[#1B3D22] leading-tight',
          featured ? 'text-base mb-1' : 'text-xs mb-0.5',
        )}
      >
        {exec.name}
      </p>
      <p className={cn('text-muted leading-tight', featured ? 'text-sm mb-2' : 'text-[11px] mb-1.5')}>
        {exec.role}
      </p>
      <span
        className="inline-block text-[10px] font-700 uppercase tracking-widest px-2 py-0.5 rounded-full"
        style={{ background: 'rgba(60,181,89,0.08)', color: '#3CB559' }}
      >
        Level {exec.level}
      </span>
    </div>
  )
}

function History() {
  return (
    <section className="section-padding" style={{ background: '#f4f7f4' }}>
      <div className="section-container">
        <div className="mb-10 text-center">
          <h2
            className="font-display font-bold"
            style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', color: '#1B3D22' }}
          >
            Our Journey
          </h2>
        </div>

        <div className="max-w-2xl mx-auto">
          {TIMELINE.map(({ year, title, body }, i) => (
            <div key={year} className="flex gap-6 group">
              {/* Year column */}
              <div className="flex flex-col items-center flex-shrink-0 w-14">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-700 flex-shrink-0 z-10"
                  style={{
                    background: i === 0
                      ? 'linear-gradient(90deg,#A8D5BA,#00B140)'
                      : 'rgba(60,181,89,0.08)',
                    color: i === 0 ? '#1B3D22' : '#3CB559',
                    border: i !== 0 ? '1px solid rgba(60,181,89,0.2)' : undefined,
                  }}
                >
                  {year.slice(2)}
                </div>
                {i < TIMELINE.length - 1 && (
                  <div
                    className="w-px flex-1 mt-2 mb-0"
                    style={{ background: 'rgba(60,181,89,0.15)', minHeight: '32px' }}
                  />
                )}
              </div>

              {/* Content */}
              <div className={cn('pb-8 flex-1', i === TIMELINE.length - 1 && 'pb-0')}>
                <p className="text-[10px] font-700 uppercase tracking-widest mb-1" style={{ color: '#3CB559' }}>
                  {year}
                </p>
                <h3 className="font-body font-700 text-[#1B3D22] text-sm mb-1">{title}</h3>
                <p className="text-xs text-muted leading-relaxed">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function ContactSection() {
  const navigate = useNavigate()

  const SOCIALS = [
    {
      label: 'WhatsApp',
      handle: 'Join our group',
      href: '#', // TODO: replace with actual WhatsApp link
      iconBg: '#dcfce7',
      iconColor: '#16a34a',
      svg: (
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.116 1.524 5.845L0 24l6.332-1.501A11.935 11.935 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.793 9.793 0 01-4.964-1.348l-.356-.211-3.757.891.937-3.657-.232-.374A9.773 9.773 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182c5.43 0 9.818 4.388 9.818 9.818 0 5.43-4.388 9.818-9.818 9.818z"/>
        </svg>
      ),
    },
    {
      label: 'Instagram',
      handle: '@gpsa_uds',
      href: '#', // TODO: replace with actual Instagram URL
      iconBg: '#fef3c7',
      iconColor: '#b45309',
      svg: (
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
        </svg>
      ),
    },
    {
      label: 'LinkedIn',
      handle: 'GPSA-UDS',
      href: '#', // TODO: replace with LinkedIn URL
      iconBg: '#dbeafe',
      iconColor: '#1d4ed8',
      svg: (
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
      ),
    },
    {
      label: 'YouTube',
      handle: '@gpsauds',
      href: '#', // TODO: replace with YouTube URL
      iconBg: '#fee2e2',
      iconColor: '#dc2626',
      svg: (
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      ),
    },
    {
      label: 'Email',
      handle: 'gpsauds@uds.edu.gh',
      href: 'mailto:gpsauds@uds.edu.gh', // TODO: update email
      iconBg: '#f3e8ff',
      iconColor: '#7c3aed',
      svg: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
        </svg>
      ),
    },
  ]

  return (
    <section className="section-padding">
      <div className="section-container">
        <div
          className="rounded-3xl overflow-hidden grid grid-cols-1 lg:grid-cols-2"
          style={{ background: 'linear-gradient(90deg, #A8D5BA 0%, #00B140 100%)', border: '1px solid #d1ead8' }}
        >
          {/* Left: CTA */}
          <div
            className="p-10 lg:p-14 flex flex-col justify-center relative overflow-hidden"
          >
            <div
              className="absolute inset-0 pointer-events-none opacity-[0.035]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='20' cy='20' r='1.5' fill='white'/%3E%3C/svg%3E")`,
              }}
            />
            <div className="relative z-10">
              <p className="text-xs font-700 uppercase tracking-widest mb-3" style={{ color: '#7DD98A' }}>
                Get Involved
              </p>
              <h2
                className="font-display font-bold text-white leading-snug mb-4"
                style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)' }}
              >
                Ready to be part of something bigger?
              </h2>
              <p className="text-sm leading-relaxed mb-7" style={{ color: 'rgba(255,255,255,0.60)' }}>
                Join thousands of pharmacy students who are already part of the GPSA-UDS community.
                Register today and unlock access to academic resources, events, welfare support, and more.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button variant="gold" size="md" onClick={() => navigate('/register')}
                  rightIcon={<ArrowRight className="h-4 w-4" />}>
                  Join GPSA-UDS
                </Button>
                <Button variant="outline-white" size="md" onClick={() => navigate('/welfare')}>
                  Contact Welfare
                </Button>
              </div>
            </div>
          </div>

          {/* Right: Social links */}
          <div
            className="p-10 lg:p-14 flex flex-col justify-center gap-4"
            style={{ background: '#f4fbf6' }}
          >
            <p className="text-xs font-700 uppercase tracking-widest mb-1" style={{ color: '#3CB559' }}>
              Reach Out
            </p>
            <h3 className="font-body font-700 text-[#1B3D22] text-lg mb-2">Connect with us</h3>
            {SOCIALS.map(({ label, handle, href, iconBg, iconColor, svg }) => (
              <a
                key={label}
                href={href}
                target={href.startsWith('http') ? '_blank' : undefined}
                rel="noreferrer"
                className="flex items-center gap-4 p-4 rounded-2xl border border-transparent bg-white
                           hover:border-green-200 hover:shadow-card transition-all group"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: iconBg, color: iconColor }}
                >
                  {svg}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body font-700 text-[#1B3D22] text-sm">{label}</p>
                  <p className="text-xs text-muted truncate">{handle}</p>
                </div>
                <ArrowRight
                  className="h-4 w-4 text-muted opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                />
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Page assembly
// ─────────────────────────────────────────────────────────────────────────────

export function AboutPage() {
  return (
    <>
      <PageHeader
        title="About GPSA-UDS"
        subtitle="Who we are, what we stand for, and the community we are building."
      />

      <TeamIntroSection />
      <BuiltOnPrinciple />
      <StatsBanner />
      <History />
      <WhatWeDo />
      <ExecutiveTeam />
      <ContactSection />
    </>
  )
}