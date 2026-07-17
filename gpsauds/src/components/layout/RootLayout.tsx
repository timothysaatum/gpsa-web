import { Outlet } from 'react-router-dom'
import { Footer, Navbar } from './index'

export function RootLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

// ── Auth layout (with header/footer + green background) ─────────────────────

export function AuthLayout() {
  return (
    <div className="min-h-screen flex flex-col" style={{background:"var(--green-bright-old)"}}>
      {/* Background pattern */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 70% 30%, color-mix(in srgb, var(--gold-old-deep) 15%, transparent) 0%, transparent 55%)',
        }}
      />
      <div className="relative flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-6">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  )
}