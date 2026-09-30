"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type CategoryNavProps = {
  sections: { id: string; title: string }[];
};

/** Sticky menu tabs with a pink underline that follows the section in view. */
export function CategoryNav({ sections }: CategoryNavProps) {
  const [active, setActive] = useState(sections[0]?.id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) setActive(visible[0].target.id);
      },
      { rootMargin: "-130px 0px -60% 0px" },
    );
    for (const { id } of sections) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [sections]);

  return (
    <nav
      aria-label="Menu categories"
      className="sticky top-16 z-30 -mx-4 [scrollbar-width:none] overflow-x-auto border-b border-black/5 bg-white px-4 sm:-mx-6 sm:px-6"
    >
      <ul className="flex gap-6">
        {sections.map((section) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              onClick={() => setActive(section.id)}
              className={cn(
                "block border-b-3 py-3 text-sm font-bold whitespace-nowrap transition-colors",
                active === section.id
                  ? "border-brand text-brand"
                  : "border-transparent text-foreground/70 hover:text-foreground",
              )}
            >
              {section.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
