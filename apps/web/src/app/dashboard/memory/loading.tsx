import { Skeleton } from '@/components/ui/skeleton'

export default function MemoryLoading() {
  return (
    <div className="flex h-full flex-col">
      {/* Header skeleton */}
      <div className="px-6 py-4 border-b border-border/50">
        <Skeleton className="h-5 w-36 mb-2" />
        <Skeleton className="h-4 w-48" />
      </div>

      {/* Insight cards skeleton */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border/50 bg-card/30 p-5 space-y-3"
          >
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <div className="flex gap-2 mt-1">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
