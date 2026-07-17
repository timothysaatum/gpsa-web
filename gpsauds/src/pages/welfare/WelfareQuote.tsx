import { HeartHandshake } from 'lucide-react'
import type { WelfareConfig } from '@/types'

interface WelfareQuoteProps {
  config: WelfareConfig | undefined
}

export function WelfareQuote({ config }: WelfareQuoteProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl mb-12 p-8 lg:p-10" style={{ background: 'var(--legacy-gradient)' }}>
      <div className="absolute top-2 right-6 font-display font-bold text-white/5 select-none leading-none" style={{ fontSize: '160px', lineHeight: 1 }}>
        &quot;
      </div>
      <div className="relative">
        <p className="text-lg lg:text-xl text-white/80 leading-relaxed italic font-body max-w-2xl mb-7">
          &quot;All reports are handled with care and confidentiality. Our Welfare Committee
          reviews every submission. No concern is too small — your wellbeing is our priority.&quot;
        </p>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm flex-shrink-0" style={{ background: 'rgba(255,255,255,0.12)' }}>
              <HeartHandshake className="h-4 w-4 text-green-300" />
            </div>
            <div>
              <p className="text-white text-sm font-700">GPSA-UDS Welfare Committee</p>
              <p className="text-white/35 text-xs">Confidential Welfare Portal</p>
            </div>
          </div>
              <div className="inline-flex flex-col bg-red-600/15 border border-red-400/25 rounded-2xl px-5 py-3 flex-shrink-0">
                <span className="text-red-300 text-[10px] font-700 uppercase tracking-widest mb-0.5">
                  🚨 Emergency Contact
                </span>
                <span className="text-white font-display font-bold text-base tracking-wide">
              {config?.emergency_contact ?? '+233 XXX XXX XXX'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
