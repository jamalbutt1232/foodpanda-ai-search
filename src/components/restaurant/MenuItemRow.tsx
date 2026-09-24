import { ItemFacts } from "@/components/shared/ItemFacts";
import { cn } from "@/lib/utils";
import { formatPkr } from "@/lib/format/formatPkr";
import type { MenuItemDTO } from "@/types/restaurant";

export function MenuItemRow({ item }: { item: MenuItemDTO }) {
  return (
    <li
      className={cn(
        "flex flex-col gap-2 rounded-xl bg-card p-4 ring-1 ring-foreground/10",
        !item.isAvailable && "opacity-60",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="leading-snug font-medium">{item.name}</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">{item.description}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-semibold">{formatPkr(item.price)}</p>
          {item.servesPeople > 1 && (
            <p className="text-xs text-muted-foreground">serves {item.servesPeople}</p>
          )}
        </div>
      </div>
      <ItemFacts {...item} />
      {!item.isAvailable && <p className="text-xs text-muted-foreground">Currently unavailable</p>}
    </li>
  );
}
