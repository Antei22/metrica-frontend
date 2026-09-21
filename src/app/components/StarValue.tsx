import { Star } from "lucide-react";
import { formatStars } from "../lib/homework";

interface StarValueProps {
  value: number | null | undefined;
  muted?: boolean;
  className?: string;
}

export function StarValue({ value, muted = false, className = "" }: StarValueProps) {
  return (
    <span
      className={`inline-flex h-7 items-center gap-1 rounded-full border px-3 text-xs font-semibold ${
        value == null || muted
          ? "border-border bg-canvas text-muted-foreground"
          : "border-warning/20 bg-warning-soft text-ink"
      } ${className}`}
    >
      <Star
        className={`size-3.5 ${
          value == null || muted ? "text-muted-foreground" : "fill-star text-star"
        }`}
      />
      {formatStars(value)}
    </span>
  );
}
