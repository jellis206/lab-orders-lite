// Turnaround values throughout the domain represent elapsed—not business-calendar—hours.
export const TURNAROUND_UNIT = "elapsed_hours" as const;

export {
  calculateEstimatedReadyAt,
  calculateOrderTotal,
  canTransitionOrderStatus,
  nextOrderStatuses,
  orderStatuses,
  type OrderStatus,
} from "./orders";
