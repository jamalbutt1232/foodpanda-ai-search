import { Area, connectDb } from "@/lib/db";
import { toAreaDTO } from "@/lib/data/mappers";
import type { AreaDTO } from "@/types/restaurant";

export async function getAreas(): Promise<AreaDTO[]> {
  await connectDb();
  const areas = await Area.find().sort({ name: 1 }).lean();
  return areas.map(toAreaDTO);
}
