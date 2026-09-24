"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Loader2, MapPin } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AreaDTO } from "@/types/restaurant";

type AreaSelectorProps = {
  areas: AreaDTO[];
  value: string;
};

/** Area picker; the choice lives in the URL (?area=gulberg) so links are shareable. */
export function AreaSelector({ areas, value }: AreaSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const items = areas.map((area) => ({ value: area.slug, label: `${area.name}, ${area.city}` }));

  function handleChange(next: string | null) {
    if (!next || next === value) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("area", next);
    startTransition(() => router.push(`/?${params.toString()}`, { scroll: false }));
  }

  return (
    <Select items={items} value={value} onValueChange={handleChange}>
      <SelectTrigger
        aria-label="Delivery area"
        className="h-10 w-full min-w-56 bg-background text-foreground sm:w-auto"
      >
        {isPending ? (
          <Loader2 className="size-4 animate-spin text-brand" aria-hidden />
        ) : (
          <MapPin className="size-4 text-brand" aria-hidden />
        )}
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
