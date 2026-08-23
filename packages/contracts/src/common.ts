import { z } from "zod";

export const apiErrorIssueSchema = z
  .object({
    path: z.array(z.string()),
    message: z.string().min(1),
  })
  .strip();

export const apiErrorSchema = z
  .object({
    code: z.string().min(1),
    message: z.string().min(1),
    details: z.array(apiErrorIssueSchema).optional(),
  })
  .strict();

export type ApiErrorIssue = z.infer<typeof apiErrorIssueSchema>;
export type ApiError = z.infer<typeof apiErrorSchema>;
