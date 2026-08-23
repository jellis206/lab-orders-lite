import { QueryClient } from "@tanstack/react-query";
import { ApiRequestError } from "./api/client";

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: (count, error) => {
          if (error instanceof ApiRequestError && error.status < 500) return false;
          return count < 1;
        },
      },
    },
  });
}
