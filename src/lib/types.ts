/** A single detected region: bounding box, polygon contour, class, and confidence score. */
export interface Detection {
  box: [number, number, number, number];
  labelId: 1 | 2;
  labelName: "dent" | "false_positive";
  score: number;
  polygon: [number, number][];
}

/** Parsed response from the /api/detect proxy: image dimensions plus all detections. */
export interface DetectionResult {
  imageWidth: number;
  imageHeight: number;
  numDetections: number;
  detections: Detection[];
  /** Base64-encoded grayscale JPEG from the server's preprocessing step. Only present when the backend returns it. */
  preprocessedImageB64?: string;
}

/** A completed inspection record as persisted to IndexedDB; Blobs are stored natively (not base64). */
export interface Inspection {
  id: string;
  createdAt: number;
  filename: string;
  imageWidth: number;
  imageHeight: number;
  originalImage: Blob;
  overlayImage: Blob;
  thumbnail: Blob;
  detections: Detection[];
  /** Overlay-annotated version of the grayscale preprocessed image. Optional: absent for older saved inspections. */
  preprocessedOverlay?: Blob;
}
