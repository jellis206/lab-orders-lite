import { orderStatuses } from "@lab-orders/domain";
import { z } from "zod";

export const orderStatusSchema = z.enum(orderStatuses);

export const createOrderSchema = z
  .object({
    patientId: z.string().trim().min(1, "Patient is required"),
    testIds: z
      .array(z.string().trim().min(1, "Test is required"))
      .min(1, "Select at least one lab test")
      .refine((ids) => new Set(ids).size === ids.length, "Each lab test can only be selected once"),
  })
  .strict();

export const patchOrderStatusSchema = z
  .object({
    status: orderStatusSchema,
  })
  .strict();

export const orderTestResponseSchema = z
  .object({
    labTestId: z.string().min(1),
    testCode: z.string(),
    testName: z.string(),
    priceCents: z.number().int(),
    turnaroundHours: z.number().int(),
  })
  .strict();

export const orderSummaryResponseSchema = z
  .object({
    id: z.string().min(1),
    patientId: z.string().min(1),
    patientFirstName: z.string(),
    patientLastName: z.string(),
    status: orderStatusSchema,
    orderedAt: z.iso.datetime({ offset: true }),
    testCount: z.number().int().min(0),
    totalCents: z.number().int(),
    estimatedReadyAt: z.iso.datetime({ offset: true }),
    createdAt: z.iso.datetime({ offset: true }),
    updatedAt: z.iso.datetime({ offset: true }),
  })
  .strict();

export const orderDetailResponseSchema = orderSummaryResponseSchema
  .extend({
    tests: z.array(orderTestResponseSchema).min(1),
  })
  .strict();

export const orderListQuerySchema = z
  .object({
    search: z
      .string()
      .trim()
      .max(200)
      .optional()
      .transform((value) => value || undefined),
    status: orderStatusSchema.optional(),
    limit: z.coerce.number().int().min(1).max(50).default(20),
    after: z.string().min(1).optional(),
  })
  .strict();

export const orderListResponseSchema = z
  .object({
    items: z.array(orderSummaryResponseSchema),
    nextCursor: z.string().min(1).nullable(),
    hasMore: z.boolean(),
  })
  .strict();

export type OrderStatus = z.infer<typeof orderStatusSchema>;
export type CreateOrder = z.infer<typeof createOrderSchema>;
export type PatchOrderStatus = z.infer<typeof patchOrderStatusSchema>;
export type OrderTestResponse = z.infer<typeof orderTestResponseSchema>;
export type OrderSummaryResponse = z.infer<typeof orderSummaryResponseSchema>;
export type OrderDetailResponse = z.infer<typeof orderDetailResponseSchema>;
export type OrderListQuery = z.infer<typeof orderListQuerySchema>;
export type OrderListResponse = z.infer<typeof orderListResponseSchema>;
