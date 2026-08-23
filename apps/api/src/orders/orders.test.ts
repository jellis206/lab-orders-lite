import {
  apiErrorSchema,
  orderDetailResponseSchema,
  orderListResponseSchema,
} from "@lab-orders/contracts";
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import { createApp } from "../app";
import { labTests, orders, patients } from "../db/schema";
import { createTestDatabase } from "../test/database";
import { persistOrderRows } from "../test/persist-order";
import { transitionOrderStatus } from "./order.service";

let database: Awaited<ReturnType<typeof createTestDatabase>>;
let app: ReturnType<typeof createApp>;

const now = "2025-01-01T00:00:00.000Z";

beforeEach(async () => {
  database = await createTestDatabase();
  app = createApp(database.db);
  await database.db.insert(patients).values([
    {
      id: "patient-ada",
      firstName: "Ada",
      lastName: "Rivera",
      dateOfBirth: "1988-04-12",
      email: "ada@example.test",
      phone: null,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "patient-ben",
      firstName: "Ben",
      lastName: "Baker",
      dateOfBirth: "1975-03-03",
      email: null,
      phone: null,
      createdAt: now,
      updatedAt: now,
    },
  ]);
  await database.db.insert(labTests).values([
    {
      id: "test-cbc",
      code: "CBC",
      name: "Complete Blood Count",
      priceCents: 3000,
      turnaroundHours: 12,
      active: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "test-cmp",
      code: "CMP",
      name: "Comprehensive Metabolic Panel",
      priceCents: 4500,
      turnaroundHours: 24,
      active: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "test-tsh",
      code: "TSH",
      name: "Thyroid Stimulating Hormone",
      priceCents: 4100,
      turnaroundHours: 36,
      active: false,
      createdAt: now,
      updatedAt: now,
    },
  ]);
});

afterEach(async () => database.cleanup());

async function json(path: string, init?: RequestInit) {
  const response = await app.request(path, init);
  return { response, body: await response.json() };
}

type CreateOrderFixture = {
  patientId?: string;
  testIds?: string[];
  totalCents?: number;
  estimatedReadyAt?: string;
};

function createBody(overrides: CreateOrderFixture = {}) {
  return {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      patientId: "patient-ada",
      testIds: ["test-cbc", "test-cmp"],
      ...overrides,
    }),
  };
}

function requireCursor(nextCursor: string | null) {
  if (nextCursor === null) {
    throw new Error("expected a pagination cursor");
  }
  return nextCursor;
}

describe("order creation", () => {
  test("creates an order from catalog data and ignores client-derived fields", async () => {
    const created = await json(
      "/api/orders",
      createBody({ totalCents: 1, estimatedReadyAt: "nope" }),
    );
    expect(created.response.status).toBe(422);

    const valid = await json("/api/orders", createBody());
    const validBody = orderDetailResponseSchema.parse(valid.body);
    expect(valid.response.status).toBe(201);
    expect(valid.response.headers.get("location")).toBe(`/api/orders/${validBody.id}`);
    expect(validBody).toMatchObject({
      patientId: "patient-ada",
      patientFirstName: "Ada",
      status: "pending",
      testCount: 2,
      totalCents: 7500,
      tests: [
        { labTestId: "test-cbc", testCode: "CBC", priceCents: 3000, turnaroundHours: 12 },
        { labTestId: "test-cmp", testCode: "CMP", priceCents: 4500, turnaroundHours: 24 },
      ],
    });
    expect(validBody.estimatedReadyAt).toBe(
      new Date(new Date(validBody.orderedAt).getTime() + 24 * 60 * 60 * 1000).toISOString(),
    );
  });

  test("rejects unknown patient, unknown tests, inactive tests, and empty or duplicate selections", async () => {
    expect((await json("/api/orders", createBody({ patientId: "missing" }))).response.status).toBe(
      404,
    );
    expect(
      apiErrorSchema.parse((await json("/api/orders", createBody({ testIds: ["missing"] }))).body),
    ).toMatchObject({
      code: "LAB_TEST_NOT_FOUND",
    });
    expect(
      apiErrorSchema.parse((await json("/api/orders", createBody({ testIds: ["test-tsh"] }))).body),
    ).toMatchObject({
      code: "INACTIVE_TEST",
    });
    expect((await json("/api/orders", createBody({ testIds: [] }))).response.status).toBe(422);
    expect(
      (await json("/api/orders", createBody({ testIds: ["test-cbc", "test-cbc"] }))).response
        .status,
    ).toBe(422);
  });

  test("rolls back the parent order when a child snapshot cannot be written", async () => {
    await expect(
      persistOrderRows(
        database.db,
        {
          id: "order-rollback",
          patientId: "patient-ada",
          status: "pending",
          orderedAt: now,
          totalCents: 3000,
          estimatedReadyAt: now,
          createdAt: now,
          updatedAt: now,
        },
        [
          {
            labTestId: "test-cbc",
            testCode: "   ",
            testName: "Complete Blood Count",
            priceCents: 3000,
            turnaroundHours: 12,
          },
        ],
      ),
    ).rejects.toBeTruthy();

    const leftover = await database.db.query.orders.findFirst({
      where: eq(orders.id, "order-rollback"),
    });
    expect(leftover).toBeUndefined();
  });
});

