export const orderStatuses = ["pending", "in_progress", "completed", "cancelled"] as const;
export type OrderStatus = (typeof orderStatuses)[number];

const transitions = {
  pending: ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
} as const satisfies Record<OrderStatus, readonly OrderStatus[]>;

export function calculateOrderTotal(priceCents: readonly number[]) {
  return priceCents.reduce((sum, cents) => sum + cents, 0);
}

export function calculateEstimatedReadyAt(orderedAt: string, turnaroundHours: readonly number[]) {
  if (turnaroundHours.length === 0) {
    throw new Error("At least one turnaround is required");
  }

  const ready = new Date(orderedAt);
  ready.setUTCHours(ready.getUTCHours() + Math.max(...turnaroundHours));
  return ready.toISOString();
}

export function nextOrderStatuses(status: OrderStatus): readonly OrderStatus[] {
  return transitions[status];
}

export function canTransitionOrderStatus(from: OrderStatus, to: OrderStatus) {
  return (transitions[from] as readonly OrderStatus[]).includes(to);
}
