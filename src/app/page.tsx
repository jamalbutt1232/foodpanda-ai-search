import { Suspense } from "react";
import { BrowseSections } from "@/components/browse/BrowseSections";
import { SearchExperience } from "@/components/search/SearchExperience";
import { getAreas } from "@/lib/data/areas";
import { getAreaBrowse } from "@/lib/data/browse";

type HomePageProps = {
  searchParams: Promise<{ area?: string | string[] }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const { area: areaParam } = await searchParams;
  const requestedArea = Array.isArray(areaParam) ? areaParam[0] : areaParam;
  const [areas, browse] = await Promise.all([getAreas(), getAreaBrowse(requestedArea)]);
  const openCount = browse.restaurants.filter((r) => r.isOpen).length;

  return (
    <Suspense>
      <SearchExperience areas={areas} area={browse.area} restaurantCount={openCount}>
        <BrowseSections browse={browse} />
      </SearchExperience>
    </Suspense>
  );
}
