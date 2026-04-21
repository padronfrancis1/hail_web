"use client";

import { useEffect, useRef, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface OverlayCanvasProps {
  /** Pre-rendered overlay image Blob (already has polygons drawn) */
  imageBlob: Blob;
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
}

export function OverlayCanvas({ imageBlob, onCanvasReady }: OverlayCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let url: string | null = null;

    async function render() {
      if (!canvasRef.current) return;
      url = URL.createObjectURL(imageBlob);
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0);
        setReady(true);
        onCanvasReady?.(canvas);
      };
      img.onerror = () => setReady(true);
      img.src = url;
    }

    render();
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
    // imageBlob identity is stable per inspection load — intentional dep
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageBlob]);

  return (
    <div className="relative w-full">
      {!ready && <Skeleton className="w-full aspect-video rounded-xl" />}
      <canvas
        ref={canvasRef}
        className="w-full rounded-xl border border-border shadow-sm"
        style={{ display: ready ? "block" : "none" }}
      />
    </div>
  );
}
