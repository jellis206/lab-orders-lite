import { migrate } from "drizzle-orm/libsql/migrator";
import { getConfig } from "../config";
import { createDatabase } from "./client";

export async function migrateDatabase(databaseUrl: string, authToken?: string) {
  const { client, db } = createDatabase({
    databaseUrl,
    ...(authToken === undefined ? {} : { authToken }),
  });
  try {
    await migrate(db, {
      migrationsFolder: new URL("../../../../drizzle", import.meta.url).pathname,
    });
  } finally {
    client.close();
  }
}

if (import.meta.main) {
  const config = getConfig();
  await migrateDatabase(config.databaseUrl, config.authToken);
  console.info("Database migrations applied.");
}
