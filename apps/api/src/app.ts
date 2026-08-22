import type { HealthResponse } from "@lab-orders/contracts";
import { Hono } from "hono";
import type { AppDatabase } from "./db/client";
import { createPatientRoutes } from "./patients/patients";

export function createApp(db?: AppDatabase) {
  const app = new Hono();

  app.get("/api/health", (context) => {
    const response = {
      status: "ok",
      service: "lab-orders-api",
    } satisfies HealthResponse;
    return context.json(response);
  });

  if (db) app.route("/api/patients", createPatientRoutes(db));

  return app;
}
