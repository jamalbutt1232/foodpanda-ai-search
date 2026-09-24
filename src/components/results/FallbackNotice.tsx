import { Info, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

type NoticeProps = {
  message: string;
  tone?: "info" | "warning";
};

/** Subtle banner: "warning" for the AI fallback, "info" for relaxed filters or no-fit budgets. */
export function FallbackNotice({ message, tone = "warning" }: NoticeProps) {
  const Icon = tone === "warning" ? TriangleAlert : Info;
  return (
    <p
      role="status"
      className={cn(
        "flex items-start gap-2 rounded-lg px-3 py-2 text-sm",
        tone === "warning" ? "bg-amber-50 text-amber-900" : "bg-sky-50 text-sky-900",
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      {message}
    </p>
  );
}
