import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { migrate } from "drizzle-orm/libsql/migrator";
import { createDatabase } from "../db/client";

export async function createTestDatabase() {
  const directory = await mkdtemp(join(tmpdir(), "lab-orders-test-"));
  const databaseUrl = `file:${join(directory, "test.db")}`;
  const database = createDatabase({ databaseUrl });
  await database.client.execute("PRAGMA foreign_keys = ON");
  await migrate(database.db, {
    migrationsFolder: new URL("../../../../drizzle", import.meta.url).pathname,
  });

  return {
    ...database,
    databaseUrl,
    async cleanup() {
      database.client.close();
      await rm(directory, { recursive: true, force: true });
    },
  };
}
