import { expect, test } from "bun:test";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createQueryClient } from "./query-client";
import { createTestRouter } from "./router";

globalThis.fetch = Object.assign(
  async () =>
    new Response(JSON.stringify({ status: "ok" }), {
      headers: { "content-type": "application/json" },
    }),
  { preconnect() {} },
) as typeof fetch;

function renderApp(path = "/") {
  const router = createTestRouter(path);
  return {
    router,
    ...render(
      <QueryClientProvider client={createQueryClient()}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    ),
  };
}

test("the shell navigates between primary workspaces", async () => {
  renderApp();
  expect(await screen.findByRole("heading", { name: "Overview" })).toBeTruthy();

  fireEvent.click(screen.getByRole("link", { name: "Patients" }));
  expect(await screen.findByRole("heading", { name: "Patients" })).toBeTruthy();
  await waitFor(() => expect(screen.getByText("API connected")).toBeTruthy());
});

test("mobile navigation exposes an accessible menu control", async () => {
  renderApp("/orders");
  const toggle = await screen.findByRole("button", { name: "Open navigation" });
  fireEvent.click(toggle);
  expect(screen.getByRole("navigation", { name: "Mobile navigation" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "Close navigation" })).toBeTruthy();
});
