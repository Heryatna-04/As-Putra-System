export default function CatalogLoading() {
  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-68px)] font-sans bg-zinc-50">
      {/* Sidebar Skeleton */}
      <div className="w-full lg:w-72 bg-white border-r border-zinc-200 p-6 hidden lg:block space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
          <div className="h-5 bg-zinc-200/80 rounded-lg w-28 animate-pulse" />
          <div className="h-4 bg-zinc-100 rounded-md w-12 animate-pulse" />
        </div>
        <div className="space-y-3">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <div className="h-4 bg-zinc-200/60 rounded-md w-3/4 animate-pulse" />
              <div className="h-3.5 bg-zinc-100 rounded-md w-6 animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Skeleton */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl">
        {/* Banner Skeleton */}
        <div className="h-36 sm:h-44 bg-gradient-to-r from-zinc-200 via-zinc-100 to-zinc-200 rounded-3xl border border-zinc-200/80 p-6 animate-pulse flex flex-col justify-between">
          <div className="space-y-2">
            <div className="h-4 bg-zinc-300/60 rounded-md w-28" />
            <div className="h-7 bg-zinc-300/80 rounded-lg w-64" />
          </div>
          <div className="h-4 bg-zinc-300/50 rounded-md w-48" />
        </div>

        {/* Search Toolbar Skeleton */}
        <div className="h-14 bg-white border border-zinc-200 rounded-2xl p-3 flex items-center justify-between gap-4 animate-pulse">
          <div className="h-8 bg-zinc-100 rounded-xl flex-1 max-w-md" />
          <div className="h-8 bg-zinc-100 rounded-xl w-36 hidden sm:block" />
        </div>

        {/* Product Grid Skeleton */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-zinc-200 p-4 space-y-4 shadow-xs animate-pulse flex flex-col justify-between h-[360px]">
              <div className="w-full aspect-square bg-zinc-100 rounded-xl flex items-center justify-center relative overflow-hidden">
                <div className="w-16 h-16 bg-zinc-200/50 rounded-full" />
              </div>
              <div className="space-y-2 flex-1">
                <div className="h-3 bg-zinc-200/70 rounded-md w-1/3" />
                <div className="h-4 bg-zinc-300/80 rounded-md w-full" />
                <div className="h-4 bg-zinc-300/60 rounded-md w-2/3" />
              </div>
              <div className="pt-3 border-t border-zinc-100 flex items-center justify-between">
                <div className="h-6 bg-zinc-300/80 rounded-md w-24" />
                <div className="h-8 bg-red-100 rounded-lg w-20" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
