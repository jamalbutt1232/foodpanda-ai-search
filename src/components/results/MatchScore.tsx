import { cn } from "@/lib/utils";

/** "92% match" with a bar; colour steps down as the match gets weaker. */
export function MatchScore({ score }: { score: number }) {
  const tone = score >= 80 ? "bg-brand" : score >= 60 ? "bg-amber-500" : "bg-muted-foreground/60";
  return (
    <div className="flex items-center gap-2" aria-label={`${score}% match`}>
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted sm:w-24">
        <div className={cn("h-full rounded-full", tone)} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-semibold tabular-nums">{score}% match</span>
    </div>
  );
}
