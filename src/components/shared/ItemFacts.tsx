import { Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { COOKING_METHOD_LABELS, dietaryTagLabel } from "@/lib/format/labels";
import type { MenuItemDTO } from "@/types/restaurant";

type ItemFactsProps = Pick<
  MenuItemDTO,
  "calories" | "caloriesSource" | "proteinGrams" | "cookingMethod" | "dietaryTags"
>;

/** Calories (with AI-estimate flag), protein, cooking method and dietary tags. */
export function ItemFacts({
  calories,
  caloriesSource,
  proteinGrams,
  cookingMethod,
  dietaryTags,
}: ItemFactsProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
      <span className="inline-flex items-center gap-1 font-medium text-foreground">
        <Flame className="size-3.5 text-brand" aria-hidden />
        {calories} kcal
        {caloriesSource === "ai_estimate" && (
          <span
            className="rounded bg-muted px-1 py-px text-[10px] font-normal text-muted-foreground"
            title="Calories estimated by AI; not published by the restaurant"
          >
            AI estimate
          </span>
        )}
      </span>
      {proteinGrams !== null && (
        <span className="text-muted-foreground">{proteinGrams}g protein</span>
      )}
      <Badge variant="outline" className="font-normal">
        {COOKING_METHOD_LABELS[cookingMethod]}
      </Badge>
      {dietaryTags.map((tag) => (
        <Badge key={tag} variant="secondary" className="font-normal">
          {dietaryTagLabel(tag)}
        </Badge>
      ))}
    </div>
  );
}
