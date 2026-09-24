import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Brain,
  Calculator,
  Filter,
  ListOrdered,
  MessageSquareQuote,
  SearchX,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { EXAMPLE_QUERIES, searchHref } from "@/lib/examples";

export const metadata: Metadata = {
  title: "About",
  description: "Why AI-powered search would change food discovery.",
};

const STEPS: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Brain,
    title: "Understand",
    body: "An LLM turns the request into structured needs: dish, ingredients, calories, budget, people.",
  },
  {
    icon: Filter,
    title: "Filter",
    body: "The database narrows real menus in your area by price, calories, cooking method and exclusions.",
  },
  {
    icon: ListOrdered,
    title: "Rank",
    body: "AI ranks the shortlist, or code builds budget meal combos from real deals and items.",
  },
  {
    icon: MessageSquareQuote,
    title: "Explain",
    body: "Every result gets a one-line reason citing real facts: calories, protein, price, savings.",
  },
];

const PROBLEMS = [
  { query: "healthy", today: "Only finds dishes or restaurants literally named “healthy”." },
  { query: "300 calorie chicken sandwich", today: "No dish has that name, so: zero results." },
  {
    query: "dinner for 4 under Rs. 4,000",
    today: "Keyword search can't do maths or build a meal.",
  },
];

const GUARDRAILS = [
  "Only real dishes: IDs the AI returns are checked against the menu; anything else is dropped.",
  "Prices, totals, savings and per-person cost are calculated in code, never by the AI.",
  "Budgets are never exceeded, including the delivery fee.",
  "Reasons that quote a number not in the data are replaced with a factual one.",
  "If the AI is slow or down, search falls back to keyword results automatically.",
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-14 py-4">
      <section className="space-y-4 text-center">
        <p className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-sm font-medium text-brand">
          <Sparkles className="size-4" aria-hidden />
          Pitch prototype
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-5xl">
          Food search that understands what people actually want
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          Customers think in cravings, calories and budgets, not in dish names. AI search reads
          every menu in the area and answers the way a friend who knows the food scene would.
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Link
            href={searchHref(EXAMPLE_QUERIES[0].query, "gulberg", true)}
            className={buttonVariants({ size: "lg", className: "h-11 px-5" })}
          >
            See it side by side <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </section>

      <section aria-labelledby="problem-title" className="space-y-5">
        <h2 id="problem-title" className="text-2xl font-semibold tracking-tight">
          The problem with keyword search
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {PROBLEMS.map((p) => (
            <div key={p.query} className="rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
              <SearchX className="size-5 text-muted-foreground" aria-hidden />
              <p className="mt-3 font-medium">&ldquo;{p.query}&rdquo;</p>
              <p className="mt-1 text-sm text-muted-foreground">{p.today}</p>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="how-title" className="space-y-5">
        <h2 id="how-title" className="text-2xl font-semibold tracking-tight">
          How it works
        </h2>
        <ol className="grid gap-4 md:grid-cols-4">
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              className="relative rounded-2xl bg-brand-soft/50 p-5 ring-1 ring-brand/15"
            >
              <div className="flex items-center gap-2">
                <span className="flex size-9 items-center justify-center rounded-xl bg-brand text-white">
                  <step.icon className="size-5" aria-hidden />
                </span>
                <span className="text-sm font-semibold text-brand">Step {i + 1}</span>
              </div>
              <h3 className="mt-3 text-lg font-semibold">{step.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{step.body}</p>
              {i < STEPS.length - 1 && (
                <ArrowRight
                  aria-hidden
                  className="absolute top-1/2 -right-4 z-10 hidden size-5 -translate-y-1/2 rounded-full bg-background text-brand md:block"
                />
              )}
            </li>
          ))}
        </ol>
      </section>

      <section
        aria-labelledby="trust-title"
        className="grid gap-6 rounded-3xl bg-card p-6 ring-1 ring-foreground/10 md:grid-cols-[1fr_2fr] md:p-8"
      >
        <div>
          <ShieldCheck className="size-8 text-emerald-600" aria-hidden />
          <h2 id="trust-title" className="mt-3 text-2xl font-semibold tracking-tight">
            Built so it can&apos;t make things up
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            The AI understands and explains. Facts and money always come from the menu data.
          </p>
        </div>
        <ul className="space-y-3">
          {GUARDRAILS.map((g) => (
            <li key={g} className="flex gap-2.5 text-sm">
              <Calculator className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
              {g}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="try-title" className="space-y-5">
        <h2 id="try-title" className="text-2xl font-semibold tracking-tight">
          Try it
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {EXAMPLE_QUERIES.map((example) => (
            <Link
              key={example.label}
              href={searchHref(example.query, "gulberg", true)}
              className="group flex items-center justify-between gap-3 rounded-2xl bg-card p-4 ring-1 ring-foreground/10 transition-all hover:shadow-md hover:ring-brand/40"
            >
              <span className="font-medium">&ldquo;{example.label}&rdquo;</span>
              <ArrowRight
                className="size-4 shrink-0 text-brand transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
