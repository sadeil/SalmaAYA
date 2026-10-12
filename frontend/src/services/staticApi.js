// GitHub Pages has no backend, so the static demo runs the same RemedyQuest
// core in the browser and keeps the database in localStorage. Each browser
// therefore has its own accounts; the demo accounts are seeded on first use.
import { ensureDemoAccounts, handleRequest, migrateDatabase } from "../../../shared/remedyCore.mjs";

const STORAGE_KEY = "rq-demo-db";
const encoder = new TextEncoder();

const toHex = (buffer) => Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, "0")).join("");
const fromHex = (hex) => new Uint8Array(hex.match(/.{2}/g).map((pair) => parseInt(pair, 16)));

async function derive(password, salt) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(String(password)), "PBKDF2", false, ["deriveBits"]);
  return crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: 120000 }, key, 256);
}

async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return `pbkdf2$${toHex(salt)}$${toHex(await derive(password, salt))}`;
}

async function verifyPassword(password, stored) {
  const [scheme, salt, expected] = String(stored ?? "").split("$");
  if (scheme !== "pbkdf2" || !salt || !expected) return false;
  return toHex(await derive(password, fromHex(salt))) === expected;
}

function newToken() {
  return toHex(crypto.getRandomValues(new Uint8Array(32)));
}

function load() {
  try {
    return migrateDatabase(JSON.parse(localStorage.getItem(STORAGE_KEY)));
  } catch {
    return migrateDatabase(null);
  }
}

function save(db) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    // Private mode or full storage: the demo still works for this page view.
  }
}

const deps = {
  hashPassword,
  verifyPassword,
  newToken,
  aiStatus: () => ({ enabled: false, provider: "Static demo", model: "browser-demo" }),
  databaseStatus: (db) => ({
    adapter: "static-demo",
    connected: true,
    mode: "GitHub Pages browser demo",
    path: "browser localStorage",
    sizeBytes: new Blob([JSON.stringify(db)]).size,
    updatedAt: new Date().toISOString(),
  }),
  health: (db) => ({ status: "ok", service: "RemedyQuest static demo", database: deps.databaseStatus(db) }),
};

let dbPromise = null;
function database() {
  dbPromise ??= (async () => {
    const db = load();
    if (await ensureDemoAccounts(db, deps)) save(db);
    return db;
  })();
  return dbPromise;
}

// Mirrors the backend contract: resolves with the JSON body or throws an
// error carrying the HTTP status so api.js can treat both the same way.
export async function staticRequest(path, options = {}, token = null) {
  const db = await database();
  let body = {};
  if (options.body) {
    try {
      body = JSON.parse(options.body);
    } catch {
      body = {};
    }
  }
  const result = await handleRequest(db, { method: options.method || "GET", path, body, token }, deps);
  if (result.changed) save(db);
  if (result.status >= 400) {
    const error = new Error(result.body?.message || "Request failed");
    error.status = result.status;
    error.code = result.body?.code;
    throw error;
  }
  return JSON.parse(JSON.stringify(result.body));
}
