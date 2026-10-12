import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { loadJsonDatabase, saveJsonDatabase } from "../config/database.mjs";
import { ensureDemoAccounts, migrateDatabase } from "../../../shared/remedyCore.mjs";

const scryptAsync = promisify(scrypt);

export async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = await scryptAsync(String(password), salt, 64);
  return `scrypt$${salt}$${hash.toString("hex")}`;
}

export async function verifyPassword(password, stored) {
  const [scheme, salt, expectedHex] = String(stored ?? "").split("$");
  if (scheme !== "scrypt" || !salt || !expectedHex) return false;
  const expected = Buffer.from(expectedHex, "hex");
  const actual = await scryptAsync(String(password), salt, expected.length);
  return timingSafeEqual(actual, expected);
}

export function newToken() {
  return randomBytes(32).toString("base64url");
}

// The whole database lives in memory and is written back to the JSON file
// after every change. The old single-patient prototype file is migrated on
// first load, and the demo accounts are created if missing.
// An empty default (not the current shape) so a legacy file is recognised.
export const db = migrateDatabase(loadJsonDatabase({}));
await ensureDemoAccounts(db, { hashPassword });
saveAppStore();

export function saveAppStore() {
  saveJsonDatabase(db);
}
