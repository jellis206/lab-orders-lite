import { LibsqlError } from "@libsql/client";
import { describe, expect, test } from "bun:test";
import { isUniqueCodeError } from "./unique-code-error";

describe("isUniqueCodeError", () => {
  test("recognizes structured libSQL unique-constraint fields", () => {
    expect(
      isUniqueCodeError(
        new LibsqlError("unique", "SQLITE_CONSTRAINT_UNIQUE", "SQLITE_CONSTRAINT_UNIQUE", 2067),
      ),
    ).toBe(true);
    expect(isUniqueCodeError(new LibsqlError("unique", "SQLITE_CONSTRAINT_UNIQUE"))).toBe(true);
    expect(isUniqueCodeError(new LibsqlError("unique", "SQLITE_CONSTRAINT", undefined, 2067))).toBe(
      true,
    );
  });

  test("falls back to lab-test unique constraint messages", () => {
    expect(isUniqueCodeError(new Error("UNIQUE constraint failed: lab_tests.code"))).toBe(true);
    expect(isUniqueCodeError(new Error("index lab_tests_code_unique"))).toBe(true);
  });

  test("walks nested causes", () => {
    expect(
      isUniqueCodeError(
        new Error("wrapped", {
          cause: new LibsqlError(
            "unique",
            "SQLITE_CONSTRAINT_UNIQUE",
            "SQLITE_CONSTRAINT_UNIQUE",
            2067,
          ),
        }),
      ),
    ).toBe(true);
  });

  test("ignores unrelated errors", () => {
    expect(isUniqueCodeError(new Error("FOREIGN KEY constraint failed"))).toBe(false);
    expect(isUniqueCodeError(new LibsqlError("busy", "SQLITE_BUSY"))).toBe(false);
  });
});
