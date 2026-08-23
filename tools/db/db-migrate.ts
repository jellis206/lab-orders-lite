import { getConfig } from "../../apps/api/src/config";
import { migrateDatabase } from "../../apps/api/src/db/migrate";

if (import.meta.main) {
  const config = getConfig();
  await migrateDatabase(config.databaseUrl, config.authToken);
  console.info("Database migrations applied.");
}
