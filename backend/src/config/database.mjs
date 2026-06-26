import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { appConfig } from "./appConfig.mjs";

const configuredPath = process.env.JSON_DATABASE_PATH
  ? resolve(process.cwd(), process.env.JSON_DATABASE_PATH)
  : resolve(appConfig.projectRoot, "database/data/app-db.json");

export const databaseConfig = {
  adapter: "json-file",
  filePath: configuredPath,
};

export function loadJsonDatabase(defaultData) {
  ensureDatabaseFile(defaultData);
  try {
    const raw = readFileSync(databaseConfig.filePath, "utf8");
    return { ...defaultData, ...JSON.parse(raw) };
  } catch (error) {
    throw new Error(`Could not read JSON database: ${error.message}`);
  }
}

export function saveJsonDatabase(data) {
  ensureDatabaseDirectory();
  const tmpPath = `${databaseConfig.filePath}.tmp`;
  writeFileSync(tmpPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  renameSync(tmpPath, databaseConfig.filePath);
}

export function databaseStatus() {
  return {
    adapter: databaseConfig.adapter,
    connected: existsSync(databaseConfig.filePath),
    mode: "local JSON database",
    path: databaseConfig.filePath,
  };
}

function ensureDatabaseFile(defaultData) {
  ensureDatabaseDirectory();
  if (!existsSync(databaseConfig.filePath)) {
    writeFileSync(databaseConfig.filePath, `${JSON.stringify(defaultData, null, 2)}\n`, "utf8");
  }
}

function ensureDatabaseDirectory() {
  mkdirSync(dirname(databaseConfig.filePath), { recursive: true });
}
