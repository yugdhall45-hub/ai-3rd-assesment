export default function Loading() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-pulse">
      {/* Top Banner Skeleton */}
      <div className="h-32 bg-slate-200/80 rounded-2xl w-full"></div>

      {/* 5 KPI Metric Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-3 bg-slate-200 rounded w-20"></div>
              <div className="w-8 h-8 rounded-lg bg-slate-100"></div>
            </div>
            <div className="h-7 bg-slate-200 rounded w-28"></div>
            <div className="h-3 bg-slate-100 rounded w-36"></div>
          </div>
        ))}
      </div>

      {/* Main Content Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <div className="h-5 bg-slate-200 rounded w-40"></div>
          <div className="space-y-3 pt-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-14 bg-slate-50 border border-slate-100 rounded-xl"></div>
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <div className="h-48 bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
            <div className="h-4 bg-slate-200 rounded w-32"></div>
            <div className="h-10 bg-slate-100 rounded-xl"></div>
            <div className="h-10 bg-slate-100 rounded-xl"></div>
          </div>
          <div className="h-48 bg-emerald-700/20 rounded-2xl"></div>
        </div>
      </div>
    </div>
  );
}
