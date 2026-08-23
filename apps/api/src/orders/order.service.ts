import {
  calculateEstimatedReadyAt,
  calculateOrderTotal,
  canTransitionOrderStatus,
} from "@lab-orders/domain";
import { eq, inArray } from "drizzle-orm";
import type { AppDatabase } from "../db/client";
import { labTests, orders, orderTests, patients, type OrderStatus } from "../db/schema";

export class OrderServiceError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: 404 | 409 | 422,
  ) {
    super(message);
  }
}

export type OrderSnapshot = {
  labTestId: string;
  testCode: string;
  testName: string;
  priceCents: number;
  turnaroundHours: number;
};

export type PersistedOrder = {
  id: string;
  patientId: string;
  status: OrderStatus;
  orderedAt: string;
  totalCents: number;
  estimatedReadyAt: string;
  createdAt: string;
  updatedAt: string;
};

export async function persistOrderRows(
  db: AppDatabase,
  order: PersistedOrder,
  snapshots: OrderSnapshot[],
) {
  await db.transaction(async (transaction) => {
    await transaction.insert(orders).values(order);
    await transaction.insert(orderTests).values(
      snapshots.map((snapshot) => ({
        orderId: order.id,
        ...snapshot,
      })),
    );
  });
}

export async function createOrderRecord(
  db: AppDatabase,
  input: { patientId: string; testIds: string[] },
  clock: () => Date = () => new Date(),
) {
  const patient = await db.query.patients.findFirst({
    where: eq(patients.id, input.patientId),
  });
  if (!patient) throw new OrderServiceError("PATIENT_NOT_FOUND", "Patient not found", 404);

  const catalog = await db.query.labTests.findMany({
    where: inArray(labTests.id, input.testIds),
  });
  const byId = new Map(catalog.map((test) => [test.id, test]));
  const missing = input.testIds.filter((id) => !byId.has(id));
  if (missing.length > 0) {
    throw new OrderServiceError("LAB_TEST_NOT_FOUND", "One or more lab tests were not found", 404);
  }

  const inactive = input.testIds
    .map((id) => byId.get(id)!)
    .filter((test) => !test.active)
    .map((test) => test.code);
  if (inactive.length > 0) {
    throw new OrderServiceError(
      "INACTIVE_TEST",
      `Inactive lab tests cannot be ordered: ${inactive.join(", ")}`,
      409,
    );
  }

  const snapshots = input.testIds.map((id) => {
    const test = byId.get(id)!;
    return {
      labTestId: test.id,
      testCode: test.code,
      testName: test.name,
      priceCents: test.priceCents,
      turnaroundHours: test.turnaroundHours,
    };
  });
  const now = clock().toISOString();
  const order: PersistedOrder = {
    id: crypto.randomUUID(),
    patientId: patient.id,
    status: "pending",
    orderedAt: now,
    totalCents: calculateOrderTotal(snapshots.map((item) => item.priceCents)),
    estimatedReadyAt: calculateEstimatedReadyAt(
      now,
      snapshots.map((item) => item.turnaroundHours),
    ),
    createdAt: now,
    updatedAt: now,
  };
  await persistOrderRows(db, order, snapshots);
  return { order, snapshots, patient };
}

export function assertStatusTransition(from: OrderStatus, to: OrderStatus) {
  if (!canTransitionOrderStatus(from, to)) {
    throw new OrderServiceError(
      "INVALID_STATUS_TRANSITION",
      `Cannot change order status from ${from} to ${to}`,
      409,
    );
  }
}
