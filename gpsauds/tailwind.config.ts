import type { Config } from 'tailwindcss'

// ─────────────────────────────────────────────────────────────────────────────
// GPSA-UDS Design Tokens — v3 (semantic)
//
//  Primary:   #004D00  bold green — energetic, vibrant
//  Accent:    #C8912E  warm amber — sophisticated, not yellow
//  Neutral:   warm greys, clean whites
//
//  NAMING: keys stay green/gold/cream so all existing className references
//  (green-50, gold-400, cream-dark, …) continue to work.
//
//  CSS variables in globals.css are the source of truth.
//  Tailwind classes compile to literal hex values for JIT compatibility.
//  New components: prefer Tailwind utility classes over inline styles.
// ─────────────────────────────────────────────────────────────────────────────

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        foreground: {
          DEFAULT: '#1A1A2E',
          secondary: '#4B5563',
        },
        muted: {
          foreground: '#5C697A',
        },
        placeholder: {
          DEFAULT: '#6B7280',
        },
        disabled: {
          foreground: '#9CA3AF',
        },
        link: {
          DEFAULT: '#004400',
          hover: '#003800',
        },
        green: {
          DEFAULT: '#004D00',
          50:  '#E6F2E6',
          100: '#B3D9B3',
          200: '#80BF80',
          300: '#4DA64D',
          400: '#1A8C1A',
          500: '#004D00',
          600: '#004400',
          700: '#003800',
          800: '#002D00',
          900: '#001A00',
        },
        gold: {
          DEFAULT: '#C8912E',
          50:  '#FBF4E8',
          100: '#F5E6C8',
          200: '#EBCCA1',
          300: '#DFB075',
          400: '#D49D4E',
          500: '#C8912E',
          600: '#A07020',
          700: '#785214',
          800: '#50370B',
          900: '#2B1D05',
        },
        cream: {
          DEFAULT: '#F8F9F7',
          dark:    '#EDF0EC',
          darker:  '#D9DFD7',
        },
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        body:    ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '1rem' }],
      },
      boxShadow: {
        'card':      '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
        'card-md':   '0 4px 16px -2px rgb(0 77 0 / 0.10), 0 2px 6px -2px rgb(0 77 0 / 0.06)',
        'card-lg':   '0 12px 40px -4px rgb(0 77 0 / 0.12), 0 4px 16px -4px rgb(0 77 0 / 0.07)',
        'glow':      '0 0 0 3px rgb(0 77 0 / 0.18)',
        'glow-gold': '0 0 0 3px rgb(200 145 46 / 0.22)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      backgroundImage: {
        'hero-pattern': "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        'brand-gradient':    'linear-gradient(135deg, #004D00 0%, #004400 100%)',
        'brand-gradient-h':  'linear-gradient(135deg, #004400 0%, #003800 100%)',
        'legacy-gradient':   'linear-gradient(90deg, #006633 0%, #004D00 100%)',
        'legacy-gradient-h': 'linear-gradient(90deg, #005526 0%, #004400 100%)',
      },
      animation: {
        'fade-in':    'fadeIn 0.4s ease-out',
        'fade-up':    'fadeUp 0.5s ease-out',
        'slide-in':   'slideIn 0.35s ease-out',
        'marquee':    'marquee 30s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
        fadeUp:  { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideIn: { from: { opacity: '0', transform: 'translateX(-12px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        marquee: { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-50%)' } },
      },
    },
  },
  plugins: [],
} satisfies Config
