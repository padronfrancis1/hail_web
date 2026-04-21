import { NextRequest, NextResponse } from "next/server";

const CLOUD_RUN_URL = process.env.CLOUD_RUN_URL;

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!CLOUD_RUN_URL) {
    return NextResponse.json(
      { error: "CLOUD_RUN_URL is not configured" },
      { status: 500 }
    );
  }

  // F2: Reject oversized bodies before parsing FormData
  const contentLength = Number(req.headers.get("content-length") ?? 0);
  if (contentLength > 22_000_000) {
    return NextResponse.json({ error: "Image too large" }, { status: 413 });
  }

  const formData = await req.formData();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 125_000);

  try {
    // F3: content-type is intentionally NOT forwarded — undici re-serializes FormData with a fresh multipart boundary, so forwarding the original boundary would corrupt the request.
    const upstream = await fetch(`${CLOUD_RUN_URL}/detect`, {
      method: "POST",
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!upstream.ok) {
      const text = await upstream.text().catch(() => "Upstream error");
      // F8: Truncate upstream error body to avoid leaking large responses
      return NextResponse.json(
        { error: `Upstream error (${upstream.status}): ${text.slice(0, 200)}` },
        { status: upstream.status }
      );
    }

    const data: unknown = await upstream.json();
    return NextResponse.json(data);
  } catch (err) {
    clearTimeout(timeout);
    if (err instanceof Error && err.name === "AbortError") {
      return NextResponse.json(
        { error: "Upstream request timed out after 125 seconds" },
        { status: 504 }
      );
    }
    const message = err instanceof Error ? err.message : "Proxy error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
