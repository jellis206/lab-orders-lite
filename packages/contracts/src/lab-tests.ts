import { z } from "zod";

const requiredCodeSchema = z
  .string()
  .trim()
  .min(1, "Code is required")
  .max(32, "Code must be 32 characters or fewer")
  .transform((value) => value.toUpperCase());

const requiredNameSchema = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(120, "Name must be 120 characters or fewer");

const priceCentsSchema = z
  .number({ error: "Price must be a whole number of cents" })
  .int("Price must be a whole number of cents")
  .min(0, "Price cannot be negative");

const turnaroundHoursSchema = z
  .number({ error: "Turnaround must be a whole number of hours" })
  .int("Turnaround must be a whole number of hours")
  .min(1, "Turnaround must be at least 1 hour");

export const createLabTestSchema = z
  .object({
    code: requiredCodeSchema,
    name: requiredNameSchema,
    priceCents: priceCentsSchema,
    turnaroundHours: turnaroundHoursSchema,
    active: z.boolean().default(true),
  })
  .strict();

export const patchLabTestSchema = z
  .object({
    code: requiredCodeSchema.optional(),
    name: requiredNameSchema.optional(),
    priceCents: priceCentsSchema.optional(),
    turnaroundHours: turnaroundHoursSchema.optional(),
    active: z.boolean().optional(),
  })
  .strict();

export const labTestResponseSchema = z
  .object({
    id: z.string().min(1),
    code: z.string(),
    name: z.string(),
    priceCents: z.number().int(),
    turnaroundHours: z.number().int(),
    active: z.boolean(),
    createdAt: z.iso.datetime({ offset: true }),
    updatedAt: z.iso.datetime({ offset: true }),
  })
  .strict();

export const labTestListQuerySchema = z
  .object({
    search: z
      .string()
      .trim()
      .max(200)
      .optional()
      .transform((value) => value || undefined),
    active: z
      .enum(["true", "false"])
      .optional()
      .transform((value) => (value === undefined ? undefined : value === "true")),
    limit: z.coerce.number().int().min(1).max(50).default(20),
    after: z.string().min(1).optional(),
  })
  .strict();

export const labTestListResponseSchema = z
  .object({
    items: z.array(labTestResponseSchema),
    nextCursor: z.string().min(1).nullable(),
    hasMore: z.boolean(),
  })
  .strict();

export type CreateLabTest = z.infer<typeof createLabTestSchema>;
export type PatchLabTest = z.infer<typeof patchLabTestSchema>;
export type LabTestResponse = z.infer<typeof labTestResponseSchema>;
export type LabTestListQuery = z.infer<typeof labTestListQuerySchema>;
export type LabTestListResponse = z.infer<typeof labTestListResponseSchema>;
