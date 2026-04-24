"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { detectDents } from "@/lib/api";
import { saveInspection } from "@/lib/db";
import { drawOverlay } from "@/lib/overlay";
import { generateThumbnail } from "@/lib/thumbnail";
import type { Inspection } from "@/lib/types";

type State =
  | { phase: "idle" }
  | { phase: "uploading"; file: File }
  | { phase: "loading"; file: File }
  | { phase: "done"; inspectionId: string }
  | { phase: "error"; message: string };

type Action =
  | { type: "UPLOAD_STARTED"; file: File }
  | { type: "INFERENCE_STARTED" }
  | { type: "INFERENCE_SUCCEEDED"; inspectionId: string }
  | { type: "INFERENCE_FAILED"; message: string }
  | { type: "RESET" };

/** Pure state machine for the inspection lifecycle; exported for direct unit testing without a React tree. */
export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "UPLOAD_STARTED":
      return { phase: "uploading", file: action.file };
    case "INFERENCE_STARTED":
      if (state.phase !== "uploading") return state;
      return { phase: "loading", file: state.file };
    case "INFERENCE_SUCCEEDED":
      return { phase: "done", inspectionId: action.inspectionId };
    case "INFERENCE_FAILED":
      return { phase: "error", message: action.message };
    case "RESET":
      return { phase: "idle" };
    default:
      return state;
  }
}

interface InspectionContextValue {
  state: State;
  startInspection: (file: File) => Promise<void>;
  reset: () => void;
}

const InspectionContext = createContext<InspectionContextValue | null>(null);

export function InspectionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { phase: "idle" });
  const router = useRouter();

  const startInspection = useCallback(
    async (file: File) => {
      dispatch({ type: "UPLOAD_STARTED", file });

      let result;
      try {
        dispatch({ type: "INFERENCE_STARTED" });
        result = await detectDents(file);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Detection failed";
        dispatch({ type: "INFERENCE_FAILED", message });
        toast.error(message);
        return;
      }

      try {
        const id = crypto.randomUUID();

        // Build overlay canvas in-browser
        const originalUrl = URL.createObjectURL(file);
        const img = await loadImage(originalUrl);
        URL.revokeObjectURL(originalUrl);

        const overlayCanvas = document.createElement("canvas");
        drawOverlay(overlayCanvas, img, result.detections);

        // Build the preprocessed overlay in parallel with the primary blob + thumbnail
        const preprocessedOverlayPromise: Promise<Blob | undefined> = (async () => {
          if (!result.preprocessedImageB64) return undefined;
          const preBytes = base64ToBytes(result.preprocessedImageB64);
          const preBlob = new Blob([preBytes.buffer as ArrayBuffer], { type: "image/jpeg" });
          const preUrl = URL.createObjectURL(preBlob);
          try {
            const preImg = await loadImage(preUrl);
            const preCanvas = document.createElement("canvas");
            drawOverlay(preCanvas, preImg, result.detections);
            return await canvasToBlob(preCanvas);
          } finally {
            URL.revokeObjectURL(preUrl);
          }
        })();

        const [overlayBlob, thumbnail, preprocessedOverlayBlob] = await Promise.all([
          canvasToBlob(overlayCanvas),
          generateThumbnail(overlayCanvas),
          preprocessedOverlayPromise,
        ]);

        const inspection: Inspection = {
          id,
          createdAt: Date.now(),
          filename: file.name,
          imageWidth: result.imageWidth,
          imageHeight: result.imageHeight,
          originalImage: file,
          overlayImage: overlayBlob,
          thumbnail,
          detections: result.detections,
          preprocessedOverlay: preprocessedOverlayBlob,
        };

        await saveInspection(inspection);
        dispatch({ type: "INFERENCE_SUCCEEDED", inspectionId: id });
        router.push(`/results/${id}`);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to save inspection";
        dispatch({ type: "INFERENCE_FAILED", message });
        toast.error(message);
      }
    },
    [router]
  );

  const reset = useCallback(() => dispatch({ type: "RESET" }), []);

  return (
    <InspectionContext.Provider value={{ state, startInspection, reset }}>
      {children}
    </InspectionContext.Provider>
  );
}

export function useInspection(): InspectionContextValue {
  const ctx = useContext(InspectionContext);
  if (!ctx) throw new Error("useInspection must be used inside InspectionProvider");
  return ctx;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("toBlob returned null"))),
      "image/jpeg",
      0.92
    );
  });
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
