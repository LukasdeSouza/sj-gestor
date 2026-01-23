import { Skeleton } from "../ui/skeleton";

const gridRows = Array.from({ length: 6 });

export default function SkeletonInformation() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={`card-${index}`}
            className="rounded-xl border border-border bg-card p-4 shadow-soft"
          >
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-4 h-8 w-32" />
            <Skeleton className="mt-3 h-3 w-full" />
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-soft">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="mt-2 h-4 w-64" />

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {gridRows.map((_, rowIndex) => (
            <div
              key={`grid-${rowIndex}`}
              className="space-y-3 rounded-lg border border-border bg-muted/40 p-4"
            >
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <div
            key={`list-${index}`}
            className="rounded-xl border border-border bg-card p-5 shadow-soft"
          >
            <Skeleton className="h-5 w-40" />
            <div className="mt-4 space-y-3">
              {Array.from({ length: 4 }).map((__, itemIndex) => (
                <div key={`item-${index}-${itemIndex}`} className="space-y-2">
                  <Skeleton className="h-4 w-56" />
                  <div className="flex gap-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
