import {
  createLabTestSchema,
  patchLabTestSchema,
  labTestListQuerySchema,
  type LabTestListResponse,
  type LabTestResponse,
} from "@lab-orders/contracts";
import { and, asc, eq, or, sql } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import type { AppDatabase } from "@/db/client";
import { labTests } from "@/db/schema";
import { apiError, readRequestJson, toApiErrorIssues } from "@/http";
import { decodeCursor, encodeCursor, foldSearchText } from "@/pagination";
import { isUniqueCodeError } from "./unique-code-error";

const cursorSchema = z.object({
  search: z.string(),
  active: z.enum(["true", "false", ""]),
  code: z.string(),
  id: z.string(),
});

function toResponse(row: typeof labTests.$inferSelect): LabTestResponse {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    priceCents: row.priceCents,
    turnaroundHours: row.turnaroundHours,
    active: row.active,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function createLabTestRoutes(db: AppDatabase) {
  const app = new Hono();

  app.get("/", async (context) => {
    const parsed = labTestListQuerySchema.safeParse(context.req.query());
    if (!parsed.success) {
      return context.json(
        apiError(
          "VALIDATION_ERROR",
          "Query validation failed",
          toApiErrorIssues(parsed.error.issues),
        ),
        400,
      );
    }

    const search = foldSearchText(parsed.data.search ?? "");
    const activeFilter =
      parsed.data.active === undefined ? "" : parsed.data.active ? "true" : "false";
    const cursor = parsed.data.after ? decodeCursor(parsed.data.after, cursorSchema) : undefined;
    if (
      parsed.data.after &&
      (!cursor || cursor.search !== search || cursor.active !== activeFilter)
    ) {
      return context.json(apiError("INVALID_CURSOR", "Cursor is invalid for this search"), 400);
    }

    const searchCondition = search
      ? or(
          sql`instr(lower(${labTests.code}), ${search}) > 0`,
          sql`instr(lower(${labTests.name}), ${search}) > 0`,
        )
      : undefined;
    const activeCondition =
      parsed.data.active === undefined ? undefined : eq(labTests.active, parsed.data.active);
    const cursorCondition = cursor
      ? sql`(
          ${labTests.code} > ${cursor.code}
          or (${labTests.code} = ${cursor.code} and ${labTests.id} > ${cursor.id})
        )`
      : undefined;

    const rows = await db
      .select()
      .from(labTests)
      .where(and(searchCondition, activeCondition, cursorCondition))
      .orderBy(asc(labTests.code), asc(labTests.id))
      .limit(parsed.data.limit + 1);
    const hasMore = rows.length > parsed.data.limit;
    const page = rows.slice(0, parsed.data.limit);
    const last = page.at(-1);
    const response: LabTestListResponse = {
      items: page.map(toResponse),
      hasMore,
      nextCursor:
        hasMore && last
          ? encodeCursor({
              search,
              active: activeFilter,
              code: last.code,
              id: last.id,
            })
          : null,
    };
    return context.json(response);
  });

  app.get("/:id", async (context) => {
    const row = await db.query.labTests.findFirst({
      where: eq(labTests.id, context.req.param("id")),
    });
    if (!row) return context.json(apiError("LAB_TEST_NOT_FOUND", "Lab test not found"), 404);
    return context.json(toResponse(row));
  });

  app.post("/", async (context) => {
    const body = await readRequestJson(context);
    if ("error" in body) return context.json(body.error, 400);
    const parsed = createLabTestSchema.safeParse(body.data);
    if (!parsed.success) {
      return context.json(
        apiError(
          "VALIDATION_ERROR",
          "Request validation failed",
          toApiErrorIssues(parsed.error.issues),
        ),
        422,
      );
    }

    const now = new Date().toISOString();
    const row: typeof labTests.$inferSelect = {
      id: crypto.randomUUID(),
      code: parsed.data.code,
      name: parsed.data.name,
      priceCents: parsed.data.priceCents,
      turnaroundHours: parsed.data.turnaroundHours,
      active: parsed.data.active,
      createdAt: now,
      updatedAt: now,
    };
    try {
      await db.insert(labTests).values(row);
    } catch (cause) {
      if (isUniqueCodeError(cause)) {
        return context.json(
          apiError("DUPLICATE_CODE", "A lab test with this code already exists"),
          409,
        );
      }
      throw cause;
    }
    context.header("Location", `/api/tests/${row.id}`);
    return context.json(toResponse(row), 201);
  });

  app.patch("/:id", async (context) => {
    const body = await readRequestJson(context);
    if ("error" in body) return context.json(body.error, 400);
    const parsed = patchLabTestSchema.safeParse(body.data);
    if (!parsed.success) {
      return context.json(
        apiError(
          "VALIDATION_ERROR",
          "Request validation failed",
          toApiErrorIssues(parsed.error.issues),
        ),
        422,
      );
    }

    const existing = await db.query.labTests.findFirst({
      where: eq(labTests.id, context.req.param("id")),
    });
    if (!existing) return context.json(apiError("LAB_TEST_NOT_FOUND", "Lab test not found"), 404);

    const changes = {
      ...parsed.data,
      updatedAt: new Date().toISOString(),
    };
    try {
      await db.update(labTests).set(changes).where(eq(labTests.id, existing.id));
    } catch (cause) {
      if (isUniqueCodeError(cause)) {
        return context.json(
          apiError("DUPLICATE_CODE", "A lab test with this code already exists"),
          409,
        );
      }
      throw cause;
    }
    return context.json(toResponse({ ...existing, ...changes }));
  });

  return app;
}
