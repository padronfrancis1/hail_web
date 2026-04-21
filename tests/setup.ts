// Polyfill IndexedDB with fake-indexeddb so db.ts tests work without a real browser.
import "fake-indexeddb/auto";

// Reset the fake IndexedDB between tests so stores don't bleed across test files.
import { beforeEach } from "vitest";
import { IDBFactory } from "fake-indexeddb";

// Each test gets a completely fresh IDBFactory instance so previously-saved
// records do not bleed into subsequent tests.  Using the same instance and
// re-assigning it to globalThis would still expose the same underlying DB
// state; a new IDBFactory() is the only way to guarantee isolation.
beforeEach(() => {
  (globalThis as Record<string, unknown>).indexedDB = new IDBFactory();
});

// ---------------------------------------------------------------------------
// structuredClone patch
//
// jsdom's Blob is not serialisable by Node's native structuredClone, so
// fake-indexeddb (which calls structuredClone internally) stores Blobs as
// plain empty objects {}.  We patch globalThis.structuredClone to pass Blob
// instances through directly (Blobs are immutable, so sharing the reference
// is safe in a test context) and to recurse into plain objects/arrays.
// ---------------------------------------------------------------------------

type Cloneable = unknown;

function blobAwareClone<T extends Cloneable>(value: T): T {
  if (value instanceof Blob) {
    // Blobs are immutable — pass through the reference rather than cloning.
    return value as T;
  }
  if (Array.isArray(value)) {
    return (value as unknown[]).map((v) => blobAwareClone(v)) as unknown as T;
  }
  if (value !== null && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      result[k] = blobAwareClone(v);
    }
    return result as unknown as T;
  }
  // Primitives, Dates, RegExps, etc. — delegate to native structuredClone.
  return nativeStructuredClone(value) as T;
}

// Capture the native implementation before we override it.
const nativeStructuredClone = globalThis.structuredClone as <T>(
  value: T,
  options?: StructuredSerializeOptions
) => T;

globalThis.structuredClone = function patchedStructuredClone<T>(
  value: T,
  _options?: StructuredSerializeOptions
): T {
  return blobAwareClone(value);
} as typeof structuredClone;
