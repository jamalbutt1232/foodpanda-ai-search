"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Info, Search } from "lucide-react";
import { cn } from "@/lib/utils";

/** App-style bottom tab bar on phones. */
export function MobileNav() {
  const pathname = usePathname();

  const tabs = [
    { href: "/", label: "Home", icon: Home, active: pathname === "/" },
    { href: "/#search", label: "Search", icon: Search, active: false },
    { href: "/about", label: "How it works", icon: Info, active: pathname === "/about" },
  ];

  return (
    <nav
      aria-label="Bottom navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-black/5 bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_12px_rgba(0,0,0,0.06)] md:hidden"
    >
      <ul className="grid grid-cols-3">
        {tabs.map((tab) => (
          <li key={tab.label}>
            <Link
              href={tab.href}
              onClick={() => {
                if (tab.label === "Search") {
                  setTimeout(() => document.getElementById("search-input")?.focus(), 50);
                }
              }}
              className={cn(
                "flex flex-col items-center gap-0.5 py-2 text-[11px] font-bold",
                tab.active ? "text-brand" : "text-muted-foreground",
              )}
            >
              <tab.icon className="size-5" aria-hidden />
              {tab.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
