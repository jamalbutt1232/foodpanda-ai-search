import { NextResponse } from "next/server";
import { serverError } from "@/lib/api/errors";
import { getAreas } from "@/lib/data/areas";

export async function GET() {
  try {
    return NextResponse.json(await getAreas());
  } catch (error) {
    return serverError("GET /api/areas", error);
  }
}
