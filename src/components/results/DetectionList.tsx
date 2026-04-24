import { cn } from "@/lib/utils";
import type { Detection } from "@/lib/types";

interface DetectionListProps {
  detections: Detection[];
}

/** Confidence dot color — high/mid/low */
function confidenceDotClass(score: number): string {
  if (score >= 0.7) return "bg-emerald-500";
  if (score >= 0.4) return "bg-amber-400";
  return "bg-brand";
}

/** Mono score badge color */
function scoreBadgeClass(score: number): string {
  if (score >= 0.7) return "text-emerald-400";
  if (score >= 0.4) return "text-amber-400";
  return "text-brand";
}

export function DetectionList({ detections }: DetectionListProps) {
  if (detections.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-border/50 bg-muted/20 p-8 text-center">
        <p className="font-medium text-foreground">No detections</p>
        <p className="text-sm text-muted-foreground">
          The model found no dents above the confidence threshold.
        </p>
      </div>
    );
  }

  const sorted = [...detections].sort((a, b) => {
    // Dents first, then by score descending
    if (a.labelId !== b.labelId) return a.labelId - b.labelId;
    return b.score - a.score;
  });

  return (
    <div className="flex flex-col rounded-2xl border border-border/50 overflow-hidden divide-y divide-border/40">
      {sorted.map((det, idx) => (
        <div
          key={`${det.labelId}-${det.box.join("-")}-${det.score}`}
          className={cn(
            "flex items-center gap-3 px-4 py-4 transition-colors duration-100",
            idx % 2 === 0 ? "bg-card/40" : "bg-card/20",
            "hover:bg-muted/40"
          )}
        >
          {/* Confidence dot */}
          <div
            className={cn(
              "size-2 rounded-full shrink-0",
              confidenceDotClass(det.score)
            )}
          />

          {/* Label + box coords */}
          <div className="flex-1 min-w-0">
            <p className="text-base font-medium capitalize leading-tight">
              {det.labelName.replace("_", " ")}
            </p>
            <p className="font-mono text-xs text-muted-foreground mt-1 truncate">
              [{det.box.map((v) => Math.round(v)).join(", ")}]
            </p>
          </div>

          {/* Mono score */}
          <span
            className={cn(
              "font-mono text-base font-semibold tabular-nums shrink-0",
              scoreBadgeClass(det.score)
            )}
          >
            {(det.score * 100).toFixed(0)}%
          </span>
        </div>
      ))}
    </div>
  );
}
