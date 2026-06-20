export default function SignupLoading() {
  return (
    <div className="w-full max-w-4xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
      {/* Left pane skeleton */}
      <div className="hidden lg:block">
        <div className="skeleton h-10 w-3/4 rounded-xl mb-3" />
        <div className="skeleton h-10 w-1/2 rounded-xl mb-8" />
        <div className="space-y-4 mb-10">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="skeleton h-5 w-5 rounded-full flex-shrink-0" />
              <div className="skeleton h-4 flex-1 rounded" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="glass rounded-xl p-4 text-center">
              <div className="skeleton h-8 w-16 rounded mx-auto mb-1" />
              <div className="skeleton h-3 w-12 rounded mx-auto" />
            </div>
          ))}
        </div>
      </div>

      {/* Right form skeleton */}
      <div>
        <div className="mb-6">
          <div className="skeleton h-7 w-48 rounded mb-2" />
          <div className="skeleton h-4 w-36 rounded" />
        </div>
        <div className="glass rounded-2xl p-8">
          <div className="space-y-5">
            {[...Array(3)].map((_, i) => (
              <div key={i}>
                <div className="skeleton h-4 w-20 rounded mb-1.5" />
                <div className="skeleton h-12 w-full rounded-xl" />
              </div>
            ))}
            <div className="skeleton h-12 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  )
}
