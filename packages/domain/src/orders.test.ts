import { describe, expect, test } from "bun:test";
import {
  calculateEstimatedReadyAt,
  calculateOrderTotal,
  canTransitionOrderStatus,
  nextOrderStatuses,
  orderStatuses,
} from "./orders";

describe("calculateOrderTotal", () => {
  test("returns the single selected price", () => {
    expect(calculateOrderTotal([3000])).toBe(3000);
  });

  test("sums multiple snapshot prices in cents", () => {
    expect(calculateOrderTotal([3000, 4500, 1])).toBe(7501);
  });

  test("returns zero for an empty selection", () => {
    expect(calculateOrderTotal([])).toBe(0);
  });
});

describe("calculateEstimatedReadyAt", () => {
  const orderedAt = "2025-01-10T09:00:00.000Z";

  test("uses the only test turnaround", () => {
    expect(calculateEstimatedReadyAt(orderedAt, [12])).toBe("2025-01-10T21:00:00.000Z");
  });

  test("uses the slowest selected turnaround in elapsed UTC hours", () => {
    expect(calculateEstimatedReadyAt(orderedAt, [12, 24, 48])).toBe("2025-01-12T09:00:00.000Z");
  });

  test("does not depend on local timezone", () => {
    expect(calculateEstimatedReadyAt("2025-01-01T00:00:00.000Z", [36])).toBe(
      "2025-01-02T12:00:00.000Z",
    );
  });

  test("rejects an empty selection", () => {
    expect(() => calculateEstimatedReadyAt(orderedAt, [])).toThrow(
      "At least one turnaround is required",
    );
  });
});

describe("order status transitions", () => {
  test("exposes the supported statuses", () => {
    expect(orderStatuses).toEqual(["pending", "in_progress", "completed", "cancelled"]);
  });

  test("allows pending to start or cancel", () => {
    expect(nextOrderStatuses("pending")).toEqual(["in_progress", "cancelled"]);
    expect(canTransitionOrderStatus("pending", "in_progress")).toBe(true);
    expect(canTransitionOrderStatus("pending", "cancelled")).toBe(true);
  });

  test("allows in-progress to complete or cancel", () => {
    expect(nextOrderStatuses("in_progress")).toEqual(["completed", "cancelled"]);
    expect(canTransitionOrderStatus("in_progress", "completed")).toBe(true);
    expect(canTransitionOrderStatus("in_progress", "cancelled")).toBe(true);
  });

  test("treats completed and cancelled as terminal", () => {
    expect(nextOrderStatuses("completed")).toEqual([]);
    expect(nextOrderStatuses("cancelled")).toEqual([]);
  });

  test("rejects skipped, backward, and same-status transitions", () => {
    const forbidden = [
      ["pending", "completed"],
      ["pending", "pending"],
      ["in_progress", "pending"],
      ["in_progress", "in_progress"],
      ["completed", "pending"],
      ["completed", "in_progress"],
      ["completed", "cancelled"],
      ["cancelled", "pending"],
      ["cancelled", "in_progress"],
      ["cancelled", "completed"],
    ] as const;

    for (const [from, to] of forbidden) {
      expect(canTransitionOrderStatus(from, to)).toBe(false);
    }
  });
});
