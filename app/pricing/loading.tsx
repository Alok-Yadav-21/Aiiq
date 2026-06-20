export default function PricingLoading() {
  return (
    <div className="min-h-screen hero-bg">
      {/* Navbar placeholder */}
      <div className="fixed top-0 left-0 right-0 h-16 border-b border-white/5 backdrop-blur-xl bg-bg-base/80 z-50" />

      <div className="max-w-6xl mx-auto px-4 pt-28 pb-20">
        {/* Header skeleton */}
        <div className="text-center mb-16">
          <div className="skeleton h-8 w-48 rounded-full mx-auto mb-6" />
          <div className="skeleton h-14 w-3/4 rounded-xl mx-auto mb-4" />
          <div className="skeleton h-6 w-1/2 rounded-lg mx-auto" />
        </div>

        {/* Plan cards skeleton */}
        <div className="grid md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="glass rounded-2xl border border-white/10 flex flex-col">
              <div className="p-6 flex-1">
                <div className="skeleton h-11 w-11 rounded-xl mb-4" />
                <div className="skeleton h-6 w-24 rounded-lg mb-2" />
                <div className="skeleton h-4 w-36 rounded mb-5" />
                <div className="skeleton h-10 w-28 rounded-xl mb-6" />
                <div className="space-y-3">
                  {[...Array(6)].map((_, j) => (
                    <div key={j} className="flex items-center gap-2.5">
                      <div className="skeleton h-4.5 w-4.5 rounded-full flex-shrink-0" />
                      <div className="skeleton h-4 rounded flex-1" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-6 pt-0">
                <div className="skeleton h-11 w-full rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
