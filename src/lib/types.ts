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
}
