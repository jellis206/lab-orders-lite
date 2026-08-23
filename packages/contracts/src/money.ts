export type ParseDollarResult = { ok: true; cents: number } | { ok: false; message: string };

const dollarPattern = /^\$?(\d{1,3}(?:,\d{3})*|\d+)(?:\.(\d{1,2}))?$/;

export function parseDollarInput(value: string): ParseDollarResult {
  const trimmed = value.trim();
  if (!trimmed) return { ok: false, message: "Enter a price" };

  const match = dollarPattern.exec(trimmed);
  if (!match) return { ok: false, message: "Enter a valid dollar amount" };

  const whole = (match[1] ?? "").replaceAll(",", "");
  const fraction = (match[2] ?? "").padEnd(2, "0");
  const cents = Number.parseInt(whole, 10) * 100 + Number.parseInt(fraction, 10);
  if (!Number.isSafeInteger(cents)) {
    return { ok: false, message: "Enter a smaller dollar amount" };
  }
  return { ok: true, cents };
}

export function centsToDollarInput(cents: number) {
  const sign = cents < 0 ? "-" : "";
  const absolute = Math.abs(cents);
  const whole = Math.trunc(absolute / 100);
  const fraction = String(absolute % 100).padStart(2, "0");
  return `${sign}${whole}.${fraction}`;
}

export function formatCents(cents: number) {
  return `$${centsToDollarInput(cents)}`;
}
