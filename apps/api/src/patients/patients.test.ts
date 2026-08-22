import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { patients } from "../db/schema";
import { createApp } from "../app";
import { createTestDatabase } from "../test/database";

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
  return { response, body: (await response.json()) as Record<string, unknown> };
}

describe("patient reads", () => {
  test("lists patients in deterministic name order with cursor pagination", async () => {
    const first = await json("/api/patients?limit=2");
    expect(first.response.status).toBe(200);
    expect((first.body.items as Array<{ id: string }>).map((item) => item.id)).toEqual([
      "p-3",
      "p-1",
    ]);
    expect(first.body.hasMore).toBe(true);

    const second = await json(
      `/api/patients?limit=2&after=${encodeURIComponent(first.body.nextCursor as string)}`,
    );
    expect((second.body.items as Array<{ id: string }>).map((item) => item.id)).toEqual(["p-2"]);
    expect(second.body).toMatchObject({ hasMore: false, nextCursor: null });
  });

  test("searches names and contact fields before pagination", async () => {
    const byName = await json("/api/patients?search=able&limit=1");
    expect((byName.body.items as Array<{ id: string }>)[0]?.id).toBe("p-3");
    expect(byName.body.hasMore).toBe(true);

    const byEmail = await json("/api/patients?search=ben%40example.test");
    expect((byEmail.body.items as Array<{ id: string }>).map((item) => item.id)).toEqual(["p-2"]);
    const byPhone = await json("/api/patients?search=0101");
    expect((byPhone.body.items as Array<{ id: string }>).map((item) => item.id)).toEqual(["p-1"]);
  });

  test("rejects malformed and search-mismatched cursors", async () => {
    expect((await json("/api/patients?after=bad-cursor")).response.status).toBe(400);
    const first = await json("/api/patients?search=able&limit=1");
    const mismatch = await json(
      `/api/patients?search=baker&after=${encodeURIComponent(first.body.nextCursor as string)}`,
    );
    expect(mismatch.response.status).toBe(400);
    expect(mismatch.body).toMatchObject({ code: "INVALID_CURSOR" });
  });

  test("gets a patient and returns a consistent not-found error", async () => {
    expect((await json("/api/patients/p-1")).body).toMatchObject({ id: "p-1", firstName: "Zoe" });
    const missing = await json("/api/patients/missing");
    expect(missing.response.status).toBe(404);
    expect(missing.body).toEqual({ code: "PATIENT_NOT_FOUND", message: "Patient not found" });
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
    expect(created.response.status).toBe(201);
    expect(created.response.headers.get("location")).toBe(`/api/patients/${created.body.id}`);
    expect(created.body).toMatchObject({
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
      body: JSON.stringify({ firstName: " Zoey ", phone: "" }),
    });
    expect(updated.response.status).toBe(200);
    expect(updated.body).toMatchObject({
      id: "p-1",
      firstName: "Zoey",
      lastName: "Able",
      phone: null,
    });
  });

  test("returns validation errors and does not write invalid input", async () => {
    const invalid = await json("/api/patients", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ firstName: "", lastName: "Doe", dateOfBirth: "2999-01-01" }),
    });
    expect(invalid.response.status).toBe(422);
    expect(invalid.body).toMatchObject({
      code: "VALIDATION_ERROR",
      message: "Request validation failed",
    });
    expect(Array.isArray(invalid.body.details)).toBe(true);
  });

  test("returns not found when patching an unknown patient", async () => {
    const missing = await json("/api/patients/missing", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ firstName: "Jane" }),
    });
    expect(missing.response.status).toBe(404);
    expect(missing.body).toMatchObject({ code: "PATIENT_NOT_FOUND" });
  });
});
