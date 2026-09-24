import { Sparkles } from "lucide-react";

/** The AI's one-line explanation, visually tied to the brand. */
export function ReasonCallout({ reason }: { reason: string }) {
  return (
    <p className="flex gap-2 rounded-lg bg-brand-soft/70 px-3 py-2 text-sm text-foreground">
      <Sparkles className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
      <span>
        <span className="sr-only">Why: </span>
        {reason}
      </span>
    </p>
  );
}
