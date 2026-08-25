import { afterEach, expect, test } from "bun:test";
import { z } from "zod";
import { installFetchMock } from "@/test-support/fetch";
import { ApiRequestError, apiRequest } from "./client";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

test("passes a Request URL to the fetch handler", async () => {
  let handledUrl = "";
  installFetchMock(async (url) => {
    handledUrl = url;
    return Response.json({});
  });

  await fetch(new Request("https://example.test/api/orders"));

  expect(handledUrl).toBe("https://example.test/api/orders");
});

test("normalizes a non-JSON error response", async () => {
  installFetchMock(async () => new Response("<html>gateway timeout</html>", { status: 502 }));

  try {
    await apiRequest("/api/orders", z.object({}));
    throw new Error("expected apiRequest to reject");
  } catch (error) {
    expect(error).toBeInstanceOf(ApiRequestError);
    expect(error).toMatchObject({
      status: 502,
      error: { code: "UNEXPECTED_RESPONSE", message: "The server returned an unexpected error" },
    });
  }
});
