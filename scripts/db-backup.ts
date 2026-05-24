import { createDatabaseBackup, getDatabasePath, listDatabaseBackups } from "../src/lib/db-backup";

async function main() {
  const backupPath = await createDatabaseBackup("manual");
  const backups = await listDatabaseBackups();

  console.log(`Database: ${getDatabasePath()}`);
  console.log(`Backup created: ${backupPath}`);
  console.log(`Backups available: ${backups.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

