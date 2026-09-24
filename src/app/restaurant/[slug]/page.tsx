import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { CategoryNav } from "@/components/restaurant/CategoryNav";
import { DealCard } from "@/components/restaurant/DealCard";
import { MenuSection } from "@/components/restaurant/MenuSection";
import { RestaurantHeader } from "@/components/restaurant/RestaurantHeader";
import { getRestaurantBySlug, slugSchema } from "@/lib/data/restaurants";
import { categoryLabel, compareCategories } from "@/lib/format/labels";
import type { MenuItemDTO } from "@/types/restaurant";

type RestaurantPageProps = {
  params: Promise<{ slug: string }>;
};

// Shared by generateMetadata and the page within one request.
const loadRestaurant = cache(async (slug: string) => {
  const parsed = slugSchema.safeParse(slug);
  return parsed.success ? getRestaurantBySlug(parsed.data) : null;
});

export async function generateMetadata({ params }: RestaurantPageProps): Promise<Metadata> {
  const restaurant = await loadRestaurant((await params).slug);
  return { title: restaurant?.name ?? "Restaurant not found" };
}

/** Groups by category in display order; available items first, then by price. */
function groupMenu(menu: MenuItemDTO[]) {
  const groups = new Map<string, MenuItemDTO[]>();
  for (const item of menu) {
    groups.set(item.category, [...(groups.get(item.category) ?? []), item]);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => compareCategories(a, b))
    .map(([category, items]) => ({
      id: `cat-${category}`,
      title: categoryLabel(category),
      items: items.sort(
        (a, b) => Number(b.isAvailable) - Number(a.isAvailable) || a.price - b.price,
      ),
    }));
}

export default async function RestaurantPage({ params }: RestaurantPageProps) {
  const restaurant = await loadRestaurant((await params).slug);
  if (!restaurant) notFound();

  const sections = groupMenu(restaurant.menu);
  const deals = [...restaurant.deals].sort((a, b) => Number(b.isAvailable) - Number(a.isAvailable));
  const navSections = [
    ...(deals.length > 0 ? [{ id: "deals", title: "Deals" }] : []),
    ...sections.map(({ id, title }) => ({ id, title })),
  ];

  return (
    <div className="space-y-6">
      <RestaurantHeader restaurant={restaurant} />
      <CategoryNav sections={navSections} />

      {deals.length > 0 && (
        <section id="deals" aria-labelledby="deals-title" className="scroll-mt-20">
          <h2 id="deals-title" className="mb-3 text-lg font-semibold">
            Deals{" "}
            <span className="text-sm font-normal text-muted-foreground">({deals.length})</span>
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {deals.map((deal) => (
              <li key={deal.id}>
                <DealCard deal={deal} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {sections.map((section) => (
        <MenuSection key={section.id} {...section} />
      ))}

      {sections.length === 0 && (
        <p className="py-10 text-center text-muted-foreground">
          This restaurant hasn&apos;t published a menu yet.
        </p>
      )}
    </div>
  );
}
