import { z } from "zod";

export * from "./common";
export * from "./lab-tests";
export * from "./money";
export * from "./patients";

export const healthResponseSchema = z.object({
  status: z.literal("ok"),
  service: z.literal("lab-orders-api"),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;
