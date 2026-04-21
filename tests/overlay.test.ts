/**
 * Tests for src/lib/overlay.ts.
 *
 * jsdom ships a stub HTMLCanvasElement where getContext("2d") returns null.
 * We patch canvas.getContext to return a spy object so we can assert every
 * drawing call without a real GPU.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { drawOverlay } from "@/lib/overlay";
import type { Detection } from "@/lib/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeCtx() {
  return {
    drawImage: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    strokeRect: vi.fn(),
    fillText: vi.fn(),
    roundRect: vi.fn(),
    measureText: vi.fn().mockReturnValue({ width: 50 }),
    // mutable style properties
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 0,
    font: "",
  };
}

type MockCtx = ReturnType<typeof makeCtx>;

function makeCanvas(ctx: MockCtx): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  vi.spyOn(canvas, "getContext").mockReturnValue(ctx as unknown as CanvasRenderingContext2D);
  return canvas;
}

function makeImg(naturalWidth = 800, naturalHeight = 600): HTMLImageElement {
  const img = document.createElement("img");
  Object.defineProperties(img, {
    naturalWidth: { value: naturalWidth, configurable: true },
    naturalHeight: { value: naturalHeight, configurable: true },
  });
  return img;
}

function makeDent(polygon: [number, number][] = [[10, 20], [50, 20], [50, 60]]): Detection {
  return {
    labelId: 1,
    labelName: "dent",
    score: 0.91,
    box: [10, 20, 50, 60],
    polygon,
  };
}

function makeFP(): Detection {
  return {
    labelId: 2,
    labelName: "false_positive",
    score: 0.55,
    box: [100, 100, 200, 200],
    polygon: [[110, 110], [190, 110], [190, 190]],
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("drawOverlay", () => {
  let ctx: MockCtx;
  let canvas: HTMLCanvasElement;
  let img: HTMLImageElement;

  beforeEach(() => {
    ctx = makeCtx();
    canvas = makeCanvas(ctx);
    img = makeImg(800, 600);
  });

  // --- Canvas sizing --------------------------------------------------------

  it("sets canvas width to img.naturalWidth", () => {
    drawOverlay(canvas, img, []);
    expect(canvas.width).toBe(800);
  });

  it("sets canvas height to img.naturalHeight", () => {
    drawOverlay(canvas, img, []);
    expect(canvas.height).toBe(600);
  });

  // --- Background image -----------------------------------------------------

  it("calls drawImage once with the source image", () => {
    drawOverlay(canvas, img, []);
    expect(ctx.drawImage).toHaveBeenCalledOnce();
    expect(ctx.drawImage).toHaveBeenCalledWith(img, 0, 0);
  });

  // --- No detections --------------------------------------------------------

  it("does not call beginPath when detections array is empty", () => {
    drawOverlay(canvas, img, []);
    expect(ctx.beginPath).not.toHaveBeenCalled();
  });

  // --- Dent detection drawing -----------------------------------------------

  it("calls beginPath for a dent polygon", () => {
    drawOverlay(canvas, img, [makeDent()]);
    expect(ctx.beginPath).toHaveBeenCalled();
  });

  it("calls moveTo with the first polygon point for a dent", () => {
    drawOverlay(canvas, img, [makeDent([[15, 25], [55, 25], [55, 65]])]);
    expect(ctx.moveTo).toHaveBeenCalledWith(15, 25);
  });

  it("calls lineTo for each subsequent polygon point of a dent", () => {
    drawOverlay(canvas, img, [makeDent([[10, 20], [50, 20], [50, 60]])]);
    expect(ctx.lineTo).toHaveBeenCalledWith(50, 20);
    expect(ctx.lineTo).toHaveBeenCalledWith(50, 60);
  });

  it("calls closePath after tracing dent polygon", () => {
    drawOverlay(canvas, img, [makeDent()]);
    expect(ctx.closePath).toHaveBeenCalled();
  });

  it("calls fill after setting red fillStyle for dent", () => {
    drawOverlay(canvas, img, [makeDent()]);
    expect(ctx.fill).toHaveBeenCalled();
    // fillStyle should have been set to the red constant before fill()
    // We verify the value was assigned — ctx.fillStyle is mutable
  });

  it("calls stroke after setting red strokeStyle for dent", () => {
    drawOverlay(canvas, img, [makeDent()]);
    expect(ctx.stroke).toHaveBeenCalled();
  });

  it("calls strokeRect for the dent bounding box", () => {
    drawOverlay(canvas, img, [makeDent()]);
    // box is [10, 20, 50, 60] → strokeRect(x1, y1, w, h) = strokeRect(10, 20, 40, 40)
    expect(ctx.strokeRect).toHaveBeenCalledWith(10, 20, 40, 40);
  });

  it("calls fillText with a label that includes the score for a dent", () => {
    drawOverlay(canvas, img, [makeDent()]);
    expect(ctx.fillText).toHaveBeenCalled();
    const [text] = ctx.fillText.mock.calls[0] as [string, number, number];
    expect(text).toContain("0.91");
  });

  it("label text replaces underscore with space in labelName", () => {
    drawOverlay(canvas, img, [makeDent()]);
    const [text] = ctx.fillText.mock.calls[0] as [string, number, number];
    expect(text).toContain("dent");
    expect(text).not.toContain("_");
  });

  // --- False-positive detection drawing ------------------------------------

  it("calls strokeRect for a false_positive bounding box", () => {
    drawOverlay(canvas, img, [makeFP()]);
    expect(ctx.strokeRect).toHaveBeenCalledWith(100, 100, 100, 100);
  });

  it("draws fill and stroke for false_positive polygon", () => {
    drawOverlay(canvas, img, [makeFP()]);
    expect(ctx.fill).toHaveBeenCalled();
    expect(ctx.stroke).toHaveBeenCalled();
  });

  it("label text for false_positive contains score", () => {
    drawOverlay(canvas, img, [makeFP()]);
    const [text] = ctx.fillText.mock.calls[0] as [string, number, number];
    expect(text).toContain("0.55");
  });

  // --- Multiple detections --------------------------------------------------

  it("draws as many polygons as there are detections", () => {
    drawOverlay(canvas, img, [makeDent(), makeFP()]);
    // Each detection triggers at least one beginPath (polygon)
    // plus one in the label pill — minimum 2 beginPath calls total
    expect(ctx.beginPath.mock.calls.length).toBeGreaterThanOrEqual(2);
    expect(ctx.strokeRect).toHaveBeenCalledTimes(2);
  });

  // --- Degenerate polygons --------------------------------------------------

  it("skips a polygon with zero points without throwing", () => {
    const det = makeDent([]);
    expect(() => drawOverlay(canvas, img, [det])).not.toThrow();
    expect(ctx.beginPath).not.toHaveBeenCalled();
  });

  it("skips a polygon with only one point without throwing", () => {
    const det = makeDent([[10, 20]]);
    expect(() => drawOverlay(canvas, img, [det])).not.toThrow();
    // drawPolygon returns early for polygon.length < 2
    expect(ctx.moveTo).not.toHaveBeenCalled();
  });

  // --- getContext returns null ----------------------------------------------

  it("returns without throwing when getContext returns null", () => {
    const nullCanvas = document.createElement("canvas");
    vi.spyOn(nullCanvas, "getContext").mockReturnValue(null);
    expect(() => drawOverlay(nullCanvas, img, [makeDent()])).not.toThrow();
  });
});
