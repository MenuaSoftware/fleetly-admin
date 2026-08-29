import { cn } from "@/lib/utils";

/**
 * Loading placeholders, one per page shape. These mirror the real
 * layout closely enough that the page doesn't visibly reflow when data
 * lands — reserving the right space is the whole point, and a generic
 * spinner would let content jump.
 *
 * Rendered through Next's `loading.tsx` convention, so they show
 * automatically via Suspense on every navigation.
 */

export function SkeletonBar({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-md", className)} />;
}

function HeaderSkeleton() {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div className="flex items-start gap-3.5">
        <SkeletonBar className="h-11 w-11 rounded-2xl" />
        <div>
          <SkeletonBar className="mb-2 h-2.5 w-20" />
          <SkeletonBar className="h-7 w-40" />
          <SkeletonBar className="mt-2 h-3 w-56" />
        </div>
      </div>
      <SkeletonBar className="h-10 w-32 rounded-xl" />
    </div>
  );
}

export function ListPageSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <HeaderSkeleton />
      <SkeletonBar className="mb-4 h-9 w-64 rounded-full" />
      <div className="overflow-hidden rounded-2xl border border-line bg-paper">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-line px-5 py-4 last:border-0">
            <SkeletonBar className="h-2 w-2 rounded-full" />
            <SkeletonBar className="h-3.5 w-36" />
            <SkeletonBar className="h-3 w-24" />
            <SkeletonBar className="ml-auto h-6 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function GridPageSkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <HeaderSkeleton />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: cards }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-line bg-paper p-4">
            <div className="flex items-start gap-3">
              <SkeletonBar className="h-10 w-10 rounded-xl" />
              <div className="flex-1">
                <SkeletonBar className="h-3.5 w-28" />
                <SkeletonBar className="mt-2 h-3 w-20" />
              </div>
            </div>
            <SkeletonBar className="mt-4 h-8 w-full rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function DetailPageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <SkeletonBar className="mb-4 h-4 w-20" />
      <div className="mb-5 rounded-2xl border border-line bg-paper p-5">
        <div className="flex items-start gap-3.5">
          <SkeletonBar className="h-11 w-11 rounded-2xl" />
          <div>
            <SkeletonBar className="h-5 w-32" />
            <SkeletonBar className="mt-2 h-3 w-24" />
          </div>
        </div>
      </div>
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonBar key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <SkeletonBar className="h-56 rounded-2xl" />
    </div>
  );
}

export function FormPageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <SkeletonBar className="mb-4 h-4 w-20" />
      <HeaderSkeleton />
      <div className="rounded-2xl border border-line bg-paper p-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="mb-4">
            <SkeletonBar className="mb-1.5 h-3 w-20" />
            <SkeletonBar className="h-10 w-full rounded-xl" />
          </div>
        ))}
        <SkeletonBar className="h-10 w-full rounded-xl" />
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[110rem] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <SkeletonBar className="mb-6 h-36 rounded-3xl" />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonBar key={i} className="h-32 rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <SkeletonBar className="h-72 rounded-2xl lg:col-span-2" />
        <SkeletonBar className="h-72 rounded-2xl" />
        <SkeletonBar className="h-64 rounded-2xl lg:col-span-2" />
        <SkeletonBar className="h-64 rounded-2xl" />
      </div>
    </div>
  );
}
