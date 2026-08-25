import {
  createPatientSchema,
  patientListResponseSchema,
  patientResponseSchema,
  type CreatePatient,
  type PatchPatient,
} from "@lab-orders/contracts";
import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import { apiRequest } from "@/api/client";

export const patientKeys = {
  all: ["patients"] as const,
  lists: () => [...patientKeys.all, "list"] as const,
  list: (search: string) => [...patientKeys.lists(), search] as const,
  details: () => [...patientKeys.all, "detail"] as const,
  detail: (id: string) => [...patientKeys.details(), id] as const,
};

export function patientListOptions(search: string) {
  return infiniteQueryOptions({
    queryKey: patientKeys.list(search),
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams({ limit: "20" });
      if (search) params.set("search", search);
      if (pageParam) params.set("after", pageParam);
      return apiRequest(`/api/patients?${params}`, patientListResponseSchema);
    },
    initialPageParam: "",
    getNextPageParam: (page) => page.nextCursor ?? undefined,
  });
}

export function patientDetailOptions(id: string) {
  return queryOptions({
    queryKey: patientKeys.detail(id),
    queryFn: () => apiRequest(`/api/patients/${id}`, patientResponseSchema),
  });
}

export function createPatient(input: CreatePatient) {
  return apiRequest("/api/patients", patientResponseSchema, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(createPatientSchema.parse(input)),
  });
}

export function updatePatient(id: string, input: PatchPatient) {
  return apiRequest(`/api/patients/${id}`, patientResponseSchema, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
}
