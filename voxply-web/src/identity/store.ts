import { openDB, type IDBPDatabase } from "idb";
import { ed25519 } from "@noble/curves/ed25519";

export interface IdentityRecord {
  id: "main";
  seed_hex: string;
  security_nonce: number;
  security_level: number;
}

export interface SubkeyCert {
  master_pubkey: string;
  subkey_pubkey: string;
  device_label: string;
  issued_at: number;
  not_after: number | null;
  fallback_hubs: string[];
  signature: string;
}

export interface PairedState {
  id: "main";
  subkey_private_hex: string;
  cert: SubkeyCert;
}

let _db: IDBPDatabase | null = null;

async function getDb(): Promise<IDBPDatabase> {
  if (!_db) {
    _db = await openDB("voxply", 2, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          db.createObjectStore("identity", { keyPath: "id" });
        }
        if (oldVersion < 2) {
          db.createObjectStore("paired", { keyPath: "id" });
        }
      },
    });
  }
  return _db;
}

export async function loadIdentity(): Promise<IdentityRecord | null> {
  const db = await getDb();
  const result = await db.get("identity", "main");
  return result ?? null;
}

export async function saveIdentity(record: IdentityRecord): Promise<void> {
  const db = await getDb();
  await db.put("identity", record);
}

export async function generateIdentity(): Promise<IdentityRecord> {
  const seed = ed25519.utils.randomPrivateKey();
  const record: IdentityRecord = {
    id: "main",
    seed_hex: bytesToHex(seed),
    security_nonce: 0,
    security_level: 0,
  };
  await saveIdentity(record);
  return record;
}

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function hexToBytes(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) throw new Error("Odd-length hex string");
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

export async function loadPairedState(): Promise<PairedState | null> {
  const db = await getDb();
  const result = await db.get("paired", "main");
  return result ?? null;
}

export async function savePairedState(state: Omit<PairedState, "id">): Promise<void> {
  const db = await getDb();
  await db.put("paired", { ...state, id: "main" });
}

export async function clearPairedState(): Promise<void> {
  const db = await getDb();
  await db.delete("paired", "main");
}
