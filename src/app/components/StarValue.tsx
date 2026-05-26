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
          ? "border-slate-200 bg-slate-50 text-slate-600"
          : "border-amber-200 bg-amber-50 text-amber-700"
      } ${className}`}
    >
      <Star
        className={`size-3.5 ${
          value == null || muted ? "text-slate-500" : "fill-amber-400 text-amber-500"
        }`}
      />
      {formatStars(value)}
    </span>
  );
}
