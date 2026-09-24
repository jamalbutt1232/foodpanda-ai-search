"use client";

import { Columns2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";

type ModeToggleProps = {
  compare: boolean;
  onChange: (compare: boolean) => void;
};

/** Switches between AI results only and the side-by-side "Today's search vs AI search". */
export function ModeToggle({ compare, onChange }: ModeToggleProps) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2.5 rounded-full bg-card px-3.5 py-2 text-sm ring-1 ring-foreground/10 select-none">
      <Columns2 className="size-4 text-brand" aria-hidden />
      <span className="font-medium">Compare with today&apos;s search</span>
      <Switch checked={compare} onCheckedChange={(checked) => onChange(checked)} />
    </label>
  );
}
