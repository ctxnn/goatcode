import { restoreLatestDatabaseBackup } from "../src/lib/db-backup";

async function main() {
  const result = await restoreLatestDatabaseBackup();

  console.log(`Restored from: ${result.restoredFrom}`);
  console.log(`Restored to: ${result.restoredTo}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

