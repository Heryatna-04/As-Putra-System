export default function CatalogLoading() {
  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-68px)] animate-pulse">
      {/* Sidebar Skeleton */}
      <div className="w-full lg:w-72 bg-white border-r border-zinc-200 p-6 hidden lg:block space-y-4">
        <div className="h-5 bg-zinc-200 rounded-md w-3/4 mb-6"></div>
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-4 bg-zinc-100 rounded-md w-full"></div>
        ))}
      </div>

      {/* Main Grid Skeleton */}
      <main className="flex-1 bg-zinc-50 p-5 sm:p-8 space-y-6">
        <div className="h-28 bg-white border border-zinc-200 rounded-2xl"></div>
        <div className="h-12 bg-white border border-zinc-200 rounded-xl"></div>
        
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-zinc-200 p-5 h-80 space-y-4">
              <div className="aspect-square bg-zinc-100 rounded-lg w-full"></div>
              <div className="h-4 bg-zinc-200 rounded-md w-3/4"></div>
              <div className="h-3 bg-zinc-100 rounded-md w-1/2"></div>
              <div className="h-6 bg-zinc-200 rounded-md w-1/3 pt-4"></div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
