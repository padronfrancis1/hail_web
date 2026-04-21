import type { Detection } from "@/lib/types";

const DENT_FILL = "rgba(239, 68, 68, 0.35)";
const DENT_STROKE = "rgba(239, 68, 68, 1)";
const FP_FILL = "rgba(245, 158, 11, 0.25)";
const FP_STROKE = "rgba(245, 158, 11, 1)";

function drawPolygon(
  ctx: CanvasRenderingContext2D,
  polygon: [number, number][],
  fill: string,
  stroke: string
): void {
  if (polygon.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(polygon[0][0], polygon[0][1]);
  for (let i = 1; i < polygon.length; i++) {
    ctx.lineTo(polygon[i][0], polygon[i][1]);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawBox(
  ctx: CanvasRenderingContext2D,
  box: [number, number, number, number],
  stroke: string
): void {
  const [x1, y1, x2, y2] = box;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 2;
  ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
}

function drawLabel(
  ctx: CanvasRenderingContext2D,
  box: [number, number, number, number],
  text: string,
  bg: string
): void {
  const [x1, y1] = box;
  ctx.font = "bold 12px sans-serif";
  const metrics = ctx.measureText(text);
  const padX = 6;
  const padY = 3;
  const textH = 12;
  const pillW = metrics.width + padX * 2;
  const pillH = textH + padY * 2;
  const top = Math.max(0, y1 - pillH - 2);

  ctx.fillStyle = bg;
  ctx.beginPath();
  // Rounded pill
  const r = pillH / 2;
  ctx.roundRect(x1, top, pillW, pillH, r);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.fillText(text, x1 + padX, top + padY + textH - 1);
}

export function drawOverlay(
  canvas: HTMLCanvasElement,
  img: HTMLImageElement,
  detections: Detection[]
): void {
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.drawImage(img, 0, 0);

  for (const det of detections) {
    const isDent = det.labelId === 1;
    const fill = isDent ? DENT_FILL : FP_FILL;
    const stroke = isDent ? DENT_STROKE : FP_STROKE;

    drawPolygon(ctx, det.polygon, fill, stroke);
    drawBox(ctx, det.box, stroke);

    const label = `${det.labelName.replace("_", " ")} ${det.score.toFixed(2)}`;
    drawLabel(ctx, det.box, label, isDent ? "rgba(239,68,68,1)" : "rgba(245,158,11,1)");
  }
}
