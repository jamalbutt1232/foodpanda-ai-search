import {
  CakeSlice,
  CookingPot,
  CupSoda,
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
  Wheat,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Art = { icon: LucideIcon; bg: string; ink: string };

/** One illustration per menu category (the mock data has no photos). */
const ART: Record<string, Art> = {
  burger: {
    icon: Hamburger,
    bg: "from-amber-300 via-orange-300 to-orange-400",
    ink: "text-orange-700",
  },
  sandwich: {
    icon: Sandwich,
    bg: "from-yellow-200 via-amber-200 to-amber-300",
    ink: "text-amber-800",
  },
  wrap: {
    icon: Sandwich,
    bg: "from-orange-200 via-amber-300 to-orange-300",
    ink: "text-orange-800",
  },
  pizza: { icon: Pizza, bg: "from-orange-300 via-red-300 to-red-400", ink: "text-red-700" },
  desi: {
    icon: CookingPot,
    bg: "from-amber-400 via-orange-400 to-red-400",
    ink: "text-orange-800",
  },
  bbq: { icon: Flame, bg: "from-orange-400 via-red-400 to-rose-500", ink: "text-red-700" },
  chinese: { icon: Soup, bg: "from-red-300 via-rose-300 to-rose-400", ink: "text-rose-700" },
  platter: {
    icon: UtensilsCrossed,
    bg: "from-stone-200 via-amber-200 to-amber-300",
    ink: "text-amber-900",
  },
  bowl: { icon: Salad, bg: "from-lime-200 via-green-300 to-emerald-300", ink: "text-green-800" },
  salad: {
    icon: Salad,
    bg: "from-lime-200 via-emerald-200 to-emerald-300",
    ink: "text-emerald-800",
  },
  soup: { icon: Soup, bg: "from-orange-200 via-amber-200 to-amber-300", ink: "text-amber-800" },
  wings: { icon: Drumstick, bg: "from-orange-300 via-orange-400 to-red-400", ink: "text-red-800" },
  fries: {
    icon: Popcorn,
    bg: "from-yellow-200 via-yellow-300 to-amber-300",
    ink: "text-amber-700",
  },
  sides: { icon: Popcorn, bg: "from-yellow-200 via-amber-200 to-amber-300", ink: "text-amber-800" },
  bread: { icon: Wheat, bg: "from-amber-200 via-yellow-200 to-amber-300", ink: "text-amber-800" },
  dessert: { icon: CakeSlice, bg: "from-pink-200 via-rose-200 to-pink-300", ink: "text-rose-600" },
  drink: { icon: CupSoda, bg: "from-sky-200 via-cyan-200 to-teal-200", ink: "text-cyan-700" },
  protein: {
    icon: Dumbbell,
    bg: "from-sky-200 via-indigo-200 to-indigo-300",
    ink: "text-indigo-700",
  },
};

const FALLBACK: Art = {
  icon: UtensilsCrossed,
  bg: "from-pink-200 via-rose-200 to-rose-300",
  ink: "text-rose-700",
};

// Restaurant cuisine → art key. First keyword match wins, so specific cuisines come first.
const CUISINE_ART: [keyword: string, key: string][] = [
  ["air-fried", "fries"],
  ["protein", "protein"],
  ["healthy", "salad"],
  ["pizza", "pizza"],
  ["burger", "burger"],
  ["chinese", "chinese"],
  ["shawarma", "wrap"],
  ["roll", "wrap"],
  ["sandwich", "sandwich"],
  ["cafe", "sandwich"],
  ["bbq", "bbq"],
  ["grill", "bbq"],
  ["desi", "desi"],
  ["fast food", "wings"],
];

export function artKeyForCuisine(cuisine: string): string {
  const c = cuisine.toLowerCase();
  return CUISINE_ART.find(([keyword]) => c.includes(keyword))?.[1] ?? "platter";
}

type FoodArtProps = {
  /** Menu category (or a key from artKeyForCuisine). */
  kind: string;
  className?: string;
  /** "cover" = wide restaurant banner; "tile" = square dish image. */
  variant?: "cover" | "tile";
};

/** Illustrated "plated dish": warm backdrop, white plate, food icon. */
export function FoodArt({ kind, className, variant = "tile" }: FoodArtProps) {
  const { icon: Icon, bg, ink } = ART[kind] ?? FALLBACK;
  const cover = variant === "cover";

  return (
    <div
      aria-hidden
      className={cn(
        "relative flex items-center justify-center overflow-hidden bg-gradient-to-br",
        bg,
        className,
      )}
    >
      {/* Soft light + scattered icons give the flat gradient some depth. */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.55),transparent_55%)]" />
      {cover && (
        <>
          <Icon className="absolute top-3 left-4 size-10 -rotate-12 text-white/35" />
          <Icon className="absolute right-5 bottom-3 size-12 rotate-12 text-white/35" />
          <Icon className="absolute top-4 right-16 size-7 rotate-6 text-white/30" />
        </>
      )}
      <div
        className={cn(
          "relative flex items-center justify-center rounded-full bg-white shadow-[0_8px_20px_rgba(0,0,0,0.18)] ring-4 ring-white/60",
          cover ? "size-24" : "size-[62%]",
        )}
      >
        <Icon className={cn(ink, cover ? "size-12" : "size-[55%]")} strokeWidth={1.75} />
      </div>
    </div>
  );
}
