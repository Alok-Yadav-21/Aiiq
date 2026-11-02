export default function LeaderboardLoading() {
  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      <div className="mb-8">
        <div className="skeleton-light h-10 w-64 rounded-xl mb-2" />
        <div className="skeleton-light h-4 w-48 rounded-lg" />
      </div>

      {/* Podium skeleton */}
      <div className="flex items-end justify-center gap-4 mb-10">
        {[28, 36, 24].map((h, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <div className="skeleton-light h-8 w-8 rounded-lg" />
            <div className="skeleton-light h-14 w-14 rounded-2xl" />
            <div className="skeleton-light h-3 w-16 rounded" />
            <div className="skeleton-light w-20 rounded-t-xl" style={{ height: `${h * 4}px` }} />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="surface-card rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100">
              {['Rank', 'Player', 'ELO', 'Wins', 'Earnings'].map((col) => (
                <th key={col} className="p-4">
                  <div className="skeleton-light h-3 w-12 rounded" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(10)].map((_, i) => (
              <tr key={i} className="border-b border-slate-100">
                <td className="p-4"><div className="skeleton-light h-6 w-8 rounded" /></td>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="skeleton-light h-9 w-9 rounded-xl" />
                    <div>
                      <div className="skeleton-light h-3.5 w-24 rounded mb-1.5" />
                      <div className="skeleton-light h-2.5 w-16 rounded" />
                    </div>
                  </div>
                </td>
                <td className="p-4 text-right"><div className="skeleton-light h-3.5 w-12 rounded ml-auto" /></td>
                <td className="p-4 text-right hidden md:table-cell"><div className="skeleton-light h-3.5 w-8 rounded ml-auto" /></td>
                <td className="p-4 text-right"><div className="skeleton-light h-3.5 w-14 rounded ml-auto" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
