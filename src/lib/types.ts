export interface Detection {
  box: [number, number, number, number];
  labelId: 1 | 2;
  labelName: "dent" | "false_positive";
  score: number;
  polygon: [number, number][];
}

export interface DetectionResult {
  imageWidth: number;
  imageHeight: number;
  numDetections: number;
  detections: Detection[];
}

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
