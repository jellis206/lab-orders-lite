import { createClient, type Client } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import type { AppConfig } from "../config";
import * as schema from "./schema";

export function createDatabase(config: Pick<AppConfig, "databaseUrl" | "authToken">) {
  const client = createClient({
    url: config.databaseUrl,
    ...(config.authToken === undefined ? {} : { authToken: config.authToken }),
  });

  return {
    client,
    db: drizzle(client, { schema }),
  };
}

export type AppDatabase = ReturnType<typeof createDatabase>["db"];
export type DatabaseClient = Client;
