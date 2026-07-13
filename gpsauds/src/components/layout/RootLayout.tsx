import { Outlet } from 'react-router-dom'
import { Footer, Navbar } from './index'
import { AnnouncementStrip } from './AnnouncementStrip'

export function RootLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <AnnouncementStrip />
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

// ── Auth layout (no header/footer) ────────────────────────────────────────────

export function AuthLayout() {
  return (
    <div className="min-h-screen relative overflow-hidden" style={{background:"#29a329"}}>
      {/* Background pattern */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 70% 30%, rgba(200,153,26,0.15) 0%, transparent 55%)',
        }}
      />
      <div className="relative min-h-screen flex flex-col items-center justify-center p-6">
        <Outlet />
      </div>
    </div>
  )
}