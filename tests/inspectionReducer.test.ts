/**
 * Pure-function tests for the reducer in src/context/InspectionContext.tsx.
 *
 * NOTE FOR CODE-WRITER: The reducer is currently unexported.
 * To make these tests compile, please add `export` to the reducer declaration:
 *
 *   export function reducer(state: State, action: Action): State { ... }
 *
 * No other source change is required.
 */
import { describe, it, expect } from "vitest";

// ---------------------------------------------------------------------------
// Types mirrored from InspectionContext.tsx — kept in sync manually.
// ---------------------------------------------------------------------------

type State =
  | { phase: "idle" }
  | { phase: "uploading"; file: File }
  | { phase: "loading"; file: File }
  | { phase: "done"; inspectionId: string }
  | { phase: "error"; message: string };

type Action =
  | { type: "UPLOAD_STARTED"; file: File }
  | { type: "INFERENCE_STARTED" }
  | { type: "INFERENCE_SUCCEEDED"; inspectionId: string }
  | { type: "INFERENCE_FAILED"; message: string }
  | { type: "RESET" };

// ---------------------------------------------------------------------------
// Import the reducer — this will fail to compile until it is exported.
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error  Remove this suppression once the reducer is exported.
import { reducer } from "@/context/InspectionContext";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const IDLE: State = { phase: "idle" };

function makeFile(name = "test.jpg"): File {
  return new File([new Uint8Array(4)], name, { type: "image/jpeg" });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("InspectionContext reducer", () => {

  // --- UPLOAD_STARTED -------------------------------------------------------

  it("UPLOAD_STARTED from idle → uploading with the file", () => {
    const file = makeFile();
    const next = reducer(IDLE, { type: "UPLOAD_STARTED", file }) as Extract<State, { phase: "uploading" }>;
    expect(next.phase).toBe("uploading");
    expect(next.file).toBe(file);
  });

  it("UPLOAD_STARTED from error → uploading (allows retry)", () => {
    const error: State = { phase: "error", message: "oops" };
    const file = makeFile();
    const next = reducer(error, { type: "UPLOAD_STARTED", file }) as Extract<State, { phase: "uploading" }>;
    expect(next.phase).toBe("uploading");
  });

  it("UPLOAD_STARTED from done → uploading (allows new inspection)", () => {
    const done: State = { phase: "done", inspectionId: "abc" };
    const file = makeFile();
    const next = reducer(done, { type: "UPLOAD_STARTED", file }) as Extract<State, { phase: "uploading" }>;
    expect(next.phase).toBe("uploading");
  });

  // --- INFERENCE_STARTED ---------------------------------------------------

  it("INFERENCE_STARTED from uploading → loading (carries file through)", () => {
    const file = makeFile();
    const uploading: State = { phase: "uploading", file };
    const next = reducer(uploading, { type: "INFERENCE_STARTED" }) as Extract<State, { phase: "loading" }>;
    expect(next.phase).toBe("loading");
    expect(next.file).toBe(file);
  });

  it("INFERENCE_STARTED from idle → no-ops (returns same idle state)", () => {
    const next = reducer(IDLE, { type: "INFERENCE_STARTED" });
    expect(next.phase).toBe("idle");
  });

  it("INFERENCE_STARTED from loading → no-ops", () => {
    const file = makeFile();
    const loading: State = { phase: "loading", file };
    const next = reducer(loading, { type: "INFERENCE_STARTED" }) as Extract<State, { phase: "loading" }>;
    expect(next.phase).toBe("loading");
  });

  it("INFERENCE_STARTED from done → no-ops", () => {
    const done: State = { phase: "done", inspectionId: "xyz" };
    const next = reducer(done, { type: "INFERENCE_STARTED" });
    expect(next.phase).toBe("done");
  });

  // --- INFERENCE_SUCCEEDED -------------------------------------------------

  it("INFERENCE_SUCCEEDED from loading → done with inspectionId", () => {
    const file = makeFile();
    const loading: State = { phase: "loading", file };
    const next = reducer(loading, {
      type: "INFERENCE_SUCCEEDED",
      inspectionId: "insp-123",
    }) as Extract<State, { phase: "done" }>;
    expect(next.phase).toBe("done");
    expect(next.inspectionId).toBe("insp-123");
  });

  it("INFERENCE_SUCCEEDED from idle → done (no guard in source; documents the behaviour)", () => {
    // The reducer has no guard on this transition; it always sets phase=done.
    // This test documents current behaviour so a regression is caught if the
    // guard is ever added intentionally.
    const next = reducer(IDLE, {
      type: "INFERENCE_SUCCEEDED",
      inspectionId: "insp-abc",
    }) as Extract<State, { phase: "done" }>;
    expect(next.phase).toBe("done");
  });

  // --- INFERENCE_FAILED ----------------------------------------------------

  it("INFERENCE_FAILED from loading → error with message", () => {
    const file = makeFile();
    const loading: State = { phase: "loading", file };
    const next = reducer(loading, {
      type: "INFERENCE_FAILED",
      message: "Network error",
    }) as Extract<State, { phase: "error" }>;
    expect(next.phase).toBe("error");
    expect(next.message).toBe("Network error");
  });

  it("INFERENCE_FAILED from uploading → error (matches source — no guard)", () => {
    const file = makeFile();
    const uploading: State = { phase: "uploading", file };
    const next = reducer(uploading, {
      type: "INFERENCE_FAILED",
      message: "Upload failed",
    }) as Extract<State, { phase: "error" }>;
    expect(next.phase).toBe("error");
    expect(next.message).toBe("Upload failed");
  });

  it("INFERENCE_FAILED from idle → error (documents no-guard behaviour)", () => {
    const next = reducer(IDLE, {
      type: "INFERENCE_FAILED",
      message: "Unexpected",
    }) as Extract<State, { phase: "error" }>;
    expect(next.phase).toBe("error");
  });

  // --- RESET ---------------------------------------------------------------

  it("RESET from uploading → idle", () => {
    const file = makeFile();
    const next = reducer({ phase: "uploading", file }, { type: "RESET" });
    expect(next.phase).toBe("idle");
  });

  it("RESET from loading → idle", () => {
    const file = makeFile();
    const next = reducer({ phase: "loading", file }, { type: "RESET" });
    expect(next.phase).toBe("idle");
  });

  it("RESET from done → idle", () => {
    const next = reducer({ phase: "done", inspectionId: "x" }, { type: "RESET" });
    expect(next.phase).toBe("idle");
  });

  it("RESET from error → idle", () => {
    const next = reducer({ phase: "error", message: "oops" }, { type: "RESET" });
    expect(next.phase).toBe("idle");
  });

  it("RESET from idle → idle (idempotent)", () => {
    const next = reducer(IDLE, { type: "RESET" });
    expect(next.phase).toBe("idle");
  });
});
