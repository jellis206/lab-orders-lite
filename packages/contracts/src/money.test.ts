import { describe, expect, it } from "bun:test";
import { centsToDollarInput, formatCents, parseDollarInput } from "./money";

describe("parseDollarInput", () => {
  it("parses whole dollars as exact cents", () => {
    expect(parseDollarInput("10")).toEqual({ ok: true, cents: 1000 });
    expect(parseDollarInput("0")).toEqual({ ok: true, cents: 0 });
  });

  it("parses dollars and cents without floating-point math", () => {
    expect(parseDollarInput("12.34")).toEqual({ ok: true, cents: 1234 });
    expect(parseDollarInput("0.01")).toEqual({ ok: true, cents: 1 });
    expect(parseDollarInput("0.10")).toEqual({ ok: true, cents: 10 });
    expect(parseDollarInput("1.2")).toEqual({ ok: true, cents: 120 });
  });

  it("accepts a leading dollar sign, commas, and surrounding space", () => {
    expect(parseDollarInput(" $1,234.50 ")).toEqual({ ok: true, cents: 123450 });
  });

  it("rejects empty and non-numeric input", () => {
    expect(parseDollarInput("").ok).toBe(false);
    expect(parseDollarInput("   ").ok).toBe(false);
    expect(parseDollarInput("abc").ok).toBe(false);
    expect(parseDollarInput("12.34.56").ok).toBe(false);
  });

  it("rejects more than two fractional digits", () => {
    expect(parseDollarInput("12.345").ok).toBe(false);
  });

  it("rejects a negative amount", () => {
    expect(parseDollarInput("-1.00").ok).toBe(false);
  });
});

describe("centsToDollarInput", () => {
  it("formats cents as a stable dollar input string", () => {
    expect(centsToDollarInput(1234)).toBe("12.34");
    expect(centsToDollarInput(1000)).toBe("10.00");
    expect(centsToDollarInput(1)).toBe("0.01");
    expect(centsToDollarInput(0)).toBe("0.00");
  });
});

describe("formatCents", () => {
  it("formats cents as a display currency string", () => {
    expect(formatCents(1234)).toBe("$12.34");
    expect(formatCents(0)).toBe("$0.00");
  });
});
