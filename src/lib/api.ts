import type { DetectionResult, Detection } from "@/lib/types";

interface DetectOptions {
  preprocess?: boolean;
  scoreThreshold?: number;
}

interface RawDetection {
  label_id: 1 | 2;
  label_name: "dent" | "false_positive";
  score: number;
  box: [number, number, number, number];
  polygon: [number, number][];
}

interface RawDetectionResponse {
  image_width: number;
  image_height: number;
  num_detections: number;
  detections: RawDetection[];
}

/** Posts a JPEG to the internal /api/detect proxy and returns parsed detection results. */
export async function detectDents(
  file: File,
  opts: DetectOptions = {}
): Promise<DetectionResult> {
  const { preprocess = true, scoreThreshold = 0.3 } = opts;

  const form = new FormData();
  // Only JPEG is accepted; append directly without type-coercion
  const filename = file.name.replace(/\.[^.]+$/, "") + ".jpg";
  form.append("image", file, filename);
  form.append("preprocess", String(preprocess));
  form.append("score_threshold", String(scoreThreshold));
  form.append("return_image", "false");

  const res = await fetch("/api/detect", {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error");
    throw new Error(`Detection failed (${res.status}): ${text}`);
  }

  const raw: RawDetectionResponse = await res.json();

  const detections: Detection[] = raw.detections.map((d) => ({
    box: d.box,
    labelId: d.label_id,
    labelName: d.label_name,
    score: d.score,
    polygon: d.polygon,
  }));

  return {
    imageWidth: raw.image_width,
    imageHeight: raw.image_height,
    numDetections: raw.num_detections,
    detections,
  };
}
