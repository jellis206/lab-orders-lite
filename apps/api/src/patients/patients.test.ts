import {
  apiErrorSchema,
  patientListResponseSchema,
  patientResponseSchema,
} from "@lab-orders/contracts";
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { patients } from "../db/schema";
import { createApp } from "../app";
import { createTestDatabase } from "../test-support/database";

let database: Awaited<ReturnType<typeof createTestDatabase>>;
let app: ReturnType<typeof createApp>;

const patientRows = [
  {
    id: "p-3",
    firstName: "Amy",
    lastName: "Able",
    dateOfBirth: "1992-01-01",
    email: "amy@example.test",
    phone: null,
  },
  {
    id: "p-1",
    firstName: "Zoe",
    lastName: "Able",
    dateOfBirth: "1980-02-02",
    email: null,
    phone: "555-0101",
  },
  {
    id: "p-2",
    firstName: "Ben",
    lastName: "Baker",
    dateOfBirth: "1975-03-03",
    email: "ben@example.test",
    phone: null,
  },
];

beforeEach(async () => {
  database = await createTestDatabase();
  app = createApp(database.db);
  const now = "2025-01-01T00:00:00.000Z";
  await database.db
    .insert(patients)
    .values(patientRows.map((row) => ({ ...row, createdAt: now, updatedAt: now })));
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

describe("patient reads", () => {
  test("lists patients in deterministic name order with cursor pagination", async () => {
    const first = await json("/api/patients?limit=2");
    const firstBody = patientListResponseSchema.parse(first.body);
    expect(first.response.status).toBe(200);
    expect(firstBody.items.map((item) => item.id)).toEqual(["p-3", "p-1"]);
    expect(firstBody.hasMore).toBe(true);

    const second = await json(
      `/api/patients?limit=2&after=${encodeURIComponent(requireCursor(firstBody.nextCursor))}`,
    );
    const secondBody = patientListResponseSchema.parse(second.body);
    expect(secondBody.items.map((item) => item.id)).toEqual(["p-2"]);
    expect(secondBody).toMatchObject({ hasMore: false, nextCursor: null });
  });

  test("searches names and contact fields before pagination", async () => {
    const byName = await json("/api/patients?search=able&limit=1");
    const byNameBody = patientListResponseSchema.parse(byName.body);
    expect(byNameBody.items[0]?.id).toBe("p-3");
    expect(byNameBody.hasMore).toBe(true);

    const byEmail = await json("/api/patients?search=ben%40example.test");
    expect(patientListResponseSchema.parse(byEmail.body).items.map((item) => item.id)).toEqual([
      "p-2",
    ]);
    const byPhone = await json("/api/patients?search=0101");
    expect(patientListResponseSchema.parse(byPhone.body).items.map((item) => item.id)).toEqual([
      "p-1",
    ]);
  });

  test("matches and pages non-ASCII names with the same folding as SQLite", async () => {
    const now = "2025-01-01T00:00:00.000Z";
    await database.db.insert(patients).values([
      {
        id: "p-4",
        firstName: "Ann",
        lastName: "Øster",
        dateOfBirth: "1984-04-04",
        email: "ann@example.test",
        phone: null,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "p-5",
        firstName: "Bob",
        lastName: "Øster",
        dateOfBirth: "1985-05-05",
        email: "bob@example.test",
        phone: null,
        createdAt: now,
        updatedAt: now,
      },
    ]);

    const search = await json("/api/patients?search=%C3%98STER");
    expect(patientListResponseSchema.parse(search.body).items.map((item) => item.id)).toEqual([
      "p-4",
      "p-5",
    ]);

    const first = await json("/api/patients?search=%C3%98STER&limit=1");
    const firstBody = patientListResponseSchema.parse(first.body);
    expect(firstBody.items.map((item) => item.id)).toEqual(["p-4"]);
    const second = await json(
      `/api/patients?search=%C3%98STER&limit=1&after=${encodeURIComponent(requireCursor(firstBody.nextCursor))}`,
    );
    expect(patientListResponseSchema.parse(second.body).items.map((item) => item.id)).toEqual([
      "p-5",
    ]);
  });

  test("rejects malformed and search-mismatched cursors", async () => {
    expect((await json("/api/patients?after=bad-cursor")).response.status).toBe(400);
    const first = await json("/api/patients?search=able&limit=1");
    const firstBody = patientListResponseSchema.parse(first.body);
    const mismatch = await json(
      `/api/patients?search=baker&after=${encodeURIComponent(requireCursor(firstBody.nextCursor))}`,
    );
    expect(mismatch.response.status).toBe(400);
    expect(apiErrorSchema.parse(mismatch.body)).toMatchObject({ code: "INVALID_CURSOR" });
  });

  test("gets a patient and returns a consistent not-found error", async () => {
    expect(patientResponseSchema.parse((await json("/api/patients/p-1")).body)).toMatchObject({
      id: "p-1",
      firstName: "Zoe",
    });
    const missing = await json("/api/patients/missing");
    expect(missing.response.status).toBe(404);
    expect(apiErrorSchema.parse(missing.body)).toEqual({
      code: "PATIENT_NOT_FOUND",
      message: "Patient not found",
    });
  });
});

describe("patient writes", () => {
  test("creates a normalized patient", async () => {
    const created = await json("/api/patients", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        firstName: "  Jane ",
        lastName: " Doe ",
        dateOfBirth: "1990-05-15",
        email: " ",
        phone: "555-1212",
      }),
    });
    const createdBody = patientResponseSchema.parse(created.body);
    expect(created.response.status).toBe(201);
    expect(created.response.headers.get("location")).toBe(`/api/patients/${createdBody.id}`);
    expect(createdBody).toMatchObject({
      firstName: "Jane",
      lastName: "Doe",
      email: null,
      phone: "555-1212",
    });
  });

  test("patches a patient without replacing omitted fields", async () => {
    const updated = await json("/api/patients/p-1", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ firstName: " Zoey " }),
    });
    expect(updated.response.status).toBe(200);
    expect(patientResponseSchema.parse(updated.body)).toMatchObject({
      id: "p-1",
      firstName: "Zoey",
      lastName: "Able",
      phone: "555-0101",
    });
  });

  test("rejects creating or updating a patient without any contact method", async () => {
    const created = await json("/api/patients", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        firstName: "Jane",
        lastName: "Doe",
        dateOfBirth: "1990-05-15",
      }),
    });
    expect(created.response.status).toBe(422);

    const cleared = await json("/api/patients/p-1", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ phone: "" }),
    });
    expect(cleared.response.status).toBe(422);
  });

  test("returns validation errors and does not write invalid input", async () => {
    const invalid = await json("/api/patients", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ firstName: "", lastName: "Doe", dateOfBirth: "2999-01-01" }),
    });
    const invalidBody = apiErrorSchema.parse(invalid.body);
    expect(invalid.response.status).toBe(422);
    expect(invalidBody).toMatchObject({
      code: "VALIDATION_ERROR",
      message: "Request validation failed",
    });
    expect(invalidBody.details?.length).toBeGreaterThan(0);
  });

  test("returns not found when patching an unknown patient", async () => {
    const missing = await json("/api/patients/missing", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ firstName: "Jane" }),
    });
    expect(missing.response.status).toBe(404);
    expect(apiErrorSchema.parse(missing.body)).toMatchObject({ code: "PATIENT_NOT_FOUND" });
  });
});
