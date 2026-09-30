import { artKeyForCuisine, FoodArt } from "@/components/shared/FoodArt";

/** Illustrated cover for a restaurant (no photos in the mock data). */
export function CuisineCover({ cuisine, className }: { cuisine: string; className?: string }) {
  return <FoodArt kind={artKeyForCuisine(cuisine)} variant="cover" className={className} />;
}
