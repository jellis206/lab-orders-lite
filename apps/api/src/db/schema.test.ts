import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import type { Client } from "@libsql/client";
import { createTestDatabase } from "../test/database";

let database: Awaited<ReturnType<typeof createTestDatabase>>;
let client: Client;

beforeEach(async () => {
  database = await createTestDatabase();
  client = database.client;
});

afterEach(async () => database.cleanup());

const patientValues = [
  "patient-1",
  "Jamie",
  "Stone",
  "1990-02-03",
  "2025-01-01T00:00:00.000Z",
  "2025-01-01T00:00:00.000Z",
];
const testValues = [
  "test-1",
  "CBC",
  "Complete Blood Count",
  3000,
  12,
  "2025-01-01T00:00:00.000Z",
  "2025-01-01T00:00:00.000Z",
];

async function insertPatient() {
  await client.execute({
    sql: "insert into patients (id, first_name, last_name, date_of_birth, created_at, updated_at) values (?, ?, ?, ?, ?, ?)",
    args: patientValues,
  });
}

async function insertLabTest(values = testValues) {
  await client.execute({
    sql: "insert into lab_tests (id, code, name, price_cents, turnaround_hours, created_at, updated_at) values (?, ?, ?, ?, ?, ?, ?)",
    args: values,
  });
}

async function insertOrder() {
  await client.execute({
    sql: "insert into orders (id, patient_id, status, ordered_at, total_cents, estimated_ready_at, created_at, updated_at) values (?, ?, ?, ?, ?, ?, ?, ?)",
    args: [
      "order-1",
      "patient-1",
      "pending",
      "2025-01-01T00:00:00.000Z",
      3000,
      "2025-01-01T12:00:00.000Z",
      "2025-01-01T00:00:00.000Z",
      "2025-01-01T00:00:00.000Z",
    ],
  });
}

describe("database foundation", () => {
  test("migrates an isolated file database with foreign keys enabled", async () => {
    expect(database.databaseUrl).toStartWith("file:");
    expect(database.databaseUrl).not.toContain("8080");
    expect((await client.execute("pragma foreign_keys")).rows[0]?.foreign_keys).toBe(1);
    const tables = await client.execute(
      "select name from sqlite_master where type = 'table' and name in ('patients', 'lab_tests', 'orders', 'order_tests')",
    );
    expect(tables.rows).toHaveLength(4);
  });

  test("enforces required patient values and provides the name cursor index", async () => {
    await expect(
      client.execute(
        "insert into patients (id, first_name, last_name, date_of_birth, created_at, updated_at) values ('bad', '', 'Stone', '1990-02-03', 'now', 'now')",
      ),
    ).rejects.toThrow();
    const indexes = await client.execute(
      "select name from sqlite_master where type = 'index' and tbl_name = 'patients'",
    );
    expect(indexes.rows.map((row) => row.name)).toContain("patients_name_cursor_idx");
  });

  test("enforces unique codes, nonnegative prices, and positive turnaround", async () => {
    await insertLabTest();
    await expect(
      insertLabTest(["test-2", "CBC", "Duplicate", 1000, 1, "now", "now"]),
    ).rejects.toThrow();
    await expect(
      insertLabTest(["test-3", "NEG", "Negative", -1, 1, "now", "now"]),
    ).rejects.toThrow();
    await expect(
      insertLabTest(["test-4", "ZERO", "Zero hours", 100, 0, "now", "now"]),
    ).rejects.toThrow();
    await expect(
      client.execute(
        "insert into lab_tests (id, code, name, price_cents, turnaround_hours, active, created_at, updated_at) values ('test-5', 'ACTIVE', 'Bad active', 100, 1, 2, 'now', 'now')",
      ),
    ).rejects.toThrow();
  });

  test("enforces order foreign keys and statuses", async () => {
    await expect(
      client.execute(
        "insert into orders (id, patient_id, status, ordered_at, total_cents, estimated_ready_at, created_at, updated_at) values ('bad', 'missing', 'pending', 'now', 0, 'later', 'now', 'now')",
      ),
    ).rejects.toThrow();
    await insertPatient();
    await expect(
      client.execute(
        "insert into orders (id, patient_id, status, ordered_at, total_cents, estimated_ready_at, created_at, updated_at) values ('bad', 'patient-1', 'unknown', 'now', 0, 'later', 'now', 'now')",
      ),
    ).rejects.toThrow();
  });

  test("preserves required snapshots and rejects duplicate tests on an order", async () => {
    await insertPatient();
    await insertLabTest();
    await insertOrder();
    const statement = {
      sql: "insert into order_tests (order_id, lab_test_id, test_code, test_name, price_cents, turnaround_hours) values (?, ?, ?, ?, ?, ?)",
      args: ["order-1", "test-1", "CBC", "Complete Blood Count", 3000, 12],
    };
    await client.execute(statement);
    await expect(client.execute(statement)).rejects.toThrow();
    await expect(
      client.execute(
        "insert into order_tests (order_id, lab_test_id, test_code, test_name, price_cents, turnaround_hours) values ('order-1', 'missing', 'X', 'Missing', 1, 1)",
      ),
    ).rejects.toThrow();
  });
});
