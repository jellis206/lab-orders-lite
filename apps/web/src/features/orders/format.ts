import { formatCents } from "@lab-orders/contracts";

export function formatMoney(cents: number) {
  return formatCents(cents);
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(value));
}

export function formatStatus(status: string) {
  return status.replaceAll("_", " ");
}
