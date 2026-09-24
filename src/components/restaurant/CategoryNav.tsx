type CategoryNavProps = {
  sections: { id: string; title: string }[];
};

/** Horizontally scrollable jump links; sticks under the site header. */
export function CategoryNav({ sections }: CategoryNavProps) {
  return (
    <nav
      aria-label="Menu categories"
      className="sticky top-14 z-30 -mx-4 overflow-x-auto border-b bg-background/90 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6"
    >
      <ul className="flex gap-2">
        {sections.map((section) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              className="block rounded-full border px-3 py-1 text-sm whitespace-nowrap transition-colors hover:border-brand hover:text-brand"
            >
              {section.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
