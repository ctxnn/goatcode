import { listDatabaseBackups } from "../src/lib/db-backup";

async function main() {
  const backups = await listDatabaseBackups();

  if (backups.length === 0) {
    console.log("No database backups found.");
    return;
  }

  for (const backup of backups) {
    console.log(`${backup.createdAt.toISOString()}  ${backup.size} bytes  ${backup.path}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

