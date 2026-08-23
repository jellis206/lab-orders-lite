import type { ApiError, ApiErrorIssue } from "@lab-orders/contracts";

export type JsonRequestBody =
  | string
  | number
  | boolean
  | null
  | readonly JsonRequestBody[]
  | { readonly [key: string]: JsonRequestBody };

type JsonRequest = {
  req: {
    json: () => Promise<JsonRequestBody>;
  };
};

export function apiError(code: string, message: string, details?: readonly ApiErrorIssue[]): ApiError {
  const error: ApiError = { code, message };
  if (details !== undefined) {
    error.details = [...details];
  }
  return error;
}

export function toApiErrorIssues(
  issues: ReadonlyArray<{ path: readonly PropertyKey[]; message: string }>,
): ApiErrorIssue[] {
  return issues.map((issue) => ({
    path: issue.path.map(String),
    message: issue.message,
  }));
}

export async function readRequestJson(context: JsonRequest) {
  try {
    return { data: await context.req.json() } as const;
  } catch {
    return { error: apiError("INVALID_JSON", "Request body must be valid JSON") } as const;
  }
}
