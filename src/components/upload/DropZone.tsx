"use client";

import {
  useRef,
  useState,
  useCallback,
  useEffect,
  type DragEvent,
  type ChangeEvent,
} from "react";
import { Upload, ImageIcon, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useInspection } from "@/context/InspectionContext";

const ACCEPTED_TYPES = ["image/jpeg"];
const MAX_BYTES = 20 * 1024 * 1024; // 20 MB

export function DropZone() {
  const { state, startInspection } = useInspection();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const isLoading =
    state.phase === "uploading" || state.phase === "loading";

  function validateFile(file: File): string | null {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return "Only JPEG images are supported.";
    }
    if (file.size > MAX_BYTES) {
      return `File is too large (max 20 MB). This file is ${(
        file.size /
        1024 /
        1024
      ).toFixed(1)} MB.`;
    }
    return null;
  }

  const handleFile = useCallback((file: File) => {
    const error = validateFile(file);
    if (error) {
      setValidationError(error);
      return;
    }
    setValidationError(null);
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreview(url);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleAnalyze = useCallback(async () => {
    if (!selectedFile) return;
    await startInspection(selectedFile);
  }, [selectedFile, startInspection]);

  // Revoke object URL on unmount or when preview changes
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview]
  );

  const handleClear = useCallback(() => {
    if (preview) URL.revokeObjectURL(preview);
    setSelectedFile(null);
    setPreview(null);
    setValidationError(null);
    if (inputRef.current) inputRef.current.value = "";
  }, [preview]);

  /* ── Preview state ── */
  if (preview && selectedFile) {
    return (
      <div className="flex flex-col items-center gap-5">
        {/* Image frame */}
        <div className="relative w-full overflow-hidden rounded-2xl border border-border/60 shadow-[0_8px_32px_oklch(0_0_0_/_0.3)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Preview"
            className="max-h-96 w-full object-contain bg-muted"
          />
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/85 backdrop-blur-md">
              {/* Shimmer bar */}
              <div className="h-px w-32 overflow-hidden rounded-full bg-border">
                <div className="h-full w-1/2 animate-[shimmer_1.2s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-brand/60 to-transparent" />
              </div>
              <Loader2 className="size-7 animate-spin text-brand" />
              <p className="font-mono text-xs font-medium uppercase tracking-widest text-muted-foreground">
                {state.phase === "uploading"
                  ? "Preparing image…"
                  : "Analyzing — usually 10–30 s"}
              </p>
            </div>
          )}
        </div>

        {/* File meta */}
        <p className="font-mono text-xs text-muted-foreground truncate max-w-xs uppercase tracking-wider">
          {selectedFile.name}&nbsp;·&nbsp;
          {(selectedFile.size / 1024 / 1024).toFixed(1)} MB
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            disabled={isLoading}
          >
            Choose another
          </Button>
          <Button
            size="sm"
            onClick={handleAnalyze}
            disabled={isLoading}
            className="gap-2 bg-brand hover:bg-brand/90 text-brand-foreground border-transparent"
          >
            {isLoading ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Analyzing…
              </>
            ) : (
              <>
                <ImageIcon className="size-3.5" />
                Start Analysis
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  /* ── Drop zone idle state ── */
  return (
    <div className="flex flex-col gap-3">
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload image"
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        className={cn(
          "relative flex cursor-pointer flex-col items-center justify-center gap-5 rounded-3xl border-2 border-dashed p-16 transition-all duration-200",
          dragOver
            ? "border-brand/60 bg-brand/5"
            : "border-border/50 hover:border-brand/40 hover:bg-brand/[0.03]"
        )}
      >
        {/* Upload icon in gradient-bordered circle */}
        <div
          className={cn(
            "flex size-16 items-center justify-center rounded-full transition-colors duration-200",
            dragOver
              ? "bg-brand/10 ring-2 ring-brand/30"
              : "bg-muted/60 ring-1 ring-border/60"
          )}
        >
          <Upload
            className={cn(
              "size-7 transition-colors duration-200",
              dragOver ? "text-brand" : "text-muted-foreground"
            )}
          />
        </div>

        <div className="text-center">
          <p className="text-sm font-medium text-foreground">
            Drop your image here, or{" "}
            <span className="text-brand font-medium">browse</span>
          </p>
          <p className="mt-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            JPEG&nbsp;·&nbsp;MAX 20 MB
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg"
          className="sr-only"
          onChange={handleChange}
          aria-hidden
        />
      </div>

      {validationError && (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          {validationError}
        </div>
      )}
    </div>
  );
}
