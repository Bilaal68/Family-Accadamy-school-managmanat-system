import { cn } from "@/lib/utils";

function ShimmerBlock({ className }) {
  return <div className={cn("skeleton-shimmer rounded-lg", className)} />;
}

export function MetricCardsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <ShimmerBlock key={i} className="h-28 border border-brand" />
      ))}
    </div>
  );
}

export function PanelSkeleton({ rows = 4 }) {
  return (
    <div className="space-y-3 rounded-lg border border-brand bg-card p-6">
      <ShimmerBlock className="h-5 w-40" />
      {Array.from({ length: rows }).map((_, i) => (
        <ShimmerBlock key={i} className="h-12" />
      ))}
    </div>
  );
}

export function ChartSkeleton({ className }) {
  return (
    <ShimmerBlock
      className={cn("h-72 border border-brand", className)}
    />
  );
}

export function ListSkeleton({ items = 6 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <ShimmerBlock key={i} className="h-14" />
      ))}
    </div>
  );
}

export function QuickActionsSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <ShimmerBlock key={i} className="h-24 border border-brand" />
      ))}
    </div>
  );
}
