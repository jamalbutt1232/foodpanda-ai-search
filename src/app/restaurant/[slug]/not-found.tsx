import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function RestaurantNotFound() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Restaurant not found</h1>
      <p className="mt-2 text-muted-foreground">
        We couldn&apos;t find that restaurant. It may have moved or the link is wrong.
      </p>
      <Link href="/" className={buttonVariants({ className: "mt-6" })}>
        Back to search
      </Link>
    </div>
  );
}
