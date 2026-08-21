import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

const timestamp = (name: string) => text(name).notNull();

export const patients = sqliteTable(
  "patients",
  {
    id: text("id").primaryKey(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    dateOfBirth: text("date_of_birth").notNull(),
    email: text("email"),
    phone: text("phone"),
    createdAt: timestamp("created_at"),
    updatedAt: timestamp("updated_at"),
  },
  (table) => [
    check("patients_first_name_not_blank", sql`length(trim(${table.firstName})) > 0`),
    check("patients_last_name_not_blank", sql`length(trim(${table.lastName})) > 0`),
    check(
      "patients_date_of_birth_iso",
      sql`${table.dateOfBirth} glob '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'`,
    ),
    index("patients_name_cursor_idx").on(
      sql`lower(${table.lastName})`,
      sql`lower(${table.firstName})`,
      table.id,
    ),
  ],
);

export const labTests = sqliteTable(
  "lab_tests",
  {
    id: text("id").primaryKey(),
    code: text("code").notNull(),
    name: text("name").notNull(),
    priceCents: integer("price_cents").notNull(),
    turnaroundHours: integer("turnaround_hours").notNull(),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    createdAt: timestamp("created_at"),
    updatedAt: timestamp("updated_at"),
  },
  (table) => [
    uniqueIndex("lab_tests_code_unique").on(table.code),
    check("lab_tests_code_not_blank", sql`length(trim(${table.code})) > 0`),
    check("lab_tests_name_not_blank", sql`length(trim(${table.name})) > 0`),
    check("lab_tests_price_nonnegative", sql`${table.priceCents} >= 0`),
    check("lab_tests_turnaround_positive", sql`${table.turnaroundHours} > 0`),
    check("lab_tests_active_boolean", sql`${table.active} in (0, 1)`),
    index("lab_tests_active_code_cursor_idx").on(table.active, table.code, table.id),
    index("lab_tests_active_name_cursor_idx").on(table.active, sql`lower(${table.name})`, table.id),
  ],
);

export const orderStatuses = ["pending", "in_progress", "completed", "cancelled"] as const;
export type OrderStatus = (typeof orderStatuses)[number];

export const orders = sqliteTable(
  "orders",
  {
    id: text("id").primaryKey(),
    patientId: text("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "restrict", onUpdate: "cascade" }),
    status: text("status", { enum: orderStatuses }).notNull(),
    orderedAt: timestamp("ordered_at"),
    totalCents: integer("total_cents").notNull(),
    estimatedReadyAt: timestamp("estimated_ready_at"),
    createdAt: timestamp("created_at"),
    updatedAt: timestamp("updated_at"),
  },
  (table) => [
    check(
      "orders_status_valid",
      sql`${table.status} in ('pending', 'in_progress', 'completed', 'cancelled')`,
    ),
    check("orders_total_nonnegative", sql`${table.totalCents} >= 0`),
    index("orders_patient_cursor_idx").on(table.patientId, table.orderedAt, table.id),
    index("orders_status_cursor_idx").on(table.status, table.orderedAt, table.id),
    index("orders_cursor_idx").on(table.orderedAt, table.id),
  ],
);

export const orderTests = sqliteTable(
  "order_tests",
  {
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade", onUpdate: "cascade" }),
    labTestId: text("lab_test_id")
      .notNull()
      .references(() => labTests.id, { onDelete: "restrict", onUpdate: "cascade" }),
    testCode: text("test_code").notNull(),
    testName: text("test_name").notNull(),
    priceCents: integer("price_cents").notNull(),
    turnaroundHours: integer("turnaround_hours").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.orderId, table.labTestId] }),
    check("order_tests_code_not_blank", sql`length(trim(${table.testCode})) > 0`),
    check("order_tests_name_not_blank", sql`length(trim(${table.testName})) > 0`),
    check("order_tests_price_nonnegative", sql`${table.priceCents} >= 0`),
    check("order_tests_turnaround_positive", sql`${table.turnaroundHours} > 0`),
    index("order_tests_lab_test_idx").on(table.labTestId, table.orderId),
  ],
);
