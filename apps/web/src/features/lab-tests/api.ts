import {
  createLabTestSchema,
  labTestListResponseSchema,
  labTestResponseSchema,
  type CreateLabTest,
  type PatchLabTest,
} from "@lab-orders/contracts";
import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import { apiRequest } from "@/api/client";

export const labTestKeys = {
  all: ["lab-tests"] as const,
  lists: () => [...labTestKeys.all, "list"] as const,
  list: (search: string, active?: boolean) => [...labTestKeys.lists(), search, active] as const,
  details: () => [...labTestKeys.all, "detail"] as const,
  detail: (id: string) => [...labTestKeys.details(), id] as const,
};

export function labTestListOptions(search: string, active?: boolean) {
  return infiniteQueryOptions({
    queryKey: labTestKeys.list(search, active),
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams({ limit: "20" });
      if (search) params.set("search", search);
      if (active !== undefined) params.set("active", String(active));
      if (pageParam) params.set("after", pageParam);
      return apiRequest(`/api/tests?${params}`, labTestListResponseSchema);
    },
    initialPageParam: "",
    getNextPageParam: (page) => page.nextCursor ?? undefined,
  });
}

export function labTestDetailOptions(id: string) {
  return queryOptions({
    queryKey: labTestKeys.detail(id),
    queryFn: () => apiRequest(`/api/tests/${id}`, labTestResponseSchema),
  });
}

export function createLabTest(input: CreateLabTest) {
  return apiRequest("/api/tests", labTestResponseSchema, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(createLabTestSchema.parse(input)),
  });
}

export function updateLabTest(id: string, input: PatchLabTest) {
  return apiRequest(`/api/tests/${id}`, labTestResponseSchema, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
}
