/**
 * Shared skeleton pieces for Next.js's automatic loading.tsx convention
 * — each data-fetching page gets a matching loading.tsx that renders
 * one of these while its async Server Component resolves, instead of a
 * blank page or a layout-shifting flash of content. The `.skeleton`
 * class (globals.css) is a looping shimmer gradient, not a static gray
 * block — it's the difference between "the page is broken" and "the
 * page is working" at a glance.
 */

export function SkeletonBar({ className = "" }: { className?: string }) {
  return <div className={`skeleton rounded-md ${className}`} />;
}

export function ListPageSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <SkeletonBar className="mb-2 h-5 w-32" />
          <SkeletonBar className="h-3.5 w-56" />
        </div>
        <SkeletonBar className="h-10 w-28 rounded-xl" />
      </div>
      <div className="overflow-hidden rounded-2xl border border-line bg-paper shadow-sm">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className={`flex items-center justify-between gap-4 px-5 py-3.5 ${i > 0 ? "border-t border-line" : ""}`}>
            <div className="min-w-0 flex-1">
              <SkeletonBar className="mb-2 h-4 w-40" />
              <SkeletonBar className="h-3 w-24" />
            </div>
            <SkeletonBar className="h-6 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function DetailPageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <SkeletonBar className="mb-4 h-4 w-16" />
      <div className="mb-6 flex items-start justify-between">
        <div>
          <SkeletonBar className="mb-2 h-5 w-32" />
          <SkeletonBar className="h-3.5 w-24" />
        </div>
        <SkeletonBar className="h-6 w-20 rounded-full" />
      </div>
      <div className="mb-6 grid grid-cols-2 gap-3">
        <SkeletonBar className="h-20 rounded-2xl" />
        <SkeletonBar className="h-20 rounded-2xl" />
      </div>
      <SkeletonBar className="mb-6 h-24 rounded-2xl" />
      <SkeletonBar className="mb-2 h-4 w-40" />
      <SkeletonBar className="h-32 rounded-2xl" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <SkeletonBar className="mb-2 h-5 w-32" />
      <SkeletonBar className="mb-6 h-3.5 w-56" />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonBar key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <SkeletonBar className="h-64 rounded-2xl lg:col-span-2" />
        <SkeletonBar className="h-40 rounded-2xl" />
      </div>
    </div>
  );
}

export function FormPageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-sm px-4 py-8 sm:px-6 lg:px-8">
      <SkeletonBar className="mb-4 h-4 w-16" />
      <SkeletonBar className="mb-2 h-5 w-32" />
      <SkeletonBar className="mb-6 h-3.5 w-48" />
      <div className="space-y-4 rounded-2xl border border-line bg-paper p-6 shadow-sm">
        <SkeletonBar className="h-10 rounded-xl" />
        <SkeletonBar className="h-10 rounded-xl" />
        <SkeletonBar className="h-10 w-full rounded-xl" />
      </div>
    </div>
  );
}
