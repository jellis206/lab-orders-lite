import {
  createOrderSchema,
  orderListQuerySchema,
  patchOrderStatusSchema,
  type OrderDetailResponse,
  type OrderListResponse,
  type OrderSummaryResponse,
} from "@lab-orders/contracts";
import { and, desc, eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import type { AppDatabase } from "@/db/client";
import { orderTests, orders, patients } from "@/db/schema";
import { apiError, readRequestJson, toApiErrorIssues } from "@/http";
import { decodeCursor, encodeCursor, foldSearchText } from "@/pagination";
import {
  createOrderRecord,
  loadOrderDetail,
  OrderServiceError,
  transitionOrderStatus,
} from "./order.service";

const cursorSchema = z.object({
  search: z.string(),
  status: z.string(),
  orderedAt: z.string(),
  id: z.string(),
});

function serviceError(cause: OrderServiceError) {
  return apiError(cause.code, cause.message);
}

function toSummary(row: {
  id: string;
  patientId: string;
  patientFirstName: string;
  patientLastName: string;
  status: OrderSummaryResponse["status"];
  orderedAt: string;
  testCount: number;
  totalCents: number;
  estimatedReadyAt: string;
  createdAt: string;
  updatedAt: string;
}): OrderSummaryResponse {
  return {
    id: row.id,
    patientId: row.patientId,
    patientFirstName: row.patientFirstName,
    patientLastName: row.patientLastName,
    status: row.status,
    orderedAt: row.orderedAt,
    testCount: row.testCount,
    totalCents: row.totalCents,
    estimatedReadyAt: row.estimatedReadyAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function createOrderRoutes(db: AppDatabase) {
  const app = new Hono();

  app.get("/", async (context) => {
    const parsed = orderListQuerySchema.safeParse(context.req.query());
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
    const status = parsed.data.status ?? "";
    const cursor = parsed.data.after ? decodeCursor(parsed.data.after, cursorSchema) : undefined;
    if (parsed.data.after && (!cursor || cursor.search !== search || cursor.status !== status)) {
      return context.json(apiError("INVALID_CURSOR", "Cursor is invalid for this search"), 400);
    }

    const searchCondition = search
      ? sql`(
          instr(lower(${patients.firstName}), ${search}) > 0
          or instr(lower(${patients.lastName}), ${search}) > 0
        )`
      : undefined;
    const statusCondition = parsed.data.status ? eq(orders.status, parsed.data.status) : undefined;
    const cursorCondition = cursor
      ? sql`(
          ${orders.orderedAt} < ${cursor.orderedAt}
          or (${orders.orderedAt} = ${cursor.orderedAt} and ${orders.id} < ${cursor.id})
        )`
      : undefined;

    const rows = await db
      .select({
        id: orders.id,
        patientId: orders.patientId,
        patientFirstName: patients.firstName,
        patientLastName: patients.lastName,
        status: orders.status,
        orderedAt: orders.orderedAt,
        testCount: sql<number>`(
          select count(*) from ${orderTests} where ${orderTests.orderId} = ${orders.id}
        )`,
        totalCents: orders.totalCents,
        estimatedReadyAt: orders.estimatedReadyAt,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
      })
      .from(orders)
      .innerJoin(patients, eq(orders.patientId, patients.id))
      .where(and(searchCondition, statusCondition, cursorCondition))
      .orderBy(desc(orders.orderedAt), desc(orders.id))
      .limit(parsed.data.limit + 1);

    const hasMore = rows.length > parsed.data.limit;
    const page = rows
      .slice(0, parsed.data.limit)
      .map((row) => toSummary({ ...row, testCount: Number(row.testCount) }));
    const last = page.at(-1);
    const response: OrderListResponse = {
      items: page,
      hasMore,
      nextCursor:
        hasMore && last
          ? encodeCursor({
              search,
              status,
              orderedAt: last.orderedAt,
              id: last.id,
            })
          : null,
    };
    return context.json(response);
  });

  app.get("/:id", async (context) => {
    const detail = await loadOrderDetail(db, context.req.param("id"));
    if (!detail) return context.json(apiError("ORDER_NOT_FOUND", "Order not found"), 404);
    return context.json(detail);
  });

  app.post("/", async (context) => {
    const body = await readRequestJson(context);
    if ("error" in body) return context.json(body.error, 400);
    const parsed = createOrderSchema.safeParse(body.data);
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

    try {
      const created = await createOrderRecord(db, parsed.data);
      const response: OrderDetailResponse = {
        id: created.order.id,
        patientId: created.patient.id,
        patientFirstName: created.patient.firstName,
        patientLastName: created.patient.lastName,
        status: created.order.status,
        orderedAt: created.order.orderedAt,
        testCount: created.snapshots.length,
        totalCents: created.order.totalCents,
        estimatedReadyAt: created.order.estimatedReadyAt,
        createdAt: created.order.createdAt,
        updatedAt: created.order.updatedAt,
        tests: created.snapshots,
      };
      context.header("Location", `/api/orders/${created.order.id}`);
      return context.json(response, 201);
    } catch (cause) {
      if (cause instanceof OrderServiceError) {
        return context.json(serviceError(cause), cause.status);
      }
      throw cause;
    }
  });

  app.patch("/:id", async (context) => {
    const body = await readRequestJson(context);
    if ("error" in body) return context.json(body.error, 400);
    const parsed = patchOrderStatusSchema.safeParse(body.data);
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

    const existing = await db.query.orders.findFirst({
      where: eq(orders.id, context.req.param("id")),
    });
    if (!existing) return context.json(apiError("ORDER_NOT_FOUND", "Order not found"), 404);

    try {
      await transitionOrderStatus(db, existing.id, existing.status, parsed.data.status);
    } catch (cause) {
      if (cause instanceof OrderServiceError) {
        return context.json(serviceError(cause), cause.status);
      }
      throw cause;
    }

    const detail = await loadOrderDetail(db, existing.id);
    if (!detail) return context.json(apiError("ORDER_NOT_FOUND", "Order not found"), 404);
    return context.json(detail);
  });

  return app;
}
