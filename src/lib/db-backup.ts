import { constants, existsSync, readFileSync } from "node:fs";
import { access, copyFile, mkdir, readdir, rename, stat, unlink } from "node:fs/promises";
import path from "node:path";

const DEFAULT_BACKUP_LIMIT = 50;
const BACKUP_DIR = path.join(process.cwd(), "backups", "sqlite");
const BACKUP_PREFIX = "goatcod";

export type DatabaseBackup = {
  path: string;
  name: string;
  createdAt: Date;
  size: number;
};

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function backupLimit() {
  const parsed = Number(process.env.DB_BACKUP_KEEP ?? DEFAULT_BACKUP_LIMIT);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : DEFAULT_BACKUP_LIMIT;
}

function databaseUrlFromDotEnv() {
  const envPath = path.join(process.cwd(), ".env");
  if (!existsSync(envPath)) return undefined;

  const envFile = readFileSync(envPath, "utf8");
  const match = envFile.match(/^DATABASE_URL=(.+)$/m);
  if (!match) return undefined;

  return match[1].trim().replace(/^["']|["']$/g, "");
}

export function getDatabasePath(databaseUrl = process.env.DATABASE_URL ?? databaseUrlFromDotEnv()) {
  if (!databaseUrl?.startsWith("file:")) {
    throw new Error("Only SQLite file: DATABASE_URL values can be backed up.");
  }

  const rawPath = databaseUrl.replace(/^file:/, "").split("?")[0];
  const decodedPath = decodeURIComponent(rawPath);

  if (path.isAbsolute(decodedPath)) {
    return decodedPath;
  }

  return path.resolve(process.cwd(), "prisma", decodedPath);
}

async function pathExists(filePath: string) {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export async function listDatabaseBackups(): Promise<DatabaseBackup[]> {
  if (!(await pathExists(BACKUP_DIR))) return [];

  const entries = await readdir(BACKUP_DIR);
  const backups = await Promise.all(
    entries
      .filter((entry) => entry.startsWith(`${BACKUP_PREFIX}-`) && entry.endsWith(".db"))
      .map(async (entry) => {
        const backupPath = path.join(BACKUP_DIR, entry);
        const stats = await stat(backupPath);
        return {
          path: backupPath,
          name: entry,
          createdAt: stats.birthtime,
          size: stats.size,
        };
      })
  );

  return backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

async function pruneOldBackups() {
  const backups = await listDatabaseBackups();
  const staleBackups = backups.slice(backupLimit());

  await Promise.all(staleBackups.map((backup) => unlink(backup.path)));
}

export async function createDatabaseBackup(reason = "manual") {
  const databasePath = getDatabasePath();

  if (!(await pathExists(databasePath))) {
    throw new Error(`Database file does not exist: ${databasePath}`);
  }

  await mkdir(BACKUP_DIR, { recursive: true });

  const safeReason = reason.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const backupName = `${BACKUP_PREFIX}-${timestamp()}${safeReason ? `-${safeReason}` : ""}.db`;
  const backupPath = path.join(BACKUP_DIR, backupName);

  await copyFile(databasePath, backupPath);
  await pruneOldBackups();

  return backupPath;
}

export async function restoreLatestDatabaseBackup() {
  const [latestBackup] = await listDatabaseBackups();

  if (!latestBackup) {
    throw new Error(`No backups found in ${BACKUP_DIR}`);
  }

  const databasePath = getDatabasePath();
  const databaseDir = path.dirname(databasePath);
  await mkdir(databaseDir, { recursive: true });

  if (await pathExists(databasePath)) {
    const preRestorePath = path.join(BACKUP_DIR, `${BACKUP_PREFIX}-${timestamp()}-pre-restore.db`);
    await copyFile(databasePath, preRestorePath);
  }

  const restoreTempPath = `${databasePath}.restore-${timestamp()}.tmp`;
  await copyFile(latestBackup.path, restoreTempPath);
  await rename(restoreTempPath, databasePath);

  return {
    restoredFrom: latestBackup.path,
    restoredTo: databasePath,
  };
}
