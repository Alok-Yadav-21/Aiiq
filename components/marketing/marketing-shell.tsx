import { SiteNav } from './site-nav'
import { SiteFooter } from './site-footer'

/**
 * The public-site frame: warm canvas, one white editorial sheet, shared nav
 * and footer. Every marketing page renders inside this so the chrome can
 * never drift between pages again.
 */
export function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas py-5 px-3 sm:px-6 text-ink">
      <div className="max-w-[1120px] mx-auto sheet">
        <SiteNav />
        {children}
        <SiteFooter />
      </div>
    </div>
  )
}
