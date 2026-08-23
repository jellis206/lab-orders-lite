import { describe, expect, it } from "bun:test";
import {
  createPatientSchema,
  patchPatientSchema,
  patientResponseSchema,
  patientListQuerySchema,
  patientListResponseSchema,
} from "./patients";

describe("createPatientSchema", () => {
  it("accepts a complete valid patient", () => {
    const result = createPatientSchema.safeParse({
      firstName: "Jane",
      lastName: "Doe",
      dateOfBirth: "1990-05-15",
      email: "jane@example.com",
      phone: "555-1234",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a patient with only an email", () => {
    const result = createPatientSchema.safeParse({
      firstName: "Jane",
      lastName: "Doe",
      dateOfBirth: "1990-05-15",
      email: "jane@example.com",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a patient with only a phone number", () => {
    const result = createPatientSchema.safeParse({
      firstName: "Jane",
      lastName: "Doe",
      dateOfBirth: "1990-05-15",
      phone: "555-1234",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a patient with no contact fields", () => {
    const result = createPatientSchema.safeParse({
      firstName: "Jane",
      lastName: "Doe",
      dateOfBirth: "1990-05-15",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.message.includes("email or phone"))).toBe(
        true,
      );
    }
  });

  it("rejects blank first name", () => {
    const result = createPatientSchema.safeParse({
      firstName: "   ",
      lastName: "Doe",
      dateOfBirth: "1990-05-15",
    });
    expect(result.success).toBe(false);
  });

  it("rejects blank last name", () => {
    const result = createPatientSchema.safeParse({
      firstName: "Jane",
      lastName: "",
      dateOfBirth: "1990-05-15",
    });
    expect(result.success).toBe(false);
  });

  it("rejects future date of birth", () => {
    const result = createPatientSchema.safeParse({
      firstName: "Jane",
      lastName: "Doe",
      dateOfBirth: "2030-01-01",
    });
    expect(result.success).toBe(false);
  });

  it("rejects malformed date of birth", () => {
    const result = createPatientSchema.safeParse({
      firstName: "Jane",
      lastName: "Doe",
      dateOfBirth: "05/15/1990",
    });
    expect(result.success).toBe(false);
  });

  it("rejects malformed email", () => {
    const result = createPatientSchema.safeParse({
      firstName: "Jane",
      lastName: "Doe",
      dateOfBirth: "1990-05-15",
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  it("rejects malformed phone", () => {
    const result = createPatientSchema.safeParse({
      firstName: "Jane",
      lastName: "Doe",
      dateOfBirth: "1990-05-15",
      phone: "abc",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing required fields", () => {
    const result = createPatientSchema.safeParse({
      firstName: "Jane",
    });
    expect(result.success).toBe(false);
  });
});

describe("patchPatientSchema", () => {
  it("accepts partial updates", () => {
    const result = patchPatientSchema.safeParse({
      firstName: "Janet",
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty object", () => {
    const result = patchPatientSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("rejects future date of birth", () => {
    const result = patchPatientSchema.safeParse({
      dateOfBirth: "2030-01-01",
    });
    expect(result.success).toBe(false);
  });

  it("rejects blank first name", () => {
    const result = patchPatientSchema.safeParse({
      firstName: "   ",
    });
    expect(result.success).toBe(false);
  });

  it("rejects clearing both contact fields", () => {
    const result = patchPatientSchema.safeParse({
      email: "",
      phone: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("patientResponseSchema", () => {
  it("accepts a complete patient response", () => {
    const result = patientResponseSchema.safeParse({
      id: "p-1",
      firstName: "Jane",
      lastName: "Doe",
      dateOfBirth: "1990-05-15",
      email: "jane@example.com",
      phone: "555-1234",
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-02T00:00:00Z",
    });
    expect(result.success).toBe(true);
  });

  it("accepts patient with null contact fields", () => {
    const result = patientResponseSchema.safeParse({
      id: "p-1",
      firstName: "Jane",
      lastName: "Doe",
      dateOfBirth: "1990-05-15",
      email: null,
      phone: null,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-02T00:00:00Z",
    });
    expect(result.success).toBe(true);
  });
});

describe("patientListQuerySchema", () => {
  it("accepts valid search and limit", () => {
    const result = patientListQuerySchema.safeParse({
      search: "jane",
      limit: "10",
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty query", () => {
    const result = patientListQuerySchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("rejects limit over maximum", () => {
    const result = patientListQuerySchema.safeParse({
      limit: "100",
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-numeric limit", () => {
    const result = patientListQuerySchema.safeParse({
      limit: "abc",
    });
    expect(result.success).toBe(false);
  });
});

describe("patientListResponseSchema", () => {
  it("accepts a list response with items", () => {
    const result = patientListResponseSchema.safeParse({
      items: [
        {
          id: "p-1",
          firstName: "Jane",
          lastName: "Doe",
          dateOfBirth: "1990-05-15",
          email: null,
          phone: null,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-02T00:00:00Z",
        },
      ],
      nextCursor: "abc123",
      hasMore: true,
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty list with no cursor", () => {
    const result = patientListResponseSchema.safeParse({
      items: [],
      nextCursor: null,
      hasMore: false,
    });
    expect(result.success).toBe(true);
  });
});
