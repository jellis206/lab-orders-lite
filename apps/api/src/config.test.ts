import { describe, expect, test } from "bun:test";
import { ZodError } from "zod";
import { parseConfig } from "./config";

describe("database configuration", () => {
  test("accepts a local Turso endpoint without a token", () => {
    expect(parseConfig({ TURSO_DATABASE_URL: "http://127.0.0.1:8080" })).toEqual({
      databaseUrl: "http://127.0.0.1:8080",
      port: 3000,
    });
  });

  test("accepts cloud configuration with a token", () => {
    expect(
      parseConfig({
        TURSO_DATABASE_URL: "libsql://clinic.turso.io",
        TURSO_AUTH_TOKEN: "secret",
        PORT: "4000",
      }),
    ).toEqual({
      databaseUrl: "libsql://clinic.turso.io",
      authToken: "secret",
      port: 4000,
    });
  });

  test.each([{}, { TURSO_DATABASE_URL: "not a URL" }, { TURSO_DATABASE_URL: "" }])(
    "rejects missing or invalid configuration",
    (environment) => {
      expect(() => parseConfig(environment)).toThrow(ZodError);
    },
  );
});
