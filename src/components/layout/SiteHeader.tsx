import Link from "next/link";
import { Sparkles } from "lucide-react";

const NAV_LINKS = [
  { href: "/", label: "Search" },
  { href: "/about", label: "About" },
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex size-7 items-center justify-center rounded-lg bg-brand text-white">
            <Sparkles className="size-4" aria-hidden />
          </span>
          <span>
            AI Food Search
            <span className="ml-1.5 hidden text-sm font-normal text-muted-foreground sm:inline">
              Lahore
            </span>
          </span>
        </Link>
        <nav aria-label="Main" className="flex items-center gap-1 text-sm">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
