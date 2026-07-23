import { useEffect, useId, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  ArrowRight, BookOpen, CalendarDays, ChevronDown, Download, ExternalLink,
  FileText, HelpCircle, Search, Users, X,
} from 'lucide-react'
import { governanceApi } from '@/api/services'
import { Button, EmptyState, PageLoader } from '@/components/ui'

const defaults = {
  hero_eyebrow: 'DOCUMENTS & FAQS',
  hero_title_primary: 'Knowledge today.',
  hero_title_secondary: 'Stronger legacy tomorrow.',
  hero_intro: 'Access approved GPSA-UDS documents, policies, reports, plans, forms and answers to common questions.',
  resource_card_title: 'Essential Resources',
  resource_card_subtitle: 'All in One Place',
  resource_card_description: 'Transparent. Organised. Accessible.',
  faq_quote: 'Information empowers. Guidelines guide. Legacy endures.',
  cta_title: 'Be part of the legacy.',
  cta_description: 'Access resources. Stay informed. Make an impact.',
}

function fileSize(value?: number | null) {
  if (!value) return null
  return value >= 1024 * 1024 ? `${(value / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(value / 1024)} KB`
}

export function DocumentsFaqPage() {
  const searchId = useId()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [category, setCategory] = useState('')
  const [page, setPage] = useState(1)
  const [openFaq, setOpenFaq] = useState<string | null>(() => window.location.hash.replace('#faq-', '') || null)

  useEffect(() => {
    document.title = 'Documents & FAQs | GPSA-UDS'
    window.scrollTo({ top: 0 })
  }, [])
  useEffect(() => {
    const timer = window.setTimeout(() => { setDebouncedSearch(search.trim()); setPage(1) }, 300)
    return () => window.clearTimeout(timer)
  }, [search])

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ['governance-page', debouncedSearch, category, page],
    queryFn: () => governanceApi.getPage({ search: debouncedSearch || undefined, category: category || undefined, page, page_size: 8 }),
    placeholderData: (previous) => previous,
  })
  const content = useMemo(() => ({ ...defaults, ...(data?.settings ?? {}) }), [data?.settings])

  if (isLoading) return <PageLoader />
  if (isError || !data) return <main className="section-container py-20 text-center"><EmptyState title="Documents and FAQs are temporarily unavailable" description="Please try again shortly." /><Button className="mt-5" onClick={() => void refetch()}>Try again</Button></main>

  return (
    <main className="min-h-screen bg-slate-50/50 py-6 text-slate-800">
      <div className="section-container space-y-7 sm:space-y-9">
        <section className="relative isolate overflow-hidden rounded-2xl border border-[#002000] bg-[#002D00] text-white shadow-lg sm:rounded-3xl">
          {content.hero_image_url && <img src={content.hero_image_url} alt={content.hero_image_alt || ''} width={1600} height={720} className="absolute inset-0 -z-20 h-full w-full object-cover" />}
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#002D00] via-[#002D00]/95 to-[#001A00]/80" />
          <div className="grid min-h-[420px] items-end gap-8 px-6 py-10 sm:px-10 lg:grid-cols-[1fr_340px] lg:px-14 lg:py-14">
            <div className="max-w-2xl">
              <p className="text-xs font-bold tracking-[.18em] text-gold-400">{content.hero_eyebrow}</p>
              <h1 className="mt-4 font-display text-4xl font-bold leading-[1.06] sm:text-5xl lg:text-6xl">{content.hero_title_primary}<br /><span className="text-gold-400">{content.hero_title_secondary}</span></h1>
              <div className="mt-5 h-0.5 w-12 bg-gold-400" />
              <p className="mt-5 max-w-xl text-sm leading-7 text-white/85 sm:text-base">{content.hero_intro}</p>
            </div>
            <aside className="rounded-2xl border border-white/20 bg-white/10 p-6 shadow-xl backdrop-blur-md">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full border border-gold-400/50 text-gold-400"><FileText className="h-5 w-5" /></div>
              <h2 className="font-display text-xl font-bold">{content.resource_card_title}</h2>
              <p className="mt-1 font-display text-lg font-bold text-gold-400">{content.resource_card_subtitle}</p>
              <p className="mt-3 text-sm text-white/80">{content.resource_card_description}</p>
            </aside>
          </div>
        </section>

        <section aria-labelledby="documents-title" className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:rounded-3xl sm:p-9">
          <header className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#004D00]/10 text-[#004D00]"><FileText /></span>
            <div><h2 id="documents-title" className="font-display text-2xl font-bold text-green-950 sm:text-3xl">Document Library</h2><p className="mt-1 text-sm text-slate-600">Official documents and resources at your fingertips.</p></div>
          </header>
          <div className="mt-7 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Document categories">
              <button className={`min-h-11 shrink-0 rounded-xl px-4 text-sm font-semibold ${!category ? 'bg-[#004D00] text-white' : 'border border-slate-200 bg-slate-50 text-slate-700 hover:border-green-700'}`} onClick={() => { setCategory(''); setPage(1) }}>All Documents</button>
              {data.categories.map((item) => <button key={item.id} className={`min-h-11 shrink-0 rounded-xl px-4 text-sm font-semibold ${category === item.slug ? 'bg-[#004D00] text-white' : 'border border-slate-200 bg-slate-50 text-slate-700 hover:border-green-700'}`} onClick={() => { setCategory(item.slug); setPage(1) }}>{item.name}</button>)}
            </div>
            <div className="relative w-full lg:max-w-sm">
              <label htmlFor={searchId} className="sr-only">Search documents</label>
              <Search className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
              <input id={searchId} type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search documents..." className="min-h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-11 text-sm outline-none focus:border-green-700 focus:ring-2 focus:ring-green-700/20" />
              {search && <button aria-label="Clear document search" onClick={() => setSearch('')} className="absolute right-1.5 top-1.5 flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"><X className="h-4 w-4" /></button>}
            </div>
          </div>
          <div aria-live="polite" className="mt-4 flex min-h-6 items-center justify-between text-xs text-slate-500"><span>{data.pagination.total} {data.pagination.total === 1 ? 'document' : 'documents'} found</span>{isFetching && <span>Updating results…</span>}</div>
          {data.documents.length ? <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {data.documents.map((document) => <article key={document.id} className="flex min-h-64 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-green-700/30 hover:shadow-md">
              <div className="flex items-start justify-between gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-800"><FileText /></span><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase text-slate-600">{document.file_extension || document.document_type}</span></div>
              <h3 className="mt-4 font-display text-base font-bold leading-5 text-green-950">{document.title}</h3>
              <p className="mt-2 text-xs font-semibold text-green-800">{document.category.name}</p>
              {document.description && <p className="mt-2 line-clamp-3 text-xs leading-5 text-slate-600">{document.description}</p>}
              <div className="mt-4 space-y-1 text-[11px] text-slate-500">
                {document.publication_date && <p className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" />{new Date(`${document.publication_date}T00:00:00`).toLocaleDateString()}</p>}
                <p>{[document.version && `Version ${document.version}`, document.edition, fileSize(document.file_size_bytes)].filter(Boolean).join(' · ')}</p>
              </div>
              <div className="mt-auto flex gap-2 pt-5">
                {document.view_url && <a className="btn-sm btn-outline flex-1" href={document.view_url} target="_blank" rel="noreferrer" aria-label={`View ${document.title}`}><ExternalLink className="h-3.5 w-3.5" />View</a>}
                {document.download_url && <a className="btn-sm btn-primary flex-1" href={document.download_url} aria-label={`Download ${document.title}, ${document.file_extension || document.document_type}${fileSize(document.file_size_bytes) ? `, ${fileSize(document.file_size_bytes)}` : ''}`}><Download className="h-3.5 w-3.5" />Download</a>}
              </div>
            </article>)}
          </div> : <div className="mt-6 rounded-2xl bg-slate-50 py-10"><EmptyState title="No documents found" description={search || category ? 'Try clearing your search or choosing another category.' : 'Approved documents will appear here after publication.'} /></div>}
          {data.pagination.pages > 1 && <nav aria-label="Document result pages" className="mt-7 flex items-center justify-center gap-3"><Button variant="outline" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</Button><span className="text-sm text-slate-600">Page {page} of {data.pagination.pages}</span><Button variant="outline" disabled={page >= data.pagination.pages} onClick={() => setPage((value) => value + 1)}>Next</Button></nav>}
        </section>

        <section aria-labelledby="faq-title" className="grid gap-6 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:rounded-3xl sm:p-9 lg:grid-cols-[1fr_300px]">
          <div>
            <header className="flex items-start gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#004D00] text-white"><HelpCircle /></span><div><h2 id="faq-title" className="font-display text-2xl font-bold text-green-950 sm:text-3xl">Frequently Asked Questions</h2><p className="mt-1 text-sm text-slate-600">Find answers to common questions about GPSA-UDS.</p></div></header>
            {data.faqs.length ? <div className="mt-7 space-y-2">{data.faqs.map((faq) => {
              const expanded = openFaq === faq.slug; const panelId = `faq-panel-${faq.id}`
              return <article key={faq.id} id={`faq-${faq.slug}`} className="rounded-xl border border-slate-200 bg-slate-50/70">
                <h3><button className="flex min-h-12 w-full items-center justify-between gap-4 px-4 py-3 text-left text-sm font-bold text-green-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700" aria-expanded={expanded} aria-controls={panelId} onClick={() => { setOpenFaq(expanded ? null : faq.slug); history.replaceState(null, '', expanded ? location.pathname : `#faq-${faq.slug}`) }}>{faq.question}<ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`} /></button></h3>
                {expanded && <div id={panelId} className="border-t border-slate-200 px-4 py-4 text-sm leading-7 text-slate-700"><p className="whitespace-pre-line">{faq.answer}</p>{faq.related_url && <Link className="mt-3 inline-flex items-center gap-1 font-bold text-green-800" to={faq.related_url}>Learn more <ArrowRight className="h-4 w-4" /></Link>}</div>}
              </article>
            })}</div> : <div className="mt-7 rounded-2xl bg-slate-50 py-10"><EmptyState title="No FAQs published yet" description="Verified answers will appear here after review." /></div>}
          </div>
          <aside className="flex min-h-64 flex-col justify-between overflow-hidden rounded-2xl border border-green-100 bg-gradient-to-br from-green-50 to-amber-50 p-7">
            <span className="font-serif text-7xl leading-none text-green-700/50">“</span>
            <blockquote className="font-display text-xl font-semibold leading-8 text-green-950">{content.faq_quote}</blockquote>
            <BookOpen className="ml-auto h-16 w-16 text-green-800/10" />
          </aside>
        </section>

        <section className="flex flex-col items-center justify-between gap-6 rounded-3xl border border-[#002000] bg-gradient-to-r from-[#003816] via-[#004D00] to-[#002D00] p-7 text-white shadow-lg sm:p-9 lg:flex-row">
          <div className="flex items-center gap-4"><span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-gold-400/60 text-gold-400"><Users /></span><div><h2 className="font-display text-3xl font-bold">{content.cta_title}</h2><p className="mt-1 text-sm text-white/75">{content.cta_description}</p></div></div>
          <div className="flex flex-wrap justify-center gap-3"><Button variant="gold" onClick={() => location.assign('/register')}>Join GPSA-UDS</Button><Button variant="outline-white" onClick={() => location.assign('/about/impact')}>Explore Initiatives</Button><Button variant="outline-white" onClick={() => location.assign('/contact')}>Contact Us</Button></div>
        </section>
      </div>
    </main>
  )
}
