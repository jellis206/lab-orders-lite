import type { HealthResponse } from "@lab-orders/contracts";
import { Hono } from "hono";

export function createApp() {
  const app = new Hono();

  app.get("/api/health", (context) => {
    const response = {
      status: "ok",
      service: "lab-orders-api",
    } satisfies HealthResponse;
    return context.json(response);
  });

  return app;
}
