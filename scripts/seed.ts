/**
 * Loads data/foodpanda-ai-seed-data.json into MongoDB.
 * Idempotent: upserts every record by id/slug, and removes records that are no
 * longer in the file so the DB always mirrors the seed data. Search logs are untouched.
 *
 *   npm run seed
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { loadEnvConfig } from "@next/env";
import type { Model, QueryFilter } from "mongoose";
import { z } from "zod";
import { CALORIES_SOURCES, COOKING_METHODS } from "../src/lib/db/enums";

loadEnvConfig(process.cwd());

const DATA_PATH = path.join(process.cwd(), "data", "foodpanda-ai-seed-data.json");

const seedSchema = z.object({
  areas: z.array(z.object({ name: z.string(), slug: z.string(), city: z.string() })),
  restaurants: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      slug: z.string(),
      areaSlug: z.string(),
      cuisine: z.string(),
      rating: z.number().min(0).max(5),
      deliveryTimeMin: z.number().int().nonnegative(),
      deliveryFee: z.number().int().nonnegative(),
      isOpen: z.boolean(),
    }),
  ),
  menuItems: z.array(
    z.object({
      id: z.string(),
      restaurantId: z.string(),
      name: z.string(),
      description: z.string(),
      category: z.string(),
      price: z.number().int().nonnegative(),
      ingredients: z.array(z.string()),
      cookingMethod: z.enum(COOKING_METHODS),
      calories: z.number().int().nonnegative(),
      caloriesSource: z.enum(CALORIES_SOURCES),
      proteinGrams: z.number().int().nonnegative().nullable(),
      servesPeople: z.number().int().positive(),
      dietaryTags: z.array(z.string()),
      isAvailable: z.boolean(),
    }),
  ),
  deals: z.array(
    z.object({
      id: z.string(),
      restaurantId: z.string(),
      name: z.string(),
      description: z.string(),
      price: z.number().int().nonnegative(),
      servesPeople: z.number().int().positive(),
      isAvailable: z.boolean(),
    }),
  ),
  dealItems: z.array(
    z.object({ dealId: z.string(), menuItemId: z.string(), quantity: z.number().int().positive() }),
  ),
});

type SeedData = z.infer<typeof seedSchema>;

/** Fail loudly on dangling references rather than seeding inconsistent data. */
function checkReferences(data: SeedData): void {
  const errors: string[] = [];
  const areaSlugs = new Set(data.areas.map((a) => a.slug));
  const restaurantIds = new Set(data.restaurants.map((r) => r.id));
  const itemRestaurant = new Map(data.menuItems.map((m) => [m.id, m.restaurantId]));
  const dealRestaurant = new Map(data.deals.map((d) => [d.id, d.restaurantId]));

  for (const r of data.restaurants) {
    if (!areaSlugs.has(r.areaSlug)) errors.push(`restaurant ${r.id}: unknown area ${r.areaSlug}`);
  }
  for (const m of data.menuItems) {
    if (!restaurantIds.has(m.restaurantId)) errors.push(`item ${m.id}: unknown restaurant`);
  }
  for (const d of data.deals) {
    if (!restaurantIds.has(d.restaurantId)) errors.push(`deal ${d.id}: unknown restaurant`);
  }
  for (const di of data.dealItems) {
    const dealOwner = dealRestaurant.get(di.dealId);
    const itemOwner = itemRestaurant.get(di.menuItemId);
    if (!dealOwner) errors.push(`dealItem: unknown deal ${di.dealId}`);
    else if (!itemOwner) errors.push(`dealItem ${di.dealId}: unknown item ${di.menuItemId}`);
    else if (dealOwner !== itemOwner) {
      errors.push(`dealItem ${di.dealId}: item ${di.menuItemId} is from another restaurant`);
    }
  }
  const duplicates = (ids: string[]) => ids.filter((id, i) => ids.indexOf(id) !== i);
  for (const [label, ids] of [
    ["area slug", data.areas.map((a) => a.slug)],
    ["restaurant id", data.restaurants.map((r) => r.id)],
    ["restaurant slug", data.restaurants.map((r) => r.slug)],
    ["item id", data.menuItems.map((m) => m.id)],
    ["deal id", data.deals.map((d) => d.id)],
  ] as const) {
    for (const id of duplicates([...ids])) errors.push(`duplicate ${label}: ${id}`);
  }

  if (errors.length > 0) {
    throw new Error(`Seed data has ${errors.length} problem(s):\n  - ${errors.join("\n  - ")}`);
  }
}

/** Replace-or-insert every doc by _id, then delete docs that are no longer in the file. */
async function upsertAll<T extends { _id: string }>(
  label: string,
  model: Model<T>,
  docs: T[],
): Promise<void> {
  const result = await model.bulkWrite<Record<string, unknown>>(
    docs.map((doc) => ({
      replaceOne: { filter: { _id: doc._id }, replacement: doc, upsert: true },
    })),
  );
  const ids = docs.map((doc) => doc._id);
  const pruned = await model.deleteMany({ _id: { $nin: ids } } as QueryFilter<T>);
  await model.syncIndexes();
  console.log(
    `${label.padEnd(12)} ${String(docs.length).padStart(4)} in file · ` +
      `${result.upsertedCount} inserted · ${result.modifiedCount} updated · ` +
      `${pruned.deletedCount} removed`,
  );
}

async function main(): Promise<void> {
  const data = seedSchema.parse(JSON.parse(readFileSync(DATA_PATH, "utf8")));
  checkReferences(data);

  // Import after env is loaded (db modules read MONGODB_URI lazily, but keep it explicit).
  const { connectDb, disconnectDb, Area, Restaurant, MenuItem, Deal, SearchLog } =
    await import("../src/lib/db");
  await connectDb();

  const linesByDeal = new Map<string, { menuItemId: string; quantity: number }[]>();
  for (const { dealId, menuItemId, quantity } of data.dealItems) {
    const lines = linesByDeal.get(dealId) ?? [];
    lines.push({ menuItemId, quantity });
    linesByDeal.set(dealId, lines);
  }

  // Children after parents.
  await upsertAll(
    "areas",
    Area,
    data.areas.map((a) => ({ _id: a.slug, ...a })),
  );
  await upsertAll(
    "restaurants",
    Restaurant,
    data.restaurants.map(({ id, areaSlug, ...r }) => ({ _id: id, areaId: areaSlug, ...r })),
  );
  await upsertAll(
    "menuItems",
    MenuItem,
    data.menuItems.map(({ id, ...m }) => ({ _id: id, ...m })),
  );
  await upsertAll(
    "deals",
    Deal,
    data.deals.map(({ id, ...d }) => ({ _id: id, ...d, items: linesByDeal.get(id) ?? [] })),
  );
  await SearchLog.syncIndexes();

  await disconnectDb();
  console.log("Seed complete.");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
