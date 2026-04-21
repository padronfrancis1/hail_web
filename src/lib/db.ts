import { openDB as idbOpenDB, type DBSchema, type IDBPDatabase } from "idb";
import type { Inspection } from "@/lib/types";

interface HailDB extends DBSchema {
  inspections: {
    key: string;
    value: Inspection;
    indexes: { by_created_at: number };
  };
}

let dbPromise: Promise<IDBPDatabase<HailDB>> | null = null;

function getDb(): Promise<IDBPDatabase<HailDB>> {
  if (!dbPromise) {
    dbPromise = idbOpenDB<HailDB>("hail_web", 1, {
      upgrade(db) {
        const store = db.createObjectStore("inspections", { keyPath: "id" });
        store.createIndex("by_created_at", "createdAt");
      },
    });
  }
  return dbPromise;
}

export async function saveInspection(inspection: Inspection): Promise<void> {
  const db = await getDb();
  await db.put("inspections", inspection);
}

export async function listInspections(): Promise<Inspection[]> {
  const db = await getDb();
  const all = await db.getAllFromIndex("inspections", "by_created_at");
  // Newest first
  return all.reverse();
}

export async function getInspection(
  id: string
): Promise<Inspection | undefined> {
  const db = await getDb();
  return db.get("inspections", id);
}

export async function deleteInspection(id: string): Promise<void> {
  const db = await getDb();
  await db.delete("inspections", id);
}
