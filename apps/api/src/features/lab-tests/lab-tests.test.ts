import {
  apiErrorSchema,
  labTestListResponseSchema,
  labTestResponseSchema,
} from "@lab-orders/contracts";
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { createApp } from "@/app";
import { labTests } from "@/db/schema";
import { createTestDatabase } from "@/test-support/database";

let database: Awaited<ReturnType<typeof createTestDatabase>>;
let app: ReturnType<typeof createApp>;

const now = "2025-01-01T00:00:00.000Z";
const testRows = [
  {
    id: "t-cbc",
    code: "CBC",
    name: "Complete Blood Count",
    priceCents: 3000,
    turnaroundHours: 12,
    active: true,
  },
  {
    id: "t-cmp",
    code: "CMP",
    name: "Comprehensive Metabolic Panel",
    priceCents: 4500,
    turnaroundHours: 24,
    active: true,
  },
  {
    id: "t-tsh",
    code: "TSH",
    name: "Thyroid Stimulating Hormone",
    priceCents: 4100,
    turnaroundHours: 36,
    active: false,
  },
];

beforeEach(async () => {
  database = await createTestDatabase();
  app = createApp(database.db);
  await database.db
    .insert(labTests)
    .values(testRows.map((row) => ({ ...row, createdAt: now, updatedAt: now })));
});

afterEach(async () => database.cleanup());

async function json(path: string, init?: RequestInit) {
  const response = await app.request(path, init);
  return { response, body: await response.json() };
}

function requireCursor(nextCursor: string | null) {
  if (nextCursor === null) {
    throw new Error("expected a pagination cursor");
  }
  return nextCursor;
}

describe("lab test reads", () => {
  test("lists tests in deterministic code order with cursor pagination", async () => {
    const first = await json("/api/tests?limit=2");
    const firstBody = labTestListResponseSchema.parse(first.body);
    expect(first.response.status).toBe(200);
    expect(firstBody.items.map((item) => item.id)).toEqual(["t-cbc", "t-cmp"]);
    expect(firstBody.hasMore).toBe(true);

    const second = await json(
      `/api/tests?limit=2&after=${encodeURIComponent(requireCursor(firstBody.nextCursor))}`,
    );
    const secondBody = labTestListResponseSchema.parse(second.body);
    expect(secondBody.items.map((item) => item.id)).toEqual(["t-tsh"]);
    expect(secondBody).toMatchObject({ hasMore: false, nextCursor: null });
  });

  test("searches code and name before pagination", async () => {
    const byCode = await json("/api/tests?search=cbc");
    expect(labTestListResponseSchema.parse(byCode.body).items.map((item) => item.id)).toEqual([
      "t-cbc",
    ]);

    const byName = await json("/api/tests?search=metabolic&limit=1");
    expect(labTestListResponseSchema.parse(byName.body).items[0]?.id).toBe("t-cmp");
  });

  test("matches non-ASCII catalog names with the same folding as SQLite", async () => {
    await database.db.insert(labTests).values({
      id: "t-eluate",
      code: "ELU",
      name: "Élution Panel",
      priceCents: 1200,
      turnaroundHours: 6,
      active: true,
      createdAt: now,
      updatedAt: now,
    });
    const result = await json("/api/tests?search=%C3%89LUTION");
    expect(labTestListResponseSchema.parse(result.body).items.map((item) => item.id)).toEqual([
      "t-eluate",
    ]);
  });

  test("filters by active status before pagination", async () => {
    const active = await json("/api/tests?active=true");
    expect(labTestListResponseSchema.parse(active.body).items.map((item) => item.id)).toEqual([
      "t-cbc",
      "t-cmp",
    ]);
    const inactive = await json("/api/tests?active=false");
    expect(labTestListResponseSchema.parse(inactive.body).items.map((item) => item.id)).toEqual([
      "t-tsh",
    ]);
  });

  test("composes search and active filters", async () => {
    const result = await json("/api/tests?search=complete&active=true");
    expect(labTestListResponseSchema.parse(result.body).items.map((item) => item.id)).toEqual([
      "t-cbc",
    ]);
  });

  test("rejects malformed and filter-mismatched cursors", async () => {
    expect((await json("/api/tests?after=bad-cursor")).response.status).toBe(400);

    const searched = await json("/api/tests?search=c&limit=1");
    const searchedBody = labTestListResponseSchema.parse(searched.body);
    const searchMismatch = await json(
      `/api/tests?search=tsh&after=${encodeURIComponent(requireCursor(searchedBody.nextCursor))}`,
    );
    expect(searchMismatch.response.status).toBe(400);
    expect(apiErrorSchema.parse(searchMismatch.body)).toMatchObject({ code: "INVALID_CURSOR" });

    const active = await json("/api/tests?active=true&limit=1");
    const activeBody = labTestListResponseSchema.parse(active.body);
    const activeMismatch = await json(
      `/api/tests?active=false&after=${encodeURIComponent(requireCursor(activeBody.nextCursor))}`,
    );
    expect(activeMismatch.response.status).toBe(400);
  });

  test("gets a test and returns a consistent not-found error", async () => {
    expect(labTestResponseSchema.parse((await json("/api/tests/t-cbc")).body)).toMatchObject({
      id: "t-cbc",
      code: "CBC",
    });
    const missing = await json("/api/tests/missing");
    expect(missing.response.status).toBe(404);
    expect(apiErrorSchema.parse(missing.body)).toEqual({
      code: "LAB_TEST_NOT_FOUND",
      message: "Lab test not found",
    });
  });
});

