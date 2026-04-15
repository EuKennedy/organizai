import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number | null;
  onChange?: (value: number) => void;
  readonly?: boolean;
  size?: "sm" | "md";
}

export function StarRating({ value, onChange, readonly = false, size = "md" }: StarRatingProps) {
  const stars = [1, 2, 3, 4, 5];
  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5";

  return (
    <div className="flex gap-0.5">
      {stars.map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          className={cn(
            "transition-colors",
            readonly ? "cursor-default" : "cursor-pointer hover:text-yellow-400"
          )}
        >
          <Star
            className={cn(
              iconSize,
              star <= (value ?? 0) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"
            )}
          />
        </button>
      ))}
    </div>
  );
}
