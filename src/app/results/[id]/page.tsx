"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { Download, ArrowLeft, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { OverlayCanvas } from "@/components/results/OverlayCanvas";
import { DetectionList } from "@/components/results/DetectionList";
import { SummaryBar } from "@/components/results/SummaryBar";
import { getInspection } from "@/lib/db";
import { cn } from "@/lib/utils";
import type { Inspection } from "@/lib/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.38,
      delay: i * 0.08,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  }),
};

export default function ResultsPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [canvasRef, setCanvasRef] = useState<HTMLCanvasElement | null>(null);
  const [view, setView] = useState<"original" | "preprocessed">("original");

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
    // toBlob handles large images reliably; toDataURL can silently fail
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
      {/* ── Top bar ── */}
      <div className="mb-5 flex items-center justify-between gap-2">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          <span className="text-sm">New inspection</span>
        </button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          disabled={!canvasRef}
          aria-label="Download result as PNG"
          className="gap-1.5 border-brand/40 hover:bg-brand/10 text-brand hover:text-brand"
        >
          <Download className="size-3.5" />
          Download PNG
        </Button>
      </div>

      {/* ── Summary bar ── */}
      <motion.div
        className="mb-6"
        custom={0}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
      >
        <SummaryBar
          detections={inspection.detections}
          imageWidth={inspection.imageWidth}
          imageHeight={inspection.imageHeight}
          filename={inspection.filename}
        />
      </motion.div>

      {/* ── Main content: canvas + detection list ── */}
      <motion.div
        className="grid gap-6 lg:grid-cols-[1fr_320px]"
        custom={1}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
      >
        {/* Canvas frame */}
        <div>
          {/* View toggle — only shown when a preprocessed overlay is available */}
          <div className="mb-3 flex items-center gap-2">
            {inspection.preprocessedOverlay && (
              <div className="inline-flex rounded-lg border border-border/60 bg-muted/20 p-0.5">
                <button
                  onClick={() => setView("original")}
                  className={cn(
                    "rounded-md px-3 py-1 text-xs font-mono uppercase tracking-widest transition",
                    view === "original"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Original
                </button>
                <button
                  onClick={() => setView("preprocessed")}
                  className={cn(
                    "rounded-md px-3 py-1 text-xs font-mono uppercase tracking-widest transition",
                    view === "preprocessed"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Preprocessed
                </button>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border/50 overflow-hidden">
            {inspection.overlayImage ? (
              <OverlayCanvas
                imageBlob={
                  view === "preprocessed" && inspection.preprocessedOverlay
                    ? inspection.preprocessedOverlay
                    : inspection.overlayImage
                }
                onCanvasReady={setCanvasRef}
              />
            ) : (
              <Skeleton className="aspect-video w-full rounded-none" />
            )}
          </div>
        </div>

        {/* Detection sidebar */}
        <div className="flex flex-col gap-3">
          <h2 className="font-mono text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
            Detections&nbsp;({inspection.detections.length})
          </h2>
          <DetectionList detections={inspection.detections} />
        </div>
      </motion.div>
    </div>
  );
}
