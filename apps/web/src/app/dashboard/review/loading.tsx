import { Skeleton } from '@/components/ui/skeleton'

export default function ReviewLoading() {
  return (
    <div className="flex h-full flex-col">
      {/* Header skeleton */}
      <div className="px-6 py-4 border-b border-border/50">
        <Skeleton className="h-5 w-48 mb-2" />
        <Skeleton className="h-4 w-32" />
      </div>

      {/* Card skeleton */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-lg space-y-4">
          <Skeleton className="h-56 w-full rounded-2xl" />
          <div className="flex justify-center gap-3">
            <Skeleton className="h-10 w-24 rounded-lg" />
            <Skeleton className="h-10 w-24 rounded-lg" />
            <Skeleton className="h-10 w-24 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  )
}
