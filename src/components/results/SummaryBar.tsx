import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { Detection } from "@/lib/types";

interface SummaryBarProps {
  detections: Detection[];
  imageWidth: number;
  imageHeight: number;
  filename: string;
}

export function SummaryBar({
  detections,
  imageWidth,
  imageHeight,
  filename,
}: SummaryBarProps) {
  const dents = detections.filter((d) => d.labelId === 1);
  const fps = detections.filter((d) => d.labelId === 2);
  const avgConf =
    dents.length > 0
      ? dents.reduce((sum, d) => sum + d.score, 0) / dents.length
      : 0;

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card px-5 py-4">
      <div className="flex flex-col">
        <span className="text-3xl font-bold text-foreground">
          {dents.length}
        </span>
        <span className="text-xs text-muted-foreground">
          {dents.length === 1 ? "dent" : "dents"} detected
        </span>
      </div>

      <Separator orientation="vertical" className="h-10 hidden sm:block" />

      {dents.length > 0 && (
        <>
          <div className="flex flex-col">
            <span className="text-xl font-semibold text-foreground">
              {(avgConf * 100).toFixed(0)}%
            </span>
            <span className="text-xs text-muted-foreground">avg confidence</span>
          </div>
          <Separator orientation="vertical" className="h-10 hidden sm:block" />
        </>
      )}

      {fps.length > 0 && (
        <>
          <div className="flex flex-col">
            <span className="text-xl font-semibold text-amber-500">
              {fps.length}
            </span>
            <span className="text-xs text-muted-foreground">false positive</span>
          </div>
          <Separator orientation="vertical" className="h-10 hidden sm:block" />
        </>
      )}

      <div className="flex flex-col">
        <span className="text-sm font-medium text-foreground">
          {imageWidth} × {imageHeight}
        </span>
        <span className="text-xs text-muted-foreground">image dimensions</span>
      </div>

      <div className="ml-auto flex flex-wrap gap-2">
        <Badge variant="outline" className="text-xs truncate max-w-[180px]">
          {filename}
        </Badge>
      </div>
    </div>
  );
}