describe("order reads", () => {
  async function seedOrders() {
    await persistOrderRows(
      database.db,
      {
        id: "order-new",
        patientId: "patient-ada",
        status: "pending",
        orderedAt: "2025-01-12T10:00:00.000Z",
        totalCents: 3000,
        estimatedReadyAt: "2025-01-12T22:00:00.000Z",
        createdAt: now,
        updatedAt: now,
      },
      [
        {
          labTestId: "test-cbc",
          testCode: "CBC",
          testName: "Complete Blood Count",
          priceCents: 3000,
          turnaroundHours: 12,
        },
      ],
    );
    await persistOrderRows(
      database.db,
      {
        id: "order-old",
        patientId: "patient-ben",
        status: "completed",
        orderedAt: "2025-01-10T10:00:00.000Z",
        totalCents: 4500,
        estimatedReadyAt: "2025-01-11T10:00:00.000Z",
        createdAt: now,
        updatedAt: now,
      },
      [
        {
          labTestId: "test-cmp",
          testCode: "CMP",
          testName: "Comprehensive Metabolic Panel",
          priceCents: 4500,
          turnaroundHours: 24,
        },
      ],
    );
    await persistOrderRows(
      database.db,
      {
        id: "order-mid",
        patientId: "patient-ada",
        status: "in_progress",
        orderedAt: "2025-01-11T10:00:00.000Z",
        totalCents: 7500,
        estimatedReadyAt: "2025-01-12T10:00:00.000Z",
        createdAt: now,
        updatedAt: now,
      },
      [
        {
          labTestId: "test-cbc",
          testCode: "CBC",
          testName: "Complete Blood Count",
          priceCents: 3000,
          turnaroundHours: 12,
        },
        {
          labTestId: "test-cmp",
          testCode: "CMP",
          testName: "Comprehensive Metabolic Panel",
          priceCents: 4500,
          turnaroundHours: 24,
        },
      ],
    );
  }

  test("lists newest first with opaque cursor pagination", async () => {
    await seedOrders();
    const first = await json("/api/orders?limit=2");
    const firstBody = orderListResponseSchema.parse(first.body);
    expect(firstBody.items.map((item) => item.id)).toEqual(["order-new", "order-mid"]);
    expect(firstBody.hasMore).toBe(true);

    const second = await json(
      `/api/orders?limit=2&after=${encodeURIComponent(requireCursor(firstBody.nextCursor))}`,
    );
    const secondBody = orderListResponseSchema.parse(second.body);
    expect(secondBody.items.map((item) => item.id)).toEqual(["order-old"]);
    expect(secondBody).toMatchObject({ hasMore: false, nextCursor: null });
  });

  test("applies patient search and status filters before pagination", async () => {
    await seedOrders();
    const byPatient = await json("/api/orders?search=ada&limit=1");
    const byPatientBody = orderListResponseSchema.parse(byPatient.body);
    expect(byPatientBody.items[0]?.id).toBe("order-new");
    expect(byPatientBody.hasMore).toBe(true);

    const byStatus = await json("/api/orders?status=completed");
    expect(orderListResponseSchema.parse(byStatus.body).items.map((item) => item.id)).toEqual([
      "order-old",
    ]);
  });

  test("matches non-ASCII patient names with the same folding as SQLite", async () => {
    await database.db.insert(patients).values({
      id: "patient-oster",
      firstName: "Ann",
      lastName: "Øster",
      dateOfBirth: "1984-04-04",
      email: "ann@example.test",
      phone: null,
      createdAt: now,
      updatedAt: now,
    });
    await persistOrderRows(
      database.db,
      {
        id: "order-oster",
        patientId: "patient-oster",
        status: "pending",
        orderedAt: "2025-01-13T10:00:00.000Z",
        totalCents: 3000,
        estimatedReadyAt: "2025-01-13T22:00:00.000Z",
        createdAt: now,
        updatedAt: now,
      },
      [
        {
          labTestId: "test-cbc",
          testCode: "CBC",
          testName: "Complete Blood Count",
          priceCents: 3000,
          turnaroundHours: 12,
        },
      ],
    );
    const result = await json("/api/orders?search=%C3%98STER");
    expect(orderListResponseSchema.parse(result.body).items.map((item) => item.id)).toEqual([
      "order-oster",
    ]);
  });

  test("rejects malformed and filter-mismatched cursors", async () => {
    await seedOrders();
    expect((await json("/api/orders?after=bad")).response.status).toBe(400);
    const first = await json("/api/orders?search=ada&limit=1");
    const firstBody = orderListResponseSchema.parse(first.body);
    const mismatch = await json(
      `/api/orders?search=ben&after=${encodeURIComponent(requireCursor(firstBody.nextCursor))}`,
    );
    expect(apiErrorSchema.parse(mismatch.body)).toMatchObject({ code: "INVALID_CURSOR" });
  });

  test("returns a historical detail and 404 for unknown ids", async () => {
    await seedOrders();
    const detail = await json("/api/orders/order-mid");
    expect(orderDetailResponseSchema.parse(detail.body)).toMatchObject({
      id: "order-mid",
      testCount: 2,
      totalCents: 7500,
      tests: [{ testCode: "CBC" }, { testCode: "CMP" }],
    });
    expect((await json("/api/orders/missing")).response.status).toBe(404);
  });

  test("keeps snapshots after later catalog edits", async () => {
    const created = await json("/api/orders", createBody({ testIds: ["test-cbc"] }));
    const createdBody = orderDetailResponseSchema.parse(created.body);
    await json(`/api/tests/test-cbc`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "New CBC", priceCents: 9999, turnaroundHours: 99 }),
    });
    const detail = await json(`/api/orders/${createdBody.id}`);
    expect(orderDetailResponseSchema.parse(detail.body)).toMatchObject({
      totalCents: 3000,
      tests: [
        {
          labTestId: "test-cbc",
          testCode: "CBC",
          testName: "Complete Blood Count",
          priceCents: 3000,
          turnaroundHours: 12,
        },
      ],
    });
  });
});

