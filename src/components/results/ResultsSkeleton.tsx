import { Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type ResultsSkeletonProps = {
  label?: string;
  count?: number;
  compact?: boolean;
};

export function ResultsSkeleton({ label, count = 4, compact = false }: ResultsSkeletonProps) {
  return (
    <div aria-busy="true" aria-live="polite" className="space-y-3">
      {label && (
        <p className="inline-flex items-center gap-2 text-sm font-medium text-brand">
          <Sparkles className="size-4 animate-pulse" aria-hidden />
          {label}
        </p>
      )}
      <div className={compact ? "space-y-3" : "grid gap-3 md:grid-cols-2"}>
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className="flex gap-3 rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
            <Skeleton className="size-16 shrink-0 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              {!compact && <Skeleton className="h-8 w-full rounded-lg" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
