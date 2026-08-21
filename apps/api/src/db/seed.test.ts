import { expect, test } from "bun:test";
import { sql } from "drizzle-orm";
import { createTestDatabase } from "../test/database";
import { seedDatabase } from "./seed";

test("seed is deterministic and represents the primary screens", async () => {
  const database = await createTestDatabase();
  try {
    await seedDatabase(database.db);
    await seedDatabase(database.db);

    const counts = await database.db.run(sql`
      select
        (select count(*) from patients) as patients,
        (select count(*) from lab_tests) as lab_tests,
        (select count(*) from orders) as orders,
        (select count(*) from order_tests) as order_tests
    `);
    expect(counts.rows[0]).toMatchObject({ patients: 4, lab_tests: 6, orders: 4, order_tests: 6 });

    const statuses = await database.db.run(sql`select distinct status from orders order by status`);
    expect(statuses.rows.map((row) => row.status)).toEqual([
      "cancelled",
      "completed",
      "in_progress",
      "pending",
    ]);

    const multiTestOrders = await database.db.run(
      sql`select order_id from order_tests group by order_id having count(*) > 1`,
    );
    expect(multiTestOrders.rows).toHaveLength(2);
  } finally {
    await database.cleanup();
  }
});
