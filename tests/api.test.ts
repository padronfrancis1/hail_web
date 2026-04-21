import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { detectDents } from "@/lib/api";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeFile(name = "panel.png", size = 4): File {
  const bytes = new Uint8Array(size).fill(0xff);
  return new File([bytes], name, { type: "image/png" });
}

function makeRawResponse(overrides: Record<string, unknown> = {}) {
  return {
    image_width: 1920,
    image_height: 1080,
    num_detections: 1,
    detections: [
      {
        label_id: 1,
        label_name: "dent",
        score: 0.87,
        box: [100, 200, 300, 400] as [number, number, number, number],
        polygon: [
          [110, 210],
          [290, 210],
          [290, 390],
        ] as [number, number][],
      },
    ],
    ...overrides,
  };
}

function mockFetch(response: Response) {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));
}

function makeFetchResponse(
  body: unknown,
  status = 200,
  ok = true
): Response {
  return {
    ok,
    status,
    json: vi.fn().mockResolvedValue(body),
    text: vi.fn().mockResolvedValue(JSON.stringify(body)),
  } as unknown as Response;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("detectDents", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // --- FormData construction -------------------------------------------------

  it("posts to /api/detect", async () => {
    mockFetch(makeFetchResponse(makeRawResponse()));
    await detectDents(makeFile());

    const fetchMock = vi.mocked(fetch);
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/detect");
    expect(init.method).toBe("POST");
  });

  it("appends the image blob with a .jpg filename", async () => {
    mockFetch(makeFetchResponse(makeRawResponse()));
    await detectDents(makeFile("panel.png"));

    const fetchMock = vi.mocked(fetch);
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const form = init.body as FormData;
    const imageEntry = form.get("image") as File;
    expect(imageEntry).toBeInstanceOf(Blob);
    expect(imageEntry.name).toBe("panel.jpg");
  });

  it("sends preprocess=true by default", async () => {
    mockFetch(makeFetchResponse(makeRawResponse()));
    await detectDents(makeFile());

    const [, init] = (vi.mocked(fetch).mock.calls[0] as [string, RequestInit]);
    const form = init.body as FormData;
    expect(form.get("preprocess")).toBe("true");
  });

  it("sends caller-supplied preprocess=false", async () => {
    mockFetch(makeFetchResponse(makeRawResponse()));
    await detectDents(makeFile(), { preprocess: false });

    const [, init] = (vi.mocked(fetch).mock.calls[0] as [string, RequestInit]);
    const form = init.body as FormData;
    expect(form.get("preprocess")).toBe("false");
  });

  it("sends score_threshold=0.3 by default", async () => {
    mockFetch(makeFetchResponse(makeRawResponse()));
    await detectDents(makeFile());

    const [, init] = (vi.mocked(fetch).mock.calls[0] as [string, RequestInit]);
    const form = init.body as FormData;
    expect(form.get("score_threshold")).toBe("0.3");
  });

  it("sends caller-supplied score_threshold", async () => {
    mockFetch(makeFetchResponse(makeRawResponse()));
    await detectDents(makeFile(), { scoreThreshold: 0.55 });

    const [, init] = (vi.mocked(fetch).mock.calls[0] as [string, RequestInit]);
    const form = init.body as FormData;
    expect(form.get("score_threshold")).toBe("0.55");
  });

  it("always sends return_image=false", async () => {
    mockFetch(makeFetchResponse(makeRawResponse()));
    await detectDents(makeFile());

    const [, init] = (vi.mocked(fetch).mock.calls[0] as [string, RequestInit]);
    const form = init.body as FormData;
    expect(form.get("return_image")).toBe("false");
  });

  // --- Successful response parsing ------------------------------------------

  it("returns parsed DetectionResult on 2xx", async () => {
    mockFetch(makeFetchResponse(makeRawResponse()));
    const result = await detectDents(makeFile());

    expect(result.imageWidth).toBe(1920);
    expect(result.imageHeight).toBe(1080);
    expect(result.numDetections).toBe(1);
    expect(result.detections).toHaveLength(1);
  });

  it("maps raw snake_case detection fields to camelCase", async () => {
    mockFetch(makeFetchResponse(makeRawResponse()));
    const result = await detectDents(makeFile());
    const det = result.detections[0];

    expect(det.labelId).toBe(1);
    expect(det.labelName).toBe("dent");
    expect(det.score).toBe(0.87);
    expect(det.box).toEqual([100, 200, 300, 400]);
    expect(det.polygon).toHaveLength(3);
  });

  it("handles empty detections array", async () => {
    mockFetch(
      makeFetchResponse(makeRawResponse({ detections: [], num_detections: 0 }))
    );
    const result = await detectDents(makeFile());
    expect(result.detections).toEqual([]);
    expect(result.numDetections).toBe(0);
  });

  // --- Error handling --------------------------------------------------------

  it("throws with status code when upstream returns 500", async () => {
    mockFetch(makeFetchResponse("Internal Server Error", 500, false));
    await expect(detectDents(makeFile())).rejects.toThrow(/500/);
  });

  it("throws with status code when upstream returns 422", async () => {
    mockFetch(makeFetchResponse("Unprocessable Entity", 422, false));
    await expect(detectDents(makeFile())).rejects.toThrow(/422/);
  });

  it("includes upstream body text in the thrown error", async () => {
    const errResponse = {
      ok: false,
      status: 503,
      text: vi.fn().mockResolvedValue("Service Unavailable"),
      json: vi.fn(),
    } as unknown as Response;
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(errResponse));
    await expect(detectDents(makeFile())).rejects.toThrow(
      "Service Unavailable"
    );
  });

  it("throws an Error (not a raw value) on network failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("Failed to fetch"))
    );
    await expect(detectDents(makeFile())).rejects.toBeInstanceOf(Error);
  });

  it("re-throws AbortError when fetch is aborted", async () => {
    const abortErr = new DOMException("Aborted", "AbortError");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(abortErr));
    await expect(detectDents(makeFile())).rejects.toThrow("Aborted");
  });
});
