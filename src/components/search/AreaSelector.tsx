"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { ChevronDown, Loader2, MapPin } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import type { AreaDTO } from "@/types/restaurant";

const DEFAULT_AREA = "gulberg";

/**
 * "Deliver to" location picker in the header. The choice lives in the URL
 * (?area=gulberg) so links are shareable; changing it keeps the current search.
 */
export function AreaSelector({ areas }: { areas: AreaDTO[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const requested = searchParams.get("area") ?? DEFAULT_AREA;
  const current =
    areas.find((a) => a.slug === requested) ??
    areas.find((a) => a.slug === DEFAULT_AREA) ??
    areas[0];
  const items = areas.map((area) => ({ value: area.slug, label: `${area.name}, ${area.city}` }));

  function handleChange(next: string | null) {
    if (!next || next === current?.slug) return;
    // On other pages, switching area takes you to that area's home.
    const params = new URLSearchParams(pathname === "/" ? searchParams.toString() : "");
    params.set("area", next);
    startTransition(() => router.push(`/?${params.toString()}`, { scroll: false }));
  }

  return (
    <Select items={items} value={current?.slug ?? null} onValueChange={handleChange}>
      <SelectTrigger
        aria-label="Delivery area"
        className="h-auto min-w-0 gap-2 rounded-full border-0 bg-transparent px-2 py-1.5 hover:bg-brand-soft/60 [&>svg:last-child]:hidden"
      >
        {isPending ? (
          <Loader2 className="size-5 shrink-0 animate-spin text-brand" aria-hidden />
        ) : (
          <MapPin className="size-5 shrink-0 text-brand" aria-hidden />
        )}
        <span className="flex min-w-0 flex-col items-start leading-tight">
          <span className="text-[11px] font-semibold text-muted-foreground">Deliver to</span>
          <span className="flex items-center gap-1 truncate text-sm font-bold text-foreground">
            {current ? `${current.name}, ${current.city}` : "Choose area"}
            <ChevronDown className="size-4 shrink-0 text-brand" aria-hidden />
          </span>
        </span>
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
