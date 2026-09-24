import {
  CakeSlice,
  CookingPot,
  CupSoda,
  Drumstick,
  Flame,
  Hamburger,
  Pizza,
  Popcorn,
  Salad,
  Sandwich,
  Soup,
  UtensilsCrossed,
  Wheat,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const THUMBS: Record<string, { icon: LucideIcon; className: string }> = {
  burger: { icon: Hamburger, className: "from-amber-100 to-orange-200 text-orange-700" },
  sandwich: { icon: Sandwich, className: "from-yellow-100 to-amber-200 text-amber-800" },
  wrap: { icon: Sandwich, className: "from-yellow-100 to-orange-200 text-orange-800" },
  pizza: { icon: Pizza, className: "from-orange-100 to-red-200 text-red-700" },
  desi: { icon: CookingPot, className: "from-amber-200 to-orange-300 text-orange-900" },
  bbq: { icon: Flame, className: "from-orange-200 to-red-300 text-red-800" },
  chinese: { icon: Soup, className: "from-red-100 to-rose-200 text-rose-700" },
  platter: { icon: UtensilsCrossed, className: "from-stone-100 to-amber-200 text-amber-900" },
  bowl: { icon: Salad, className: "from-lime-100 to-green-200 text-green-800" },
  salad: { icon: Salad, className: "from-lime-100 to-emerald-200 text-emerald-800" },
  soup: { icon: Soup, className: "from-orange-100 to-amber-200 text-amber-800" },
  wings: { icon: Drumstick, className: "from-orange-100 to-red-200 text-red-800" },
  fries: { icon: Popcorn, className: "from-yellow-100 to-yellow-300 text-yellow-800" },
  sides: { icon: Popcorn, className: "from-yellow-100 to-amber-200 text-amber-800" },
  bread: { icon: Wheat, className: "from-amber-100 to-yellow-200 text-amber-800" },
  dessert: { icon: CakeSlice, className: "from-pink-100 to-rose-200 text-rose-700" },
  drink: { icon: CupSoda, className: "from-sky-100 to-cyan-200 text-cyan-800" },
};

const FALLBACK = { icon: UtensilsCrossed, className: "from-pink-100 to-rose-200 text-rose-700" };

/** Illustrated dish tile (the mock data has no photos). */
export function FoodThumb({ category, className }: { category: string; className?: string }) {
  const { icon: Icon, className: palette } = THUMBS[category] ?? FALLBACK;
  return (
    <div
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br",
        palette,
        className,
      )}
    >
      <Icon className="size-1/2" strokeWidth={1.75} />
    </div>
  );
}
