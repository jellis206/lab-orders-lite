import {
  createPatientSchema,
  patchPatientSchema,
  patientListQuerySchema,
  type PatientListResponse,
  type PatientResponse,
} from "@lab-orders/contracts";
import { and, asc, eq, or, sql } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import type { AppDatabase } from "../db/client";
import { patients } from "../db/schema";
import { apiError, readRequestJson, toApiErrorIssues } from "../http";

const cursorSchema = z.object({
  search: z.string(),
  lastName: z.string(),
  firstName: z.string(),
  id: z.string(),
});

type Cursor = z.infer<typeof cursorSchema>;

function encodeCursor(cursor: Cursor) {
  const bytes = new TextEncoder().encode(JSON.stringify(cursor));
  return btoa(String.fromCharCode(...bytes));
}

function decodeCursor(value: string): Cursor | undefined {
  try {
    const bytes = Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
    return cursorSchema.parse(JSON.parse(new TextDecoder().decode(bytes)));
  } catch {
    return undefined;
  }
}

function toResponse(row: typeof patients.$inferSelect): PatientResponse {
  return {
    id: row.id,
    firstName: row.firstName,
    lastName: row.lastName,
    dateOfBirth: row.dateOfBirth,
    email: row.email,
    phone: row.phone,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function createPatientRoutes(db: AppDatabase) {
  const app = new Hono();

  app.get("/", async (context) => {
    const parsed = patientListQuerySchema.safeParse(context.req.query());
    if (!parsed.success) {
      return context.json(
        apiError("VALIDATION_ERROR", "Query validation failed", toApiErrorIssues(parsed.error.issues)),
        400,
      );
    }

    const search = parsed.data.search?.toLocaleLowerCase() ?? "";
    const cursor = parsed.data.after ? decodeCursor(parsed.data.after) : undefined;
    if (parsed.data.after && (!cursor || cursor.search !== search)) {
      return context.json(apiError("INVALID_CURSOR", "Cursor is invalid for this search"), 400);
    }

    const searchCondition = search
      ? or(
          sql`instr(lower(${patients.firstName}), ${search}) > 0`,
          sql`instr(lower(${patients.lastName}), ${search}) > 0`,
          sql`instr(lower(coalesce(${patients.email}, '')), ${search}) > 0`,
          sql`instr(lower(coalesce(${patients.phone}, '')), ${search}) > 0`,
        )
      : undefined;
    const cursorCondition = cursor
      ? sql`(
          lower(${patients.lastName}) > ${cursor.lastName}
          or (lower(${patients.lastName}) = ${cursor.lastName} and lower(${patients.firstName}) > ${cursor.firstName})
          or (lower(${patients.lastName}) = ${cursor.lastName} and lower(${patients.firstName}) = ${cursor.firstName} and ${patients.id} > ${cursor.id})
        )`
      : undefined;

    const rows = await db
      .select()
      .from(patients)
      .where(and(searchCondition, cursorCondition))
      .orderBy(
        asc(sql`lower(${patients.lastName})`),
        asc(sql`lower(${patients.firstName})`),
        asc(patients.id),
      )
      .limit(parsed.data.limit + 1);
    const hasMore = rows.length > parsed.data.limit;
    const page = rows.slice(0, parsed.data.limit);
    const last = page.at(-1);
    const response: PatientListResponse = {
      items: page.map(toResponse),
      hasMore,
      nextCursor:
        hasMore && last
          ? encodeCursor({
              search,
              lastName: last.lastName.toLocaleLowerCase(),
              firstName: last.firstName.toLocaleLowerCase(),
              id: last.id,
            })
          : null,
    };
    return context.json(response);
  });

  app.get("/:id", async (context) => {
    const row = await db.query.patients.findFirst({
      where: eq(patients.id, context.req.param("id")),
    });
    if (!row) return context.json(apiError("PATIENT_NOT_FOUND", "Patient not found"), 404);
    return context.json(toResponse(row));
  });

  app.post("/", async (context) => {
    const body = await readRequestJson(context);
    if ("error" in body) return context.json(body.error, 400);
    const parsed = createPatientSchema.safeParse(body.data);
    if (!parsed.success) {
      return context.json(
        apiError("VALIDATION_ERROR", "Request validation failed", toApiErrorIssues(parsed.error.issues)),
        422,
      );
    }

    const now = new Date().toISOString();
    const row: typeof patients.$inferSelect = {
      id: crypto.randomUUID(),
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      dateOfBirth: parsed.data.dateOfBirth,
      email: parsed.data.email ?? null,
      phone: parsed.data.phone ?? null,
      createdAt: now,
      updatedAt: now,
    };
    await db.insert(patients).values(row);
    context.header("Location", `/api/patients/${row.id}`);
    return context.json(toResponse(row), 201);
  });

  app.patch("/:id", async (context) => {
    const body = await readRequestJson(context);
    if ("error" in body) return context.json(body.error, 400);
    const parsed = patchPatientSchema.safeParse(body.data);
    if (!parsed.success) {
      return context.json(
        apiError("VALIDATION_ERROR", "Request validation failed", toApiErrorIssues(parsed.error.issues)),
        422,
      );
    }

    const existing = await db.query.patients.findFirst({
      where: eq(patients.id, context.req.param("id")),
    });
    if (!existing) return context.json(apiError("PATIENT_NOT_FOUND", "Patient not found"), 404);

    const changes: Partial<typeof patients.$inferSelect> & { updatedAt: string } = {
      ...parsed.data,
      updatedAt: new Date().toISOString(),
    };
    if (Object.hasOwn(parsed.data, "email")) {
      changes.email = parsed.data.email ?? null;
    }
    if (Object.hasOwn(parsed.data, "phone")) {
      changes.phone = parsed.data.phone ?? null;
    }
    const next = { ...existing, ...changes };
    if (!next.email && !next.phone) {
      return context.json(
        apiError("VALIDATION_ERROR", "Request validation failed", [
          { path: ["email"], message: "Provide an email or phone number so we can share results" },
        ]),
        422,
      );
    }
    await db.update(patients).set(changes).where(eq(patients.id, existing.id));
    return context.json(toResponse({ ...existing, ...changes }));
  });

  return app;
}
