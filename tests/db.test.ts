/**
 * IndexedDB tests for src/lib/db.ts.
 *
 * Strategy: db.ts caches the DB connection in a module-level variable.
 * We call vi.resetModules() + re-import before every test so each test gets
 * a fresh IDBFactory from fake-indexeddb/auto, which is reset in setup.ts.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import type { Inspection } from "@/lib/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeInspection(overrides: Partial<Inspection> = {}): Inspection {
  return {
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    filename: "test.jpg",
    imageWidth: 800,
    imageHeight: 600,
    originalImage: new Blob(["orig"], { type: "image/jpeg" }),
    overlayImage: new Blob(["overlay"], { type: "image/jpeg" }),
    thumbnail: new Blob(["thumb"], { type: "image/jpeg" }),
    detections: [],
    ...overrides,
  };
}

type DbModule = {
  saveInspection: (i: Inspection) => Promise<void>;
  listInspections: () => Promise<Inspection[]>;
  getInspection: (id: string) => Promise<Inspection | undefined>;
  deleteInspection: (id: string) => Promise<void>;
};

async function freshDb(): Promise<DbModule> {
  vi.resetModules();
  // fake-indexeddb/auto patches globalThis.indexedDB; re-importing after
  // resetModules makes db.ts pick up a clean IDB factory.
  return import("@/lib/db") as Promise<DbModule>;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("db", () => {
  let db: DbModule;

  beforeEach(async () => {
    db = await freshDb();
  });

  // --- saveInspection / getInspection round-trip ----------------------------

  it("saveInspection round-trips basic scalar fields", async () => {
    const ins = makeInspection({ filename: "panel.jpg", imageWidth: 1920 });
    await db.saveInspection(ins);
    const found = await db.getInspection(ins.id);

    expect(found).toBeDefined();
    expect(found!.filename).toBe("panel.jpg");
    expect(found!.imageWidth).toBe(1920);
    expect(found!.id).toBe(ins.id);
  });

  it("saveInspection preserves Blob fields (originalImage bytes)", async () => {
    const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
    const ins = makeInspection({
      originalImage: new Blob([bytes], { type: "image/jpeg" }),
    });
    await db.saveInspection(ins);
    const found = await db.getInspection(ins.id);

    expect(found!.originalImage).toBeInstanceOf(Blob);
    const buf = await found!.originalImage.arrayBuffer();
    expect(new Uint8Array(buf)).toEqual(bytes);
  });

  it("saveInspection preserves thumbnail Blob", async () => {
    const thumbBytes = new Uint8Array([1, 2, 3]);
    const ins = makeInspection({
      thumbnail: new Blob([thumbBytes], { type: "image/jpeg" }),
    });
    await db.saveInspection(ins);
    const found = await db.getInspection(ins.id);

    const buf = await found!.thumbnail.arrayBuffer();
    expect(new Uint8Array(buf)).toEqual(thumbBytes);
  });

  it("saveInspection upserts when called twice with the same id", async () => {
    const ins = makeInspection({ filename: "original.jpg" });
    await db.saveInspection(ins);
    await db.saveInspection({ ...ins, filename: "updated.jpg" });

    const all = await db.listInspections();
    expect(all).toHaveLength(1);
    expect(all[0].filename).toBe("updated.jpg");
  });

  // --- listInspections ordering ---------------------------------------------

  it("listInspections returns newest-first by createdAt", async () => {
    const now = Date.now();
    const old = makeInspection({ createdAt: now - 10_000, filename: "old.jpg" });
    const mid = makeInspection({ createdAt: now - 5_000, filename: "mid.jpg" });
    const newest = makeInspection({ createdAt: now, filename: "new.jpg" });

    // Insert in arbitrary order
    await db.saveInspection(mid);
    await db.saveInspection(old);
    await db.saveInspection(newest);

    const all = await db.listInspections();
    expect(all[0].filename).toBe("new.jpg");
    expect(all[1].filename).toBe("mid.jpg");
    expect(all[2].filename).toBe("old.jpg");
  });

  it("listInspections returns empty array when store is empty", async () => {
    const all = await db.listInspections();
    expect(all).toEqual([]);
  });

  // --- getInspection --------------------------------------------------------

  it("getInspection returns undefined for an unknown id", async () => {
    const found = await db.getInspection("does-not-exist");
    expect(found).toBeUndefined();
  });

  it("getInspection returns the correct record among multiple", async () => {
    const a = makeInspection({ filename: "a.jpg" });
    const b = makeInspection({ filename: "b.jpg" });
    await db.saveInspection(a);
    await db.saveInspection(b);

    const found = await db.getInspection(b.id);
    expect(found!.filename).toBe("b.jpg");
  });

  // --- deleteInspection -----------------------------------------------------

  it("deleteInspection removes the record", async () => {
    const ins = makeInspection();
    await db.saveInspection(ins);
    await db.deleteInspection(ins.id);

    const found = await db.getInspection(ins.id);
    expect(found).toBeUndefined();
  });

  it("deleteInspection does not remove other records", async () => {
    const a = makeInspection();
    const b = makeInspection();
    await db.saveInspection(a);
    await db.saveInspection(b);

    await db.deleteInspection(a.id);

    const remaining = await db.listInspections();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe(b.id);
  });

  it("deleteInspection on unknown id does not throw", async () => {
    await expect(db.deleteInspection("ghost-id")).resolves.not.toThrow();
  });

  // --- Schema / version -----------------------------------------------------

  it("opening DB at version 1 succeeds without throwing", async () => {
    // If the upgrade callback throws, saveInspection would reject.
    const ins = makeInspection();
    await expect(db.saveInspection(ins)).resolves.not.toThrow();
  });
});
