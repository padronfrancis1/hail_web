"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CloudLightning } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { InspectionCard } from "@/components/history/InspectionCard";
import { listInspections } from "@/lib/db";
import type { Inspection } from "@/lib/types";

export function InspectionGrid() {
  const [inspections, setInspections] = useState<Inspection[] | null>(null);

  useEffect(() => {
    listInspections().then(setInspections);
  }, []);

  if (inspections === null) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="aspect-video w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (inspections.length === 0) {
    return (
      <div className="flex flex-col items-center gap-5 rounded-2xl border border-dashed border-border bg-muted/30 px-8 py-20 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
          <CloudLightning className="size-8 text-muted-foreground" />
        </div>
        <div>
          <p className="text-base font-semibold">No inspections yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload an image to run your first hail damage inspection.
          </p>
        </div>
        <Link href="/">
          <Button
            size="sm"
            className="bg-red-500 hover:bg-red-600 text-white border-transparent"
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