describe("order status", () => {
  test("allows only forward transitions and rejects terminal changes", async () => {
    const created = await json("/api/orders", createBody({ testIds: ["test-cbc"] }));
    const createdBody = orderDetailResponseSchema.parse(created.body);
    const started = await json(`/api/orders/${createdBody.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "in_progress" }),
    });
    expect(orderDetailResponseSchema.parse(started.body)).toMatchObject({ status: "in_progress" });

    const skipped = await json(`/api/orders/${createdBody.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "pending" }),
    });
    expect(skipped.response.status).toBe(409);
    expect(apiErrorSchema.parse(skipped.body)).toMatchObject({ code: "INVALID_STATUS_TRANSITION" });

    const completed = await json(`/api/orders/${createdBody.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "completed" }),
    });
    expect(orderDetailResponseSchema.parse(completed.body)).toMatchObject({ status: "completed" });

    const afterComplete = await json(`/api/orders/${createdBody.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "cancelled" }),
    });
    expect(afterComplete.response.status).toBe(409);
  });

  test("rejects a status update when another request already changed it", async () => {
    const created = await json("/api/orders", createBody({ testIds: ["test-cbc"] }));
    const createdBody = orderDetailResponseSchema.parse(created.body);
    await transitionOrderStatus(database.db, createdBody.id, "pending", "in_progress");

    await expect(
      transitionOrderStatus(database.db, createdBody.id, "pending", "cancelled"),
    ).rejects.toMatchObject({
      code: "STATUS_CONFLICT",
      status: 409,
    });

    const detail = orderDetailResponseSchema.parse(
      (await json(`/api/orders/${createdBody.id}`)).body,
    );
    expect(detail.status).toBe("in_progress");
  });
});
