import type { z } from "zod";

export function encodeCursor<T>(cursor: T) {
  const bytes = new TextEncoder().encode(JSON.stringify(cursor));
  return btoa(String.fromCharCode(...bytes));
}

export function decodeCursor<T>(value: string, schema: z.ZodType<T>): T | undefined {
  try {
    const bytes = Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
    return schema.parse(JSON.parse(new TextDecoder().decode(bytes)));
  } catch {
    return undefined;
  }
}

export function foldSearchText(value: string) {
  return value.replaceAll(/[A-Z]/g, (character) => character.toLowerCase());
}
