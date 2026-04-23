"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import type { Inspection } from "@/lib/types";

interface InspectionCardProps {
  inspection: Inspection;
}

/** Short date like "APR 22" */
function formatShortDate(ts: number): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  })
    .format(new Date(ts))
    .toUpperCase();
}

export function InspectionCard({ inspection }: InspectionCardProps) {
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);
  const dentCount = inspection.detections.filter((d) => d.labelId === 1).length;

  useEffect(() => {
    const url = URL.createObjectURL(inspection.thumbnail);
    setThumbUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [inspection.thumbnail]);

  return (
    <Link
      href={`/results/${inspection.id}`}
      className="group block rounded-2xl border border-border/50 overflow-hidden bg-card/40 transition-all duration-200 hover:bg-card hover:border-brand/30 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_oklch(0_0_0_/_0.25)]"
    >
      {/* Thumbnail */}
      <div className="aspect-video w-full overflow-hidden bg-muted">
        {thumbUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbUrl}
            alt={inspection.filename}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <Skeleton className="h-full w-full rounded-none" />
        )}
      </div>

      {/* Card body */}
      <div className="px-4 pt-3 pb-4">
        <p className="truncate text-sm font-medium text-foreground">
          {inspection.filename}
        </p>

        {/* Stats row — mono numbers */}
        <div className="mt-1.5 flex items-center gap-2">
          <span className="font-mono text-xs font-medium text-brand">
            {dentCount} {dentCount === 1 ? "DENT" : "DENTS"}
          </span>
          <span className="text-border/80">·</span>
          <span className="font-mono text-[11px] text-muted-foreground">
            {formatShortDate(inspection.createdAt)}
          </span>
        </div>
      </div>

      {/* Hover-reveal "View" link */}
      <div className="px-4 pb-3 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
        <span className="font-mono text-[11px] uppercase tracking-widest text-brand">
          View&nbsp;→
        </span>
      </div>
    </Link>
  );
}
