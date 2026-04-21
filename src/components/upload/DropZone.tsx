"use client";

import { useRef, useState, useCallback, type DragEvent, type ChangeEvent } from "react";
import { Upload, ImageIcon, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useInspection } from "@/context/InspectionContext";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/jpg"];
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
      return "Only JPEG and PNG images are supported.";
    }
    if (file.size > MAX_BYTES) {
      return `File is too large (max 20 MB). This file is ${(file.size / 1024 / 1024).toFixed(1)} MB.`;
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

  const handleClear = useCallback(() => {
    setSelectedFile(null);
    setPreview(null);
    setValidationError(null);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  if (preview && selectedFile) {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="relative overflow-hidden rounded-xl border border-border shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Preview"
            className="max-h-80 w-full object-contain bg-muted"
          />
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-sm">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="text-sm font-medium text-foreground">
                {state.phase === "uploading"
                  ? "Preparing image..."
                  : "Analyzing image… this usually takes 10–30 seconds"}
              </p>
            </div>
          )}
        </div>

        <p className="text-sm text-muted-foreground truncate max-w-xs">
          {selectedFile.name} &nbsp;·&nbsp;{" "}
          {(selectedFile.size / 1024 / 1024).toFixed(1)} MB
        </p>

        <div className="flex gap-3">
          <Button
            variant="outline"
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
            className="gap-2 bg-red-500 hover:bg-red-600 text-white border-transparent"
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
          "relative flex cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-12 transition-all",
          dragOver
            ? "border-red-500 bg-red-50"
            : "border-border hover:border-red-400 hover:bg-muted/50"
        )}
      >
        <div
          className={cn(
            "rounded-full p-4 transition-colors",
            dragOver ? "bg-red-100" : "bg-muted"
          )}
        >
          <Upload
            className={cn(
              "size-8 transition-colors",
              dragOver ? "text-red-500" : "text-muted-foreground"
            )}
          />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium">
            Drop your image here, or{" "}
            <span className="text-red-500 underline underline-offset-2">
              browse
            </span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            JPEG or PNG · max 20 MB
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png"
          className="sr-only"
          onChange={handleChange}
          aria-hidden
        />
      </div>

      {validationError && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          {validationError}
        </div>
      )}
    </div>
  );
}
