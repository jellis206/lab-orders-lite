import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { migrate } from "drizzle-orm/libsql/migrator";
import { createDatabase, type AppDatabase } from "../db/client";
import { writeOrderRows, type OrderSnapshot, type PersistedOrder } from "../features/orders/order.service";

export async function persistOrderRows(
  db: AppDatabase,
  order: PersistedOrder,
  snapshots: OrderSnapshot[],
) {
  await db.transaction(async (transaction) => {
    await writeOrderRows(transaction, order, snapshots);
  });
}

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
