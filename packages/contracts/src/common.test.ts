import { describe, expect, it } from "bun:test";
import { apiErrorSchema } from "./common";

describe("apiErrorSchema", () => {
  it("accepts a code and message", () => {
    expect(
      apiErrorSchema.parse({ code: "PATIENT_NOT_FOUND", message: "Patient not found" }),
    ).toEqual({
      code: "PATIENT_NOT_FOUND",
      message: "Patient not found",
    });
  });

  it("keeps issue path and message details from validation errors", () => {
    expect(
      apiErrorSchema.parse({
        code: "VALIDATION_ERROR",
        message: "Request validation failed",
        details: [
          {
            path: ["email"],
            message: "Enter a valid email address",
            code: "invalid_string",
          },
        ],
      }),
    ).toEqual({
      code: "VALIDATION_ERROR",
      message: "Request validation failed",
      details: [{ path: ["email"], message: "Enter a valid email address" }],
    });
  });
});
