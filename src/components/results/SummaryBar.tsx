import type { Detection } from "@/lib/types";

interface SummaryBarProps {
  detections: Detection[];
  imageWidth: number;
  imageHeight: number;
  filename: string;
}

interface StatCellProps {
  value: string;
  label: string;
  accent?: boolean;
}

function StatCell({ value, label, accent = false }: StatCellProps) {
  return (
    <div className="flex flex-col gap-1 min-w-0">
      <span
        className={`font-mono text-2xl font-medium tabular-nums leading-none ${
          accent ? "text-brand" : "text-foreground"
        }`}
      >
        {value}
      </span>
      <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground whitespace-nowrap">
        {label}
      </span>
    </div>
  );
}

function Divider() {
  return (
    <div className="hidden h-10 w-px shrink-0 bg-border/60 sm:block" />
  );
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
    <div className="flex flex-wrap items-center gap-x-8 gap-y-4 rounded-2xl border border-border/50 bg-card/60 px-6 py-5">
      <StatCell
        value={String(dents.length)}
        label={dents.length === 1 ? "Dent detected" : "Dents detected"}
        accent={dents.length > 0}
      />

      <Divider />

      {dents.length > 0 && (
        <>
          <StatCell
            value={`${(avgConf * 100).toFixed(0)}%`}
            label="Avg confidence"
          />
          <Divider />
        </>
      )}

      {fps.length > 0 && (
        <>
          <StatCell value={String(fps.length)} label="False positive" />
          <Divider />
        </>
      )}

      <StatCell
        value={`${imageWidth} × ${imageHeight}`}
        label="Image dimensions"
      />

      {/* Filename pushed to right */}
      <div className="ml-auto min-w-0">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground truncate max-w-[200px]">
          {filename}
        </p>
      </div>
    </div>
  );
}
