import { apiErrorSchema, type ApiError } from "@lab-orders/contracts";
import { z } from "zod";

export class ApiRequestError extends Error {
  constructor(
    public readonly status: number,
    public readonly error: ApiError,
  ) {
    super(error.message);
  }
}

export async function apiRequest<T>(
  path: string,
  schema: z.ZodType<T>,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(path, init);
  const body: unknown = await response.json();
  if (!response.ok) {
    const parsed = apiErrorSchema.safeParse(body);
    throw new ApiRequestError(
      response.status,
      parsed.success
        ? parsed.data
        : { code: "UNEXPECTED_RESPONSE", message: "The server returned an unexpected error" },
    );
  }
  return schema.parse(body);
}
