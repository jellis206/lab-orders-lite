import { z } from "zod";

const requiredNameSchema = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(100, "Name must be 100 characters or fewer");

const calendarDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date of birth must use YYYY-MM-DD")
  .refine((value) => {
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year!, month! - 1, day));
    return (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month! - 1 &&
      date.getUTCDate() === day
    );
  }, "Date of birth must be a valid calendar date")
  .refine((value) => value <= new Date().toISOString().slice(0, 10), {
    message: "Date of birth cannot be in the future",
  });

const emailSchema = z.string().trim().email("Enter a valid email address");

const phoneSchema = z
  .string()
  .trim()
  .min(1, "Phone number cannot be blank")
  .refine((value) => /^[+]?[0-9() .-]+$/.test(value) && value.replace(/\D/g, "").length >= 7, {
    message: "Enter a valid phone number",
  });

function optionalContact(schema: z.ZodType<string>) {
  return z.preprocess((value) => {
    const parsed = z.string().safeParse(value);
    if (parsed.success && parsed.data.trim() === "") return undefined;
    return value;
  }, schema.optional());
}

export const contactRequiredMessage = "Provide an email or phone number so we can share results";

export function hasContactMethod(value: { email?: string | null; phone?: string | null }) {
  return Boolean(value.email || value.phone);
}

export function contactAfterPatientPatch(
  existing: { email: string | null; phone: string | null },
  patch: { email?: string; phone?: string },
) {
  return {
    email: Object.hasOwn(patch, "email") ? (patch.email ?? null) : existing.email,
    phone: Object.hasOwn(patch, "phone") ? (patch.phone ?? null) : existing.phone,
  };
}

function requireContactMethod(value: { email?: string; phone?: string }, context: z.RefinementCtx) {
  if (hasContactMethod(value)) return;
  context.addIssue({ code: "custom", path: ["email"], message: contactRequiredMessage });
  context.addIssue({ code: "custom", path: ["phone"], message: contactRequiredMessage });
}

const patientFields = {
  firstName: requiredNameSchema,
  lastName: requiredNameSchema,
  dateOfBirth: calendarDateSchema,
  email: optionalContact(emailSchema),
  phone: optionalContact(phoneSchema),
};

export const createPatientSchema = z
  .object(patientFields)
  .strict()
  .superRefine(requireContactMethod);

export const patchPatientSchema = z
  .object(patientFields)
  .partial()
  .strict()
  .superRefine((value, context) => {
    if (!Object.hasOwn(value, "email") || !Object.hasOwn(value, "phone")) return;
    requireContactMethod(value, context);
  });

export const patientResponseSchema = z
  .object({
    id: z.string().min(1),
    firstName: z.string(),
    lastName: z.string(),
    dateOfBirth: z.string(),
    email: z.string().nullable(),
    phone: z.string().nullable(),
    createdAt: z.iso.datetime({ offset: true }),
    updatedAt: z.iso.datetime({ offset: true }),
  })
  .strict();

export const patientListQuerySchema = z
  .object({
    search: z
      .string()
      .trim()
      .max(200)
      .optional()
      .transform((value) => value || undefined),
    limit: z.coerce.number().int().min(1).max(50).default(20),
    after: z.string().min(1).optional(),
  })
  .strict();

export const patientListResponseSchema = z
  .object({
    items: z.array(patientResponseSchema),
    nextCursor: z.string().min(1).nullable(),
    hasMore: z.boolean(),
  })
  .strict();

export type CreatePatient = z.infer<typeof createPatientSchema>;
export type PatchPatient = z.infer<typeof patchPatientSchema>;
export type PatientResponse = z.infer<typeof patientResponseSchema>;
export type PatientListQuery = z.infer<typeof patientListQuerySchema>;
export type PatientListResponse = z.infer<typeof patientListResponseSchema>;
