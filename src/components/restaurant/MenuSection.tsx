import { MenuItemRow } from "@/components/restaurant/MenuItemRow";
import type { MenuItemDTO } from "@/types/restaurant";

type MenuSectionProps = {
  id: string;
  title: string;
  items: MenuItemDTO[];
};

export function MenuSection({ id, title, items }: MenuSectionProps) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-20">
      <h2 id={`${id}-title`} className="mb-3 text-lg font-semibold">
        {title} <span className="text-sm font-normal text-muted-foreground">({items.length})</span>
      </h2>
      <ul className="grid gap-3 md:grid-cols-2">
        {items.map((item) => (
          <MenuItemRow key={item.id} item={item} />
        ))}
      </ul>
    </section>
  );
}
