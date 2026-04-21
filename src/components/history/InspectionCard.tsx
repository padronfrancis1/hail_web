"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Inspection } from "@/lib/types";

interface InspectionCardProps {
  inspection: Inspection;
}

function formatDate(ts: number): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(ts));
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
    <Link href={`/results/${inspection.id}`} className="group block">
      <Card className="overflow-hidden transition-all group-hover:ring-2 group-hover:ring-red-400 group-hover:shadow-md cursor-pointer">
        <div className="aspect-video w-full overflow-hidden bg-muted">
          {thumbUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumbUrl}
              alt={inspection.filename}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <Skeleton className="h-full w-full rounded-none" />
          )}
        </div>
        <CardContent className="pt-3 pb-0">
          <p className="truncate text-sm font-medium">{inspection.filename}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {formatDate(inspection.createdAt)}
          </p>
        </CardContent>
        <CardFooter className="pt-3 pb-3 px-4 border-t-0 bg-transparent">
          <Badge
            variant={dentCount > 0 ? "destructive" : "secondary"}
            className={
              dentCount > 0
                ? "bg-red-100 text-red-700 border-red-200"
                : undefined
            }
          >
            {dentCount} {dentCount === 1 ? "dent" : "dents"}
          </Badge>
        </CardFooter>
      </Card>
    </Link>
  );
}
