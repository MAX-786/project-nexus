import { Skeleton } from '@/components/ui/skeleton'

export default function GraphLoading() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-background/50">
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-48 w-48">
          {/* Simulate a few graph nodes */}
          {[
            'top-0 left-1/2 -translate-x-1/2',
            'bottom-0 left-8',
            'bottom-0 right-8',
          ].map((pos, i) => (
            <Skeleton
              key={i}
              className={`absolute h-12 w-24 rounded-lg ${pos}`}
            />
          ))}
          {/* Edges */}
          <Skeleton className="absolute top-12 left-1/2 h-24 w-0.5 -translate-x-1/2 rounded-full" />
        </div>
        <Skeleton className="h-4 w-40" />
      </div>
    </div>
  )
}
