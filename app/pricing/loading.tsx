export default function PricingLoading() {
  return (
    <div className="min-h-screen bg-[#e4e3e0] py-5 px-3 sm:px-6">
      <div
        className="max-w-[1120px] mx-auto rounded-[30px] overflow-hidden"
        style={{ background: 'linear-gradient(180deg,#ffffff 0%,#f1f0ee 100%)', boxShadow: '0 40px 90px -30px rgba(0,0,0,0.18)' }}
      >
        {/* nav placeholder */}
        <div className="flex items-center justify-between px-7 sm:px-12 pt-8">
          <div className="skeleton-light h-5 w-16 rounded" />
          <div className="skeleton-light h-8 w-28 rounded-full" />
        </div>

        {/* hero placeholder */}
        <div className="px-7 sm:px-12 pt-16 sm:pt-20 pb-12 text-center">
          <div className="skeleton-light h-3 w-20 rounded mx-auto mb-5" />
          <div className="skeleton-light h-12 w-3/4 rounded-xl mx-auto mb-4" />
          <div className="skeleton-light h-5 w-1/2 rounded-lg mx-auto" />
        </div>

        {/* plan cards placeholder */}
        <div className="px-7 sm:px-12 pb-16">
          <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-3xl border border-black/[0.07] bg-white/70 p-7 flex flex-col">
                <div className="skeleton-light h-11 w-11 rounded-xl mb-5" />
                <div className="skeleton-light h-6 w-24 rounded-lg mb-2" />
                <div className="skeleton-light h-4 w-36 rounded mb-6" />
                <div className="skeleton-light h-10 w-28 rounded-xl mb-7" />
                <div className="space-y-3 flex-1">
                  {[...Array(6)].map((_, j) => (
                    <div key={j} className="flex items-center gap-2.5">
                      <div className="skeleton-light h-[18px] w-[18px] rounded-full flex-shrink-0" />
                      <div className="skeleton-light h-4 rounded flex-1" />
                    </div>
                  ))}
                </div>
                <div className="skeleton-light h-11 w-full rounded-full mt-7" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
