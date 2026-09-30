import { FoodArt } from "@/components/shared/FoodArt";
import { cn } from "@/lib/utils";

/** Square dish image for result cards and menu rows. */
export function FoodThumb({ category, className }: { category: string; className?: string }) {
  return <FoodArt kind={category} className={cn("shrink-0 rounded-xl", className)} />;
}
