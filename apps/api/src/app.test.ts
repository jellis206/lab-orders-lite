import { describe, expect, test } from "bun:test";
import { createApp } from "./app";

describe("API health", () => {
  test("reports that the API is ready", async () => {
    const response = await createApp().request("/api/health");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok", service: "lab-orders-api" });
  });
});
