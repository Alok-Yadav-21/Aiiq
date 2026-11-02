import Link from 'next/link'

const columns = [
  {
    heading: 'Product',
    links: [
      { href: '/pricing', label: 'Pricing' },
      { href: '/leaderboard', label: 'Leaderboard' },
      { href: '/signup', label: 'Get started' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { href: '/about', label: 'About' },
      { href: '/terms', label: 'Terms' },
      { href: '/privacy', label: 'Privacy' },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="px-7 sm:px-12 pt-12 pb-8 border-t border-line-soft">
      <div className="grid gap-10 sm:grid-cols-[1.5fr_1fr_1fr]">
        {/* Brand */}
        <div>
          <p className="text-lg font-black tracking-[0.18em] mb-3">AIIQ</p>
          <p className="text-[13px] leading-relaxed text-ink-muted max-w-xs">
            Turn your own study material into intelligent quizzes, flashcards and notes.
            Grounded strictly in what you upload.
          </p>
        </div>

        {columns.map((col) => (
          <div key={col.heading}>
            <p className="label-eyebrow mb-4">{col.heading}</p>
            <ul className="space-y-2.5">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[13px] text-ink-secondary hover:text-ink transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-10 pt-6 border-t border-line-soft flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-[11px] tracking-wide text-ink-faint">© 2025 AIIQ</p>
        <p className="label-eyebrow text-ink-faint">Learn It. Quiz It. Win It.</p>
      </div>
    </footer>
  )
}
