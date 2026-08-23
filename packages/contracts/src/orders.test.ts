import { describe, expect, it } from "bun:test";
import {
  createOrderSchema,
  orderDetailResponseSchema,
  orderListQuerySchema,
  orderListResponseSchema,
  patchOrderStatusSchema,
} from "./orders";

describe("createOrderSchema", () => {
  it("accepts a patient and unique test ids", () => {
    const result = createOrderSchema.safeParse({
      patientId: "patient-ada",
      testIds: ["test-cbc", "test-cmp"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty selection", () => {
    expect(createOrderSchema.safeParse({ patientId: "patient-ada", testIds: [] }).success).toBe(
      false,
    );
  });

  it("rejects duplicate test ids", () => {
    expect(
      createOrderSchema.safeParse({
        patientId: "patient-ada",
        testIds: ["test-cbc", "test-cbc"],
      }).success,
    ).toBe(false);
  });

  it("rejects a missing patient", () => {
    expect(createOrderSchema.safeParse({ testIds: ["test-cbc"] }).success).toBe(false);
  });

  it("rejects client-supplied totals or snapshots", () => {
    expect(
      createOrderSchema.safeParse({
        patientId: "patient-ada",
        testIds: ["test-cbc"],
        totalCents: 3000,
      }).success,
    ).toBe(false);
  });
});

describe("patchOrderStatusSchema", () => {
  it("accepts a known status", () => {
    expect(patchOrderStatusSchema.safeParse({ status: "in_progress" }).success).toBe(true);
  });

  it("rejects an unknown status", () => {
    expect(patchOrderStatusSchema.safeParse({ status: "shipped" }).success).toBe(false);
  });
});

describe("orderListQuerySchema", () => {
  it("accepts patient search and status", () => {
    const result = orderListQuerySchema.safeParse({ search: "ada", status: "pending", limit: "5" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toMatchObject({ search: "ada", status: "pending", limit: 5 });
    }
  });

  it("rejects an invalid status filter", () => {
    expect(orderListQuerySchema.safeParse({ status: "done" }).success).toBe(false);
  });
});

describe("order response schemas", () => {
  const summary = {
    id: "order-1",
    patientId: "patient-ada",
    patientFirstName: "Ada",
    patientLastName: "Rivera",
    status: "pending",
    orderedAt: "2025-01-10T09:00:00.000Z",
    testCount: 1,
    totalCents: 3000,
    estimatedReadyAt: "2025-01-10T21:00:00.000Z",
    createdAt: "2025-01-10T09:00:00.000Z",
    updatedAt: "2025-01-10T09:00:00.000Z",
  };

  it("accepts a list response", () => {
    expect(
      orderListResponseSchema.safeParse({ items: [summary], nextCursor: null, hasMore: false })
        .success,
    ).toBe(true);
  });

  it("accepts a detail response with snapshots", () => {
    expect(
      orderDetailResponseSchema.safeParse({
        ...summary,
        tests: [
          {
            labTestId: "test-cbc",
            testCode: "CBC",
            testName: "Complete Blood Count",
            priceCents: 3000,
            turnaroundHours: 12,
          },
        ],
      }).success,
    ).toBe(true);
  });
});
