/** Shown instantly on navigation while the next page's data loads */
export default function DashboardLoading() {
  return (
    <div className="animate-pulse" aria-busy="true" aria-label="Loading">
      <div className="mb-6 space-y-2">
        <div className="h-7 w-48 rounded-lg bg-gray-200" />
        <div className="h-4 w-72 rounded bg-gray-100" />
      </div>
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className="h-24 rounded-xl border border-[var(--border)] bg-white"
          />
        ))}
      </div>
      <div className="space-y-3 rounded-xl border border-[var(--border)] bg-white p-4">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-5 rounded bg-gray-100" />
        ))}
      </div>
    </div>
  );
}
