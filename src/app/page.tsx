import { Suspense } from "react";
import { BrowseSections } from "@/components/browse/BrowseSections";
import { SearchExperience } from "@/components/search/SearchExperience";
import { getAreaBrowse } from "@/lib/data/browse";

type HomePageProps = {
  searchParams: Promise<{ area?: string | string[] }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const { area: areaParam } = await searchParams;
  const requestedArea = Array.isArray(areaParam) ? areaParam[0] : areaParam;
  const browse = await getAreaBrowse(requestedArea);
  const openCount = browse.restaurants.filter((r) => r.isOpen).length;

  return (
    <Suspense>
      <SearchExperience area={browse.area} restaurantCount={openCount}>
        <BrowseSections browse={browse} />
      </SearchExperience>
    </Suspense>
  );
}
