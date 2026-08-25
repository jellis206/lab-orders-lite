import type { OrderDetailResponse, OrderStatus } from "@lab-orders/contracts";
import { nextOrderStatuses } from "@lab-orders/domain";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ApiRequestError } from "@/api/client";
import { Button } from "@/components/button";
import { orderKeys, updateOrderStatus } from "./api";
import { formatStatus } from "./format";

function actionLabel(status: OrderStatus) {
  if (status === "in_progress") return "Start order";
  if (status === "completed") return "Complete order";
  if (status === "cancelled") return "Cancel order";
  return formatStatus(status);
}

export function OrderStatusControls({ order }: { order: OrderDetailResponse }) {
  const queryClient = useQueryClient();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const mutation = useMutation({
    mutationFn: (status: OrderStatus) => updateOrderStatus(order.id, { status }),
    onSuccess: async () => {
      setConfirmCancel(false);
      await queryClient.invalidateQueries({ queryKey: orderKeys.all });
    },
  });
  const next = nextOrderStatuses(order.status);

  if (next.length === 0) {
    return (
      <p className="mt-4 text-sm text-app-muted">
        This order is {formatStatus(order.status)} and cannot change.
      </p>
    );
  }

  return (
    <div className="mt-4">
      {mutation.isError && (
        <div
          className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
          role="alert"
        >
          {mutation.error instanceof ApiRequestError
            ? mutation.error.error.message
            : mutation.error.message}
        </div>
      )}
      {confirmCancel ? (
        <div
          className="flex flex-wrap items-center gap-3"
          role="group"
          aria-label="Confirm cancellation"
        >
          <p className="text-sm text-app-muted">Cancel this order? This cannot be undone.</p>
          <Button
            type="button"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate("cancelled")}
          >
            {mutation.isPending ? "Updating…" : "Confirm cancel"}
          </Button>
          <button
            type="button"
            className="rounded-lg px-3 py-2 text-sm font-semibold text-app-muted hover:bg-app-hover"
            onClick={() => setConfirmCancel(false)}
          >
            Keep order
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          {next.map((status) =>
            status === "cancelled" ? (
              <button
                key={status}
                type="button"
                className="rounded-lg px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/40"
                onClick={() => setConfirmCancel(true)}
              >
                Cancel order
              </button>
            ) : (
              <Button
                key={status}
                type="button"
                disabled={mutation.isPending}
                onClick={() => mutation.mutate(status)}
              >
                {mutation.isPending ? "Updating…" : actionLabel(status)}
              </Button>
            ),
          )}
        </div>
      )}
    </div>
  );
}
