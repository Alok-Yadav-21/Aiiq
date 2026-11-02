import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas py-5 px-3 sm:px-6 text-ink">
      <div className="max-w-[1120px] mx-auto sheet min-h-[calc(100vh-2.5rem)] flex flex-col">
        {/* Chrome */}
        <header className="flex items-center justify-between px-7 sm:px-12 pt-8">
          <Link href="/" className="text-lg font-black tracking-[0.18em] hover:opacity-60 transition-opacity">
            AIIQ
          </Link>
          <Link
            href="/"
            className="label-eyebrow hover:text-ink transition-colors"
          >
            ← Back to site
          </Link>
        </header>

        {/* Content */}
        <main className="flex-1 flex items-center justify-center px-6 sm:px-12 py-12">
          {children}
        </main>

        <footer className="px-7 sm:px-12 py-6 border-t border-line-soft flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] tracking-wide text-ink-faint">
            © 2025 AIIQ · Learn It. Quiz It. Win It.
          </p>
          <div className="flex items-center gap-6 label-eyebrow">
            <Link href="/terms" className="hover:text-ink transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-ink transition-colors">Privacy</Link>
          </div>
        </footer>
      </div>
    </div>
  )
}
