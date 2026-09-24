import { Brain } from "lucide-react";
import type { Constraints } from "@/lib/ai/schemas";
import { constraintsToChips, type ChipKind } from "@/lib/format/understood";
import { cn } from "@/lib/utils";

const KIND_STYLES: Record<ChipKind, string> = {
  dish: "bg-brand-soft text-brand-strong",
  include: "bg-emerald-50 text-emerald-800",
  exclude: "bg-red-50 text-red-700",
  method: "bg-amber-50 text-amber-800",
  nutrition: "bg-orange-50 text-orange-800",
  money: "bg-sky-50 text-sky-800",
  people: "bg-violet-50 text-violet-800",
  tag: "bg-teal-50 text-teal-800",
};

/** Shows what the AI understood, so viewers can see the query was really parsed. */
export function UnderstoodChips({ constraints }: { constraints: Constraints }) {
  const chips = constraintsToChips(constraints);
  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
        <Brain className="size-4 text-brand" aria-hidden />
        Understood as:
      </span>
      {chips.map((chip) => (
        <span
          key={chip.label}
          className={cn("rounded-full px-2.5 py-1 text-xs font-medium", KIND_STYLES[chip.kind])}
        >
          {chip.label}
        </span>
      ))}
    </div>
  );
}
