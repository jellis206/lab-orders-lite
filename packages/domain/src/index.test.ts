import { expect, test } from "bun:test";
import { TURNAROUND_UNIT } from "./index";

test("documents the shared turnaround unit", () => {
  expect(TURNAROUND_UNIT).toBe("elapsed_hours");
});