describe("lab test writes", () => {
  test("creates a normalized lab test", async () => {
    const created = await json("/api/tests", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        code: "  lipid ",
        name: " Lipid Panel ",
        priceCents: 3800,
        turnaroundHours: 24,
      }),
    });
    const createdBody = labTestResponseSchema.parse(created.body);
    expect(created.response.status).toBe(201);
    expect(created.response.headers.get("location")).toBe(`/api/tests/${createdBody.id}`);
    expect(createdBody).toMatchObject({
      code: "LIPID",
      name: "Lipid Panel",
      priceCents: 3800,
      turnaroundHours: 24,
      active: true,
    });
  });

  test("returns 409 when creating or renaming onto a duplicate code", async () => {
    const created = await json("/api/tests", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        code: "cbc",
        name: "Duplicate",
        priceCents: 100,
        turnaroundHours: 1,
      }),
    });
    expect(created.response.status).toBe(409);
    expect(apiErrorSchema.parse(created.body)).toMatchObject({
      code: "DUPLICATE_CODE",
      message: "A lab test with this code already exists",
    });

    const renamed = await json("/api/tests/t-cmp", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code: "CBC" }),
    });
    expect(renamed.response.status).toBe(409);
  });

  test("patches a test including active status without replacing omitted fields", async () => {
    const updated = await json("/api/tests/t-cbc", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: " CBC Panel ", active: false }),
    });
    expect(updated.response.status).toBe(200);
    expect(labTestResponseSchema.parse(updated.body)).toMatchObject({
      id: "t-cbc",
      code: "CBC",
      name: "CBC Panel",
      priceCents: 3000,
      active: false,
    });
  });

  test("returns validation errors for invalid cents and turnaround", async () => {
    const invalid = await json("/api/tests", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        code: "BAD",
        name: "Bad",
        priceCents: -5,
        turnaroundHours: 0,
      }),
    });
    expect(invalid.response.status).toBe(422);
    expect(apiErrorSchema.parse(invalid.body)).toMatchObject({
      code: "VALIDATION_ERROR",
      message: "Request validation failed",
    });
  });

  test("returns not found when patching an unknown test", async () => {
    const missing = await json("/api/tests/missing", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Nope" }),
    });
    expect(missing.response.status).toBe(404);
    expect(apiErrorSchema.parse(missing.body)).toMatchObject({ code: "LAB_TEST_NOT_FOUND" });
  });
});
