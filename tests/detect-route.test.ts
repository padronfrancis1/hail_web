/**
 * Tests for src/app/api/detect/route.ts.
 *
 * The route module reads CLOUD_RUN_URL at module-load time (top-level const),
 * so we need vi.resetModules() + dynamic import after setting process.env to
 * change the env variable between tests.
 *
 * We mock the global fetch with vi.stubGlobal so the route's upstream call
 * is intercepted without any real network traffic.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type RouteModule = {
  POST: (req: NextRequest) => Promise<Response>;
};

async function loadRoute(cloudRunUrl: string | undefined): Promise<RouteModule> {
  vi.resetModules();
  if (cloudRunUrl !== undefined) {
    process.env.CLOUD_RUN_URL = cloudRunUrl;
  } else {
    delete process.env.CLOUD_RUN_URL;
  }
  return import("@/app/api/detect/route") as Promise<RouteModule>;
}

function makeNextRequest(formData?: FormData): NextRequest {
  const fd = formData ?? new FormData();
  fd.append("image", new Blob(["x"], { type: "image/jpeg" }), "test.jpg");
  return new NextRequest("http://localhost/api/detect", {
    method: "POST",
    body: fd,
  });
}

function makeUpstreamResponse(
  body: unknown,
  status = 200,
  ok = true
): Response {
  const text =
    typeof body === "string" ? body : JSON.stringify(body);
  return {
    ok,
    status,
    json: vi.fn().mockResolvedValue(body),
    text: vi.fn().mockResolvedValue(text),
  } as unknown as Response;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("POST /api/detect route", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  // --- Missing env variable -------------------------------------------------

  it("returns 500 when CLOUD_RUN_URL is not set", async () => {
    const { POST } = await loadRoute(undefined);
    const req = makeNextRequest();
    const res = await POST(req);
    expect(res.status).toBe(500);
  });

  it("returns error body when CLOUD_RUN_URL is not set", async () => {
    const { POST } = await loadRoute(undefined);
    const req = makeNextRequest();
    const res = await POST(req);
    const body = await res.json();
    expect(body).toHaveProperty("error");
    expect(body.error).toMatch(/CLOUD_RUN_URL/i);
  });

  // --- Successful proxy -----------------------------------------------------

  it("forwards request to upstream /detect endpoint and returns 200", async () => {
    const upstream = makeUpstreamResponse({ num_detections: 0, detections: [] });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(upstream));

    const { POST } = await loadRoute("https://fake-cloud.run");
    const req = makeNextRequest();
    const res = await POST(req);

    expect(res.status).toBe(200);
  });

  it("calls fetch with the upstream /detect URL", async () => {
    const upstream = makeUpstreamResponse({ detections: [] });
    const mockFetch = vi.fn().mockResolvedValue(upstream);
    vi.stubGlobal("fetch", mockFetch);

    const { POST } = await loadRoute("https://fake-cloud.run");
    const req = makeNextRequest();
    await POST(req);

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url] = mockFetch.mock.calls[0] as [string];
    expect(url).toBe("https://fake-cloud.run/detect");
  });

  it("calls upstream with POST method", async () => {
    const upstream = makeUpstreamResponse({ detections: [] });
    const mockFetch = vi.fn().mockResolvedValue(upstream);
    vi.stubGlobal("fetch", mockFetch);

    const { POST } = await loadRoute("https://fake-cloud.run");
    await POST(makeNextRequest());

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe("POST");
  });

  it("returns the upstream JSON payload on 2xx", async () => {
    const payload = { num_detections: 2, detections: [{ label_id: 1 }] };
    const upstream = makeUpstreamResponse(payload);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(upstream));

    const { POST } = await loadRoute("https://fake-cloud.run");
    const res = await POST(makeNextRequest());
    const body = await res.json();

    expect(body.num_detections).toBe(2);
  });

  // --- Upstream non-2xx ----------------------------------------------------

  it("forwards upstream 422 status when upstream returns 422", async () => {
    const upstream = makeUpstreamResponse("Unprocessable", 422, false);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(upstream));

    const { POST } = await loadRoute("https://fake-cloud.run");
    const res = await POST(makeNextRequest());

    expect(res.status).toBe(422);
  });

  it("forwards upstream 503 status when upstream returns 503", async () => {
    const upstream = makeUpstreamResponse("Service Unavailable", 503, false);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(upstream));

    const { POST } = await loadRoute("https://fake-cloud.run");
    const res = await POST(makeNextRequest());

    expect(res.status).toBe(503);
  });

  it("includes upstream status in error body on non-2xx", async () => {
    const upstream = makeUpstreamResponse("Bad Request", 400, false);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(upstream));

    const { POST } = await loadRoute("https://fake-cloud.run");
    const res = await POST(makeNextRequest());
    const body = await res.json();

    expect(body).toHaveProperty("error");
    expect(body.error).toMatch(/400/);
  });

  // --- Timeout / network errors --------------------------------------------

  it("returns 504 when upstream fetch is aborted", async () => {
    // In the jsdom test environment, DOMException does not extend the native
    // Error class, so `err instanceof Error` is false and the route's AbortError
    // branch is never reached when using `new DOMException(...)`.  We simulate
    // the abort by throwing a plain Error whose .name is "AbortError", which is
    // exactly what the route handler checks.
    const abortErr = Object.assign(new Error("signal timed out"), {
      name: "AbortError",
    });
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(abortErr));

    const { POST } = await loadRoute("https://fake-cloud.run");
    const res = await POST(makeNextRequest());

    expect(res.status).toBe(504);
  });

  it("returns error body with timeout message on AbortError", async () => {
    const abortErr = Object.assign(new Error("signal timed out"), {
      name: "AbortError",
    });
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(abortErr));

    const { POST } = await loadRoute("https://fake-cloud.run");
    const res = await POST(makeNextRequest());
    const body = await res.json();

    expect(body.error).toMatch(/timed out/i);
  });

  it("returns 502 on generic network error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("Failed to fetch"))
    );

    const { POST } = await loadRoute("https://fake-cloud.run");
    const res = await POST(makeNextRequest());

    expect(res.status).toBe(502);
  });

  it("returns error body on generic network error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("Failed to fetch"))
    );

    const { POST } = await loadRoute("https://fake-cloud.run");
    const res = await POST(makeNextRequest());
    const body = await res.json();

    expect(body).toHaveProperty("error");
  });
});
