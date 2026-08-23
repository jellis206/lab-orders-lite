import { describe, expect, test } from "bun:test";
import { z } from "zod";
import { decodeCursor, encodeCursor, foldSearchText } from "./pagination";

describe("foldSearchText", () => {
  test("folds only ASCII letters so it matches SQLite lower()", () => {
    expect(foldSearchText("ØSTER")).toBe("Øster");
    expect(foldSearchText("ÉLUTION")).toBe("Élution");
    expect(foldSearchText("Ada")).toBe("ada");
  });
});

describe("cursor encoding", () => {
  const schema = z.object({ id: z.string(), search: z.string() });

  test("round-trips a cursor payload", () => {
    const cursor = { id: "p-1", search: "ada" };
    expect(decodeCursor(encodeCursor(cursor), schema)).toEqual(cursor);
  });

  test("returns undefined for malformed input", () => {
    expect(decodeCursor("not-a-cursor", schema)).toBeUndefined();
  });
});
