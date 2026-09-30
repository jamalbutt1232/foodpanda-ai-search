"use client";

import { ArrowRight, Hamburger, Pizza, Sparkles } from "lucide-react";

/** Pink promo banner (delivery-app style) that introduces AI search. */
export function PromoBanner({ onTry }: { onTry: () => void }) {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand to-[#ef3b83] px-5 py-6 text-white sm:px-8 sm:py-8">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 sm:block"
      >
        <div className="absolute top-1/2 right-10 flex size-40 -translate-y-1/2 items-center justify-center rounded-full bg-white/15">
          <div className="flex size-28 items-center justify-center rounded-full bg-white shadow-xl">
            <Hamburger className="size-14 text-brand" strokeWidth={1.75} />
          </div>
        </div>
        <Pizza className="absolute top-4 right-56 size-12 rotate-12 text-white/30" />
        <Sparkles className="absolute right-6 bottom-5 size-8 text-white/60" />
      </div>
      <div className="relative max-w-md space-y-2">
        <p className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-xs font-extrabold tracking-wide uppercase">
          <Sparkles className="size-3.5" aria-hidden />
          New: AI search
        </p>
        <h2 className="text-2xl leading-tight font-extrabold sm:text-3xl">
          Ask for food the way you&apos;d ask a friend
        </h2>
        <p className="text-sm text-white/90 sm:text-base">
          Calories, budgets, groups, &ldquo;not fried&rdquo;. It reads every menu in your area.
        </p>
        <button
          type="button"
          onClick={onTry}
          className="mt-2 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-extrabold text-brand shadow-md transition-transform hover:scale-[1.03]"
        >
          Try &ldquo;Dinner for 4 under Rs. 4,000&rdquo;
          <ArrowRight className="size-4" aria-hidden />
        </button>
      </div>
    </section>
  );
}
