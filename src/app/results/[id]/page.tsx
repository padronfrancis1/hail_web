"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { Download, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { OverlayCanvas } from "@/components/results/OverlayCanvas";
import { DetectionList } from "@/components/results/DetectionList";
import { SummaryBar } from "@/components/results/SummaryBar";
import { getInspection } from "@/lib/db";
import type { Inspection } from "@/lib/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ResultsPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [canvasRef, setCanvasRef] = useState<HTMLCanvasElement | null>(null);

  useEffect(() => {
    getInspection(id)
      .then((data) => {
        if (data) {
          setInspection(data);
        } else {
          setNotFound(true);
        }
      })
      .catch(() => setLoadError("Could not load this inspection"));
  }, [id]);

  const handleDownload = useCallback(() => {
    if (!canvasRef) return;
    // F9: toBlob handles large images reliably; toDataURL can silently fail
    canvasRef.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = `hail-result-${id.slice(0, 8)}.png`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  }, [canvasRef, id]);

  if (notFound) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-20">
        <p className="text-lg font-semibold">Inspection not found</p>
        <p className="text-sm text-muted-foreground">
          This result may have been cleared from local storage.
        </p>
        <Button variant="outline" onClick={() => router.push("/")}>
          Start a new inspection
        </Button>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-20">
        <p className="text-lg font-semibold">Could not load this inspection</p>
        <Button variant="outline" onClick={() => router.push("/")}>
          Start a new inspection
        </Button>
      </div>
    );
  }

  if (!inspection) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
      {/* Back + actions */}
      <div className="mb-4 flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5"
          onClick={() => router.push("/")}
        >
          <ArrowLeft className="size-3.5" />
          New Inspection
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={handleDownload}
          disabled={!canvasRef}
          aria-label="Download result as PNG"
        >
          <Download className="size-3.5" />
          Download PNG
        </Button>
      </div>

      {/* Summary */}
      <div className="mb-6">
        <SummaryBar
          detections={inspection.detections}
          imageWidth={inspection.imageWidth}
          imageHeight={inspection.imageHeight}
          filename={inspection.filename}
        />
      </div>

      {/* Main content: canvas + detection list */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          {inspection.overlayImage ? (
            <OverlayCanvas
              imageBlob={inspection.overlayImage}
              onCanvasReady={setCanvasRef}
            />
          ) : (
            <Skeleton className="aspect-video w-full rounded-xl" />
          )}
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Detections ({inspection.detections.length})
          </h2>
          <DetectionList detections={inspection.detections} />
        </div>
      </div>
    </div>
  );
}
