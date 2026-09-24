"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function RestaurantError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Couldn&apos;t load this restaurant</h1>
      <p className="mt-2 text-muted-foreground">
        Something went wrong while loading the menu. Please try again.
      </p>
      <Button className="mt-6" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
