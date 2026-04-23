"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Scan } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { InspectionCard } from "@/components/history/InspectionCard";
import { listInspections } from "@/lib/db";
import type { Inspection } from "@/lib/types";

export function InspectionGrid() {
  const [inspections, setInspections] = useState<Inspection[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    listInspections()
      .then(setInspections)
      .catch(() => setLoadError("Could not load inspections"));
  }, []);

  if (loadError) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-6 text-center text-sm text-destructive">
        {loadError}
      </div>
    );
  }

  if (inspections === null) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="aspect-video w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  if (inspections.length === 0) {
    return (
      <div className="flex flex-col items-center gap-5 rounded-2xl border border-dashed border-border/50 bg-card/20 px-8 py-20 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl border border-border/50 bg-muted/40">
          <Scan className="size-7 text-muted-foreground" />
        </div>
        <div>
          <p className="text-base font-medium text-foreground">
            No inspections yet
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload an image to run your first hail damage inspection.
          </p>
        </div>
        <Link href="/">
          <Button
            size="sm"
            className="bg-brand hover:bg-brand/90 text-brand-foreground border-transparent"
          >
            Start an inspection
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
      {inspections.map((inspection) => (
        <InspectionCard key={inspection.id} inspection={inspection} />
      ))}
    </div>
  );
}
