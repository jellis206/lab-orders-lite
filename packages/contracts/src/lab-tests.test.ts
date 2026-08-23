import { describe, expect, it } from "bun:test";
import {
  createLabTestSchema,
  labTestListQuerySchema,
  labTestListResponseSchema,
  labTestResponseSchema,
  patchLabTestSchema,
} from "./lab-tests";

const validCreate = {
  code: "cbc",
  name: "Complete Blood Count",
  priceCents: 3000,
  turnaroundHours: 12,
};

describe("createLabTestSchema", () => {
  it("accepts a complete valid lab test and normalizes the code", () => {
    const result = createLabTestSchema.safeParse({
      ...validCreate,
      active: true,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toMatchObject({
        code: "CBC",
        name: "Complete Blood Count",
        priceCents: 3000,
        turnaroundHours: 12,
        active: true,
      });
    }
  });

  it("trims the name and uppercases a trimmed code", () => {
    const result = createLabTestSchema.safeParse({
      code: "  vitd ",
      name: "  Vitamin D  ",
      priceCents: 0,
      turnaroundHours: 1,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.code).toBe("VITD");
      expect(result.data.name).toBe("Vitamin D");
    }
  });

  it("defaults omitted active to true", () => {
    const result = createLabTestSchema.safeParse(validCreate);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.active).toBe(true);
  });

  it("rejects a blank code", () => {
    expect(createLabTestSchema.safeParse({ ...validCreate, code: "   " }).success).toBe(false);
  });

  it("rejects a blank name", () => {
    expect(createLabTestSchema.safeParse({ ...validCreate, name: " " }).success).toBe(false);
  });

  it("rejects a negative price", () => {
    expect(createLabTestSchema.safeParse({ ...validCreate, priceCents: -1 }).success).toBe(false);
  });

  it("rejects a non-integer price", () => {
    expect(createLabTestSchema.safeParse({ ...validCreate, priceCents: 10.5 }).success).toBe(false);
  });

  it("rejects a non-positive turnaround", () => {
    expect(createLabTestSchema.safeParse({ ...validCreate, turnaroundHours: 0 }).success).toBe(
      false,
    );
  });

  it("accepts the catalog maximum turnaround", () => {
    const result = createLabTestSchema.safeParse({ ...validCreate, turnaroundHours: 87_600 });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.turnaroundHours).toBe(87_600);
  });

  it("rejects a turnaround above the catalog maximum", () => {
    expect(createLabTestSchema.safeParse({ ...validCreate, turnaroundHours: 87_601 }).success).toBe(
      false,
    );
  });

  it("rejects missing required fields", () => {
    expect(createLabTestSchema.safeParse({ code: "CBC" }).success).toBe(false);
  });

  it("rejects unknown keys", () => {
    expect(createLabTestSchema.safeParse({ ...validCreate, totalCents: 1 }).success).toBe(false);
  });
});

describe("patchLabTestSchema", () => {
  it("accepts partial updates", () => {
    const result = patchLabTestSchema.safeParse({ active: false, priceCents: 2500 });
    expect(result.success).toBe(true);
  });

  it("accepts an empty object", () => {
    expect(patchLabTestSchema.safeParse({}).success).toBe(true);
  });

  it("normalizes a patched code", () => {
    const result = patchLabTestSchema.safeParse({ code: " lipid " });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.code).toBe("LIPID");
  });

  it("rejects a blank name", () => {
    expect(patchLabTestSchema.safeParse({ name: "  " }).success).toBe(false);
  });

  it("rejects a zero turnaround", () => {
    expect(patchLabTestSchema.safeParse({ turnaroundHours: 0 }).success).toBe(false);
  });
});

describe("labTestResponseSchema", () => {
  it("accepts a complete catalog response", () => {
    expect(
      labTestResponseSchema.safeParse({
        id: "test-cbc",
        code: "CBC",
        name: "Complete Blood Count",
        priceCents: 3000,
        turnaroundHours: 12,
        active: true,
        createdAt: "2025-01-01T00:00:00.000Z",
        updatedAt: "2025-01-02T00:00:00.000Z",
      }).success,
    ).toBe(true);
  });

  it("rejects a missing active flag", () => {
    expect(
      labTestResponseSchema.safeParse({
        id: "test-cbc",
        code: "CBC",
        name: "Complete Blood Count",
        priceCents: 3000,
        turnaroundHours: 12,
        createdAt: "2025-01-01T00:00:00.000Z",
        updatedAt: "2025-01-02T00:00:00.000Z",
      }).success,
    ).toBe(false);
  });
});

describe("labTestListQuerySchema", () => {
  it("accepts search, active filter, and limit", () => {
    const result = labTestListQuerySchema.safeParse({
      search: "cbc",
      active: "true",
      limit: "10",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toMatchObject({ search: "cbc", active: true, limit: 10 });
    }
  });

  it("treats a blank search as unset and defaults the limit", () => {
    const result = labTestListQuerySchema.safeParse({ search: "  " });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.search).toBeUndefined();
      expect(result.data.limit).toBe(20);
      expect(result.data.active).toBeUndefined();
    }
  });

  it("parses active=false", () => {
    const result = labTestListQuerySchema.safeParse({ active: "false" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.active).toBe(false);
  });

  it("rejects a limit over the maximum", () => {
    expect(labTestListQuerySchema.safeParse({ limit: "51" }).success).toBe(false);
  });

  it("rejects an invalid active filter", () => {
    expect(labTestListQuerySchema.safeParse({ active: "maybe" }).success).toBe(false);
  });
});

describe("labTestListResponseSchema", () => {
  it("accepts a paged list", () => {
    expect(
      labTestListResponseSchema.safeParse({
        items: [
          {
            id: "test-cbc",
            code: "CBC",
            name: "Complete Blood Count",
            priceCents: 3000,
            turnaroundHours: 12,
            active: true,
            createdAt: "2025-01-01T00:00:00.000Z",
            updatedAt: "2025-01-01T00:00:00.000Z",
          },
        ],
        nextCursor: "cursor",
        hasMore: true,
      }).success,
    ).toBe(true);
  });

  it("accepts an empty list", () => {
    expect(
      labTestListResponseSchema.safeParse({ items: [], nextCursor: null, hasMore: false }).success,
    ).toBe(true);
  });
});
