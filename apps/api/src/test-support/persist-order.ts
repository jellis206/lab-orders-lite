import type { AppDatabase } from "../db/client";
import { writeOrderRows, type OrderSnapshot, type PersistedOrder } from "../orders/order.service";

export async function persistOrderRows(
  db: AppDatabase,
  order: PersistedOrder,
  snapshots: OrderSnapshot[],
) {
  await db.transaction(async (transaction) => {
    await writeOrderRows(transaction, order, snapshots);
  });
}
