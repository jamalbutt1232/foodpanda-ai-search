import { NextResponse } from "next/server";
import { jsonError, serverError } from "@/lib/api/errors";
import { getRestaurantBySlug, slugSchema } from "@/lib/data/restaurants";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const parsed = slugSchema.safeParse((await params).slug);
  if (!parsed.success) return jsonError("Invalid restaurant slug.", 400);

  try {
    const restaurant = await getRestaurantBySlug(parsed.data);
    if (!restaurant) return jsonError("Restaurant not found.", 404);
    return NextResponse.json(restaurant);
  } catch (error) {
    return serverError(`GET /api/restaurants/${parsed.data}`, error);
  }
}
