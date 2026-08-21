import { expect, test } from "bun:test";
import { healthResponseSchema } from "./index";

test("health contract rejects malformed responses", () => {
  expect(
    healthResponseSchema.safeParse({ status: "broken", service: "lab-orders-api" }).success,
  ).toBe(false);
});
