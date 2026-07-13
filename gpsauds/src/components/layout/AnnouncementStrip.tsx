/**
 * AnnouncementStrip
 *
 * Drop-in replacement for the existing AnnouncementStrip in your layout index.
 * Uses high-contrast text so items are clearly legible against the dark-green
 * background.
 *
 * Usage (in your layout index.tsx):
 *   export { AnnouncementStrip } from './AnnouncementStrip'
 *   — or just paste the component directly into your layout index.
 *
 * Props:
 *   items   – array of strings to scroll (falls back to DEFAULTS if omitted)
 *   speed   – animation duration in seconds; lower = faster (default 28)
 */

import { useQuery } from '@tanstack/react-query'
import { newsApi } from '@/api/services'

const DEFAULTS = [
  'Welcome to the GPSA-UDS Student Portal',
  'Check the Academics Hub for new resources',
  'Upcoming events — register now before spots fill up',
  'GPSA-UDS Welfare is available to all students',
]

interface AnnouncementStripProps {
  /** Override items instead of fetching from the API */
  items?: string[]
  /** Scroll animation duration in seconds (default: 28) */
  speed?: number
}

export function AnnouncementStrip({ items, speed = 28 }: AnnouncementStripProps) {
  // Pull the 5 latest urgent / announcement-category posts from the API.
  // Falls back to static defaults if the query hasn't resolved yet.
  const { data } = useQuery({
    queryKey: ['announcement-strip'],
    queryFn: () => newsApi.list({ limit: 5, category: 'announcement' }),
    staleTime: 5 * 60 * 1000,
  })

  const resolved: string[] =
    items ??
    (data?.items.map((p) => p.title) ?? []).filter(Boolean).slice(0, 6)

  const display = resolved.length > 0 ? resolved : DEFAULTS

  // Duplicate items so the loop is seamless regardless of how few there are
  const looped = [...display, ...display, ...display]

  return (
    <div
      className="relative overflow-hidden"
      style={{
        // Same dark-green background as the rest of the navigation chrome
        background: '#1B3D22',
        height: '34px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
      aria-label="Latest announcements"
    >
      {/* "LIVE" label — hard left, masks the scroll origin */}
      <div
        className="absolute left-0 top-0 bottom-0 z-10 flex items-center px-3.5 select-none flex-shrink-0"
        style={{
          background: 'linear-gradient(90deg, #A8D5BA, #00B140)',
          // Fade out to the right so the transition into text looks clean
          boxShadow: '4px 0 12px 4px #1B3D22',
        }}
      >
        <span
          className="font-body font-700 uppercase tracking-widest"
          style={{ fontSize: '10px', color: '#1B3D22', letterSpacing: '0.12em' }}
        >
          LIVE
        </span>
      </div>

      {/* Scrolling track */}
      <div
        className="flex items-center h-full"
        style={{ paddingLeft: '72px' }} // clear the LIVE badge
      >
        <div
          className="flex items-center gap-0 whitespace-nowrap"
          style={{
            animation: `announcementScroll ${speed}s linear infinite`,
          }}
        >
          {looped.map((item, i) => (
            <span key={i} className="inline-flex items-center">
              {/* Separator dot */}
              <span
                style={{
                  display: 'inline-block',
                  width: '4px',
                  height: '4px',
                  borderRadius: '50%',
                  background: '#29a329',
                  margin: '0 18px',
                  flexShrink: 0,
                  verticalAlign: 'middle',
                }}
              />
              {/* Item text — near-white so it pops on the dark green bg */}
              <span
                className="font-body font-500"
                style={{
                  fontSize: '12.5px',
                  // High-contrast: white at 92% opacity is easy to read and
                  // softer than full white, matching the premium feel of the UI
                  color: 'rgba(255,255,255,0.92)',
                  letterSpacing: '0.01em',
                }}
              >
                {item}
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* Keyframes — injected once */}
      <style>{`
        @keyframes announcementScroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-33.333%); }
        }
      `}</style>
    </div>
  )
}