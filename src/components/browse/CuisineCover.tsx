import {
  Coffee,
  Drumstick,
  Dumbbell,
  Flame,
  Hamburger,
  Pizza,
  Popcorn,
  Salad,
  Sandwich,
  Soup,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type CoverStyle = { icon: LucideIcon; className: string };

// First keyword match wins, so more specific cuisines come first.
const COVERS: [keyword: string, style: CoverStyle][] = [
  ["air-fried", { icon: Popcorn, className: "from-lime-200 to-emerald-300 text-emerald-800" }],
  ["protein", { icon: Dumbbell, className: "from-sky-200 to-indigo-300 text-indigo-800" }],
  ["healthy", { icon: Salad, className: "from-lime-200 to-green-300 text-green-800" }],
  ["pizza", { icon: Pizza, className: "from-orange-200 to-red-300 text-red-800" }],
  ["burger", { icon: Hamburger, className: "from-amber-200 to-orange-300 text-orange-800" }],
  ["chinese", { icon: Soup, className: "from-red-200 to-rose-300 text-rose-800" }],
  ["shawarma", { icon: Sandwich, className: "from-yellow-200 to-amber-300 text-amber-800" }],
  ["roll", { icon: Sandwich, className: "from-yellow-200 to-amber-300 text-amber-800" }],
  ["sandwich", { icon: Sandwich, className: "from-stone-200 to-amber-200 text-amber-900" }],
  ["cafe", { icon: Coffee, className: "from-stone-200 to-orange-200 text-stone-800" }],
  ["bbq", { icon: Flame, className: "from-orange-300 to-red-400 text-red-900" }],
  ["grill", { icon: Flame, className: "from-orange-300 to-red-400 text-red-900" }],
  ["desi", { icon: UtensilsCrossed, className: "from-amber-300 to-orange-400 text-orange-900" }],
  ["fast food", { icon: Drumstick, className: "from-yellow-200 to-orange-300 text-orange-800" }],
];

const FALLBACK: CoverStyle = {
  icon: UtensilsCrossed,
  className: "from-pink-200 to-rose-300 text-rose-800",
};

function coverFor(cuisine: string): CoverStyle {
  const key = cuisine.toLowerCase();
  return COVERS.find(([keyword]) => key.includes(keyword))?.[1] ?? FALLBACK;
}

/** Illustrated cover for a restaurant card (no photos in the mock data). */
export function CuisineCover({ cuisine, className }: { cuisine: string; className?: string }) {
  const { icon: Icon, className: palette } = coverFor(cuisine);
  return (
    <div
      aria-hidden
      className={cn(
        "relative flex items-center justify-center overflow-hidden bg-gradient-to-br",
        palette,
        className,
      )}
    >
      <Icon className="absolute -top-3 -left-3 size-16 rotate-[-18deg] opacity-15" />
      <Icon className="absolute -right-4 -bottom-5 size-20 rotate-[14deg] opacity-15" />
      <Icon className="size-12 drop-shadow-sm" strokeWidth={1.75} />
    </div>
  );
}
