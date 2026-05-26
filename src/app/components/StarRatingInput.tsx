import { Star } from "lucide-react";
import { cn } from "./ui/utils";

interface StarRatingInputProps {
  disabled?: boolean;
  id?: string;
  onChange: (value: number) => void;
  value: number | null;
}

const MAX_STARS = 5;

function formatRating(value: number | null) {
  if (value == null) {
    return "Без оценки";
  }

  return `${value.toLocaleString("ru-RU")} из 5`;
}

export function StarRatingInput({
  disabled = false,
  id,
  onChange,
  value,
}: StarRatingInputProps) {
  return (
    <div id={id} className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-1" role="radiogroup" aria-label="Оценка за ДЗ">
        {Array.from({ length: MAX_STARS }, (_, index) => {
          const fill = Math.max(0, Math.min(1, (value || 0) - index));
          const starValue = index + 1;

          return (
            <button
              aria-label={`Поставить ${starValue} из 5`}
              className="group relative flex size-9 items-center justify-center rounded-full outline-none transition focus-visible:ring-2 focus-visible:ring-slate-300 disabled:pointer-events-none disabled:opacity-60"
              disabled={disabled}
              key={starValue}
              onClick={(event) => {
                const rect = event.currentTarget.getBoundingClientRect();
                const isLeftHalf = event.clientX - rect.left < rect.width / 2;
                onChange(index + (isLeftHalf ? 0.5 : 1));
              }}
              type="button"
            >
              <span className="relative flex size-7">
                <Star className="size-7 text-slate-300 transition group-hover:text-amber-300" />
                <span
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${fill * 100}%` }}
                >
                  <Star className="size-7 fill-amber-400 text-amber-400" />
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <span
        className={cn(
          "rounded-full px-3 py-1 text-sm font-medium",
          value == null ? "bg-slate-100 text-slate-500" : "bg-amber-100 text-amber-700",
        )}
      >
        {formatRating(value)}
      </span>
    </div>
  );
}
