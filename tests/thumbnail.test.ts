/**
 * Tests for src/lib/thumbnail.ts.
 *
 * jsdom's HTMLCanvasElement does not implement toBlob or getContext("2d"),
 * so we intercept document.createElement("canvas") calls and return a spy
 * canvas whose getContext returns a mock 2D context and whose toBlob calls
 * the callback synchronously with a fake Blob.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { generateThumbnail } from "@/lib/thumbnail";

// ---------------------------------------------------------------------------
// Capture the original document.createElement BEFORE any test spy touches it.
// makeSrcCanvas needs to create a real HTMLCanvasElement so that thumbnail.ts's
// `source instanceof HTMLCanvasElement` check passes.  If we call
// document.createElement("canvas") after a spy has been installed, we get the
// mock plain-object instead of a real DOM node, which makes instanceof fail.
// ---------------------------------------------------------------------------
const originalCreateElement = document.createElement.bind(document);

// ---------------------------------------------------------------------------
// Canvas mock factory — produces a plain-object stub used as the OUTPUT canvas
// inside generateThumbnail (created via document.createElement inside the lib).
// ---------------------------------------------------------------------------

function makeMockCanvas(
  width = 0,
  height = 0
): HTMLCanvasElement & { _lastToBlob?: Blob } {
  const mockCtx = {
    drawImage: vi.fn(),
    // other methods not called by thumbnail.ts
  };

  const canvas = {
    width,
    height,
    _lastToBlob: undefined as Blob | undefined,
    getContext: vi.fn().mockReturnValue(mockCtx),
    toBlob(
      this: typeof canvas,
      cb: (blob: Blob | null) => void,
      _type?: string,
      _quality?: number
    ) {
      const blob = new Blob(["thumbnail-bytes"], { type: "image/jpeg" });
      this._lastToBlob = blob;
      cb(blob);
    },
  } as unknown as HTMLCanvasElement & { _lastToBlob?: Blob };

  return canvas;
}

// We intercept document.createElement so that every "canvas" created inside
// thumbnail.ts gets our mock instead of the jsdom stub.
function patchCreateElement(
  _landscape: { w: number; h: number },
  onCreated?: (canvas: ReturnType<typeof makeMockCanvas>) => void
) {
  const canvases: ReturnType<typeof makeMockCanvas>[] = [];

  vi.spyOn(document, "createElement").mockImplementation(
    (tag: string, ...args: [ElementCreationOptions?]) => {
      if (tag === "canvas") {
        const mock = makeMockCanvas();
        canvases.push(mock);
        onCreated?.(mock);
        return mock as unknown as HTMLElement;
      }
      // For all other tags use the real implementation.
      return originalCreateElement(tag, ...args);
    }
  );
  return canvases;
}

// ---------------------------------------------------------------------------
// Build a source canvas with specific dimensions.
//
// We MUST return a real HTMLCanvasElement so that thumbnail.ts's
// `source instanceof HTMLCanvasElement` check is true.  We bypass any spy
// on document.createElement by using the captured original binding.
// ---------------------------------------------------------------------------

function makeSrcCanvas(w: number, h: number): HTMLCanvasElement {
  // Use the pre-spy binding so this always returns a genuine DOM element,
  // even when called after patchCreateElement() has installed a spy.
  const canvas = originalCreateElement("canvas") as HTMLCanvasElement;
  canvas.width = w;
  canvas.height = h;
  return canvas;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("generateThumbnail", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns a Blob", async () => {
    patchCreateElement({ w: 400, h: 300 });
    const src = makeSrcCanvas(400, 300);
    const result = await generateThumbnail(src);
    expect(result).toBeInstanceOf(Blob);
  });

  it("output canvas width is 200px (THUMBNAIL_WIDTH constant)", async () => {
    const createdCanvases: ReturnType<typeof makeMockCanvas>[] = [];
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      if (tag === "canvas") {
        const mock = makeMockCanvas();
        createdCanvases.push(mock);
        return mock as unknown as HTMLElement;
      }
      return originalCreateElement(tag);
    });

    const src = makeSrcCanvas(800, 600);
    await generateThumbnail(src);

    // The output canvas created inside generateThumbnail has width set to 200
    const outputCanvas = createdCanvases[0];
    expect(outputCanvas.width).toBe(200);
  });

  it("preserves aspect ratio for landscape input (800x600 → 200x150)", async () => {
    const createdCanvases: ReturnType<typeof makeMockCanvas>[] = [];
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      if (tag === "canvas") {
        const mock = makeMockCanvas();
        createdCanvases.push(mock);
        return mock as unknown as HTMLElement;
      }
      return originalCreateElement(tag);
    });

    const src = makeSrcCanvas(800, 600);
    await generateThumbnail(src);

    const outputCanvas = createdCanvases[0];
    // scale = 200/800 = 0.25 → height = 600 * 0.25 = 150
    expect(outputCanvas.height).toBe(150);
  });

  it("preserves aspect ratio for portrait input (400x800 → 200x400)", async () => {
    const createdCanvases: ReturnType<typeof makeMockCanvas>[] = [];
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      if (tag === "canvas") {
        const mock = makeMockCanvas();
        createdCanvases.push(mock);
        return mock as unknown as HTMLElement;
      }
      return originalCreateElement(tag);
    });

    const src = makeSrcCanvas(400, 800);
    await generateThumbnail(src);

    const outputCanvas = createdCanvases[0];
    // scale = 200/400 = 0.5 → height = 800 * 0.5 = 400
    expect(outputCanvas.height).toBe(400);
  });

  it("preserves aspect ratio for square input (300x300 → 200x200)", async () => {
    const createdCanvases: ReturnType<typeof makeMockCanvas>[] = [];
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      if (tag === "canvas") {
        const mock = makeMockCanvas();
        createdCanvases.push(mock);
        return mock as unknown as HTMLElement;
      }
      return originalCreateElement(tag);
    });

    const src = makeSrcCanvas(300, 300);
    await generateThumbnail(src);

    const outputCanvas = createdCanvases[0];
    expect(outputCanvas.width).toBe(200);
    expect(outputCanvas.height).toBe(200);
  });

  it("calls drawImage on the output context once", async () => {
    let outputCtx: { drawImage: ReturnType<typeof vi.fn> } | null = null;
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      if (tag === "canvas") {
        const ctx = { drawImage: vi.fn() };
        const mock = {
          width: 0,
          height: 0,
          getContext: vi.fn().mockReturnValue(ctx),
          toBlob: (cb: (b: Blob | null) => void) =>
            cb(new Blob(["x"], { type: "image/jpeg" })),
        } as unknown as HTMLElement;
        outputCtx = ctx;
        return mock;
      }
      return originalCreateElement(tag);
    });

    const src = makeSrcCanvas(400, 300);
    await generateThumbnail(src);

    expect(outputCtx!.drawImage).toHaveBeenCalledOnce();
  });

  it("throws when toBlob returns null", async () => {
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      if (tag === "canvas") {
        const ctx = { drawImage: vi.fn() };
        const mock = {
          width: 0,
          height: 0,
          getContext: vi.fn().mockReturnValue(ctx),
          toBlob: (cb: (b: Blob | null) => void) => cb(null),
        } as unknown as HTMLElement;
        return mock;
      }
      return originalCreateElement(tag);
    });

    const src = makeSrcCanvas(400, 300);
    await expect(generateThumbnail(src)).rejects.toThrow("toBlob returned null");
  });

  it("throws when getContext returns null", async () => {
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      if (tag === "canvas") {
        const mock = {
          width: 0,
          height: 0,
          getContext: vi.fn().mockReturnValue(null),
          toBlob: vi.fn(),
        } as unknown as HTMLElement;
        return mock;
      }
      return originalCreateElement(tag);
    });

    const src = makeSrcCanvas(400, 300);
    await expect(generateThumbnail(src)).rejects.toThrow(
      "Canvas 2D context unavailable"
    );
  });
});
