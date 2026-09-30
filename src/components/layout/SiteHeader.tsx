import Link from "next/link";
import { Suspense } from "react";
import { Sparkles } from "lucide-react";
import { AreaSelector } from "@/components/search/AreaSelector";
import { getAreas } from "@/lib/data/areas";
import type { AreaDTO } from "@/types/restaurant";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "How it works" },
] as const;

async function loadAreas(): Promise<AreaDTO[]> {
  try {
    return await getAreas();
  } catch {
    return []; // DB down: header still renders; pages show their own errors.
  }
}

export async function SiteHeader() {
  const areas = await loadAreas();

  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-white shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-3 px-4 sm:gap-6 sm:px-6">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2"
          aria-label="AI Food Search home"
        >
          <span className="flex size-9 items-center justify-center rounded-full bg-brand text-white">
            <Sparkles className="size-5" aria-hidden />
          </span>
          <span className="hidden text-xl leading-none font-extrabold tracking-tight text-brand sm:inline">
            aifood<span className="text-foreground">search</span>
          </span>
        </Link>

        {areas.length > 0 && (
          <Suspense fallback={<div className="h-10 w-44" />}>
            <AreaSelector areas={areas} />
          </Suspense>
        )}

        <nav aria-label="Main" className="ml-auto hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-4 py-2 text-sm font-bold text-foreground/80 transition-colors hover:bg-brand-soft hover:text-brand"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
