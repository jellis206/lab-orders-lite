import { z } from "zod";

const databaseUrlSchema = z
  .string()
  .min(1, "TURSO_DATABASE_URL is required")
  .refine((value) => {
    try {
      const protocol = new URL(value).protocol;
      return ["file:", "http:", "https:", "libsql:", "ws:", "wss:"].includes(protocol);
    } catch {
      return false;
    }
  }, "TURSO_DATABASE_URL must be a libSQL-compatible URL");

const environmentSchema = z.object({
  TURSO_DATABASE_URL: databaseUrlSchema,
  TURSO_AUTH_TOKEN: z.string().min(1).optional(),
  API_PORT: z.coerce.number().int().min(1).max(65_535).default(3000),
});

export type AppConfig = {
  databaseUrl: string;
  authToken?: string;
  port: number;
};

export function parseConfig(environment: Record<string, string | undefined>): AppConfig {
  const parsed = environmentSchema.parse(environment);
  const config: AppConfig = {
    databaseUrl: parsed.TURSO_DATABASE_URL,
    port: parsed.API_PORT,
  };
  if (parsed.TURSO_AUTH_TOKEN !== undefined) {
    config.authToken = parsed.TURSO_AUTH_TOKEN;
  }
  return config;
}

export function getConfig(): AppConfig {
  return parseConfig(Bun.env);
}
