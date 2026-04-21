import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { Detection } from "@/lib/types";

interface DetectionListProps {
  detections: Detection[];
}

function scoreColor(score: number): string {
  if (score >= 0.7) return "text-green-600";
  if (score >= 0.4) return "text-amber-500";
  return "text-red-500";
}

function scoreBadgeClass(score: number): string {
  if (score >= 0.7) return "bg-green-100 text-green-700 border-green-200";
  if (score >= 0.4) return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-red-100 text-red-700 border-red-200";
}

export function DetectionList({ detections }: DetectionListProps) {
  if (detections.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-muted/30 p-8 text-center">
        <p className="font-medium text-foreground">No detections</p>
        <p className="text-sm text-muted-foreground">
          The model found no dents in this image above the confidence threshold.
        </p>
      </div>
    );
  }

  const sorted = [...detections].sort((a, b) => {
    // Dents first, then by score desc
    if (a.labelId !== b.labelId) return a.labelId - b.labelId;
    return b.score - a.score;
  });

  return (
    <div className="flex flex-col gap-0 rounded-xl border border-border overflow-hidden">
      {sorted.map((det, idx) => (
        <div key={idx}>
          {idx > 0 && <Separator />}
          <div className="flex items-center gap-3 px-4 py-3 bg-card">
            <div
              className={cn(
                "size-2.5 rounded-full shrink-0",
                det.labelId === 1 ? "bg-red-500" : "bg-amber-400"
              )}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium capitalize">
                {det.labelName.replace("_", " ")}
              </p>
              <p className="text-xs text-muted-foreground">
                [{det.box.map((v) => Math.round(v)).join(", ")}]
              </p>
            </div>
            <Badge
              variant="outline"
              className={cn(
                "text-xs font-semibold tabular-nums shrink-0",
                scoreBadgeClass(det.score)
              )}
            >
              {(det.score * 100).toFixed(0)}%
            </Badge>
            <span
              className={cn(
                "text-xs font-mono font-bold tabular-nums shrink-0",
                scoreColor(det.score)
              )}
            >
              {det.score.toFixed(3)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
