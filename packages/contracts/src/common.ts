import { z } from "zod";

export const apiErrorSchema = z
  .object({
    code: z.string().min(1),
    message: z.string().min(1),
    details: z.unknown().optional(),
  })
  .strict();

export type ApiError = z.infer<typeof apiErrorSchema>;
