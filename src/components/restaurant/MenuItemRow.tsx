import { FoodThumb } from "@/components/results/FoodThumb";
import { ItemFacts } from "@/components/shared/ItemFacts";
import { formatPkr } from "@/lib/format/formatPkr";
import { cn } from "@/lib/utils";
import type { MenuItemDTO } from "@/types/restaurant";

/** Menu row, delivery-app style: details on the left, dish picture on the right. */
export function MenuItemRow({ item }: { item: MenuItemDTO }) {
  return (
    <li
      className={cn(
        "flex gap-4 rounded-2xl bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.06)] ring-1 ring-black/5",
        !item.isAvailable && "opacity-55",
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <h3 className="leading-snug font-extrabold">{item.name}</h3>
        <p className="line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
        <p className="font-extrabold">
          {formatPkr(item.price)}
          {item.servesPeople > 1 && (
            <span className="ml-1.5 text-xs font-semibold text-muted-foreground">
              · serves {item.servesPeople}
            </span>
          )}
        </p>
        <div className="mt-auto pt-1">
          <ItemFacts {...item} />
        </div>
        {!item.isAvailable && (
          <p className="text-xs font-bold text-muted-foreground">Currently unavailable</p>
        )}
      </div>
      <FoodThumb category={item.category} className="size-24 sm:size-28" />
    </li>
  );
}
