import {
  createOrderSchema,
  orderDetailResponseSchema,
  orderListResponseSchema,
  type CreateOrder,
  type PatchOrderStatus,
} from "@lab-orders/contracts";
import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import { apiRequest } from "../../api/client";

export const orderKeys = {
  all: ["orders"] as const,
  lists: () => [...orderKeys.all, "list"] as const,
  list: (search: string, status?: string) => [...orderKeys.lists(), search, status] as const,
  details: () => [...orderKeys.all, "detail"] as const,
  detail: (id: string) => [...orderKeys.details(), id] as const,
};

export function orderListOptions(search: string, status?: string) {
  return infiniteQueryOptions({
    queryKey: orderKeys.list(search, status),
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams({ limit: "20" });
      if (search) params.set("search", search);
      if (status) params.set("status", status);
      if (pageParam) params.set("after", pageParam);
      return apiRequest(`/api/orders?${params}`, orderListResponseSchema);
    },
    initialPageParam: "",
    getNextPageParam: (page) => page.nextCursor ?? undefined,
  });
}

export function orderDetailOptions(id: string) {
  return queryOptions({
    queryKey: orderKeys.detail(id),
    queryFn: () => apiRequest(`/api/orders/${id}`, orderDetailResponseSchema),
  });
}

export function createOrder(input: CreateOrder) {
  return apiRequest("/api/orders", orderDetailResponseSchema, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(createOrderSchema.parse(input)),
  });
}

export function updateOrderStatus(id: string, input: PatchOrderStatus) {
  return apiRequest(`/api/orders/${id}`, orderDetailResponseSchema, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
}
