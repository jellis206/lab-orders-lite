import { afterEach, expect, test } from "bun:test";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createQueryClient } from "../../query-client";
import { createTestRouter } from "../../router";

const patients = [
  {
    id: "p-1",
    firstName: "Jane",
    lastName: "Doe",
    dateOfBirth: "1990-05-15",
    email: null,
    phone: null,
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
  },
];
let requests: string[] = [];

afterEach(() => {
  cleanup();
  requests = [];
});

function mockFetch(handler?: (url: string, init?: RequestInit) => Response | Promise<Response>) {
  globalThis.fetch = Object.assign(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      requests.push(url);
      if (url === "/api/health") return Response.json({ status: "ok" });
      return (
        handler?.(url, init) ?? Response.json({ items: patients, nextCursor: null, hasMore: false })
      );
    },
    { preconnect() {} },
  ) as typeof fetch;
}

function renderApp(path: string) {
  const router = createTestRouter(path);
  render(
    <QueryClientProvider client={createQueryClient()}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return router;
}

test("lists patients and puts search state in the URL", async () => {
  mockFetch();
  const router = renderApp("/patients");
  expect(await screen.findByText("Doe, Jane")).toBeTruthy();
  fireEvent.change(screen.getByLabelText("Search patients"), { target: { value: "jane" } });
  fireEvent.submit(screen.getByRole("search"));
  await waitFor(() => expect(router.state.location.search).toEqual({ search: "jane" }));
  await waitFor(() =>
    expect(requests.some((url) => url.includes("search=jane") && !url.includes("after="))).toBe(
      true,
    ),
  );
});

test("creates a patient and navigates to its editable detail", async () => {
  mockFetch((url, init) => {
    if (url === "/api/patients" && init?.method === "POST") {
      return Response.json(patients[0], { status: 201 });
    }
    if (url === "/api/patients/p-1") return Response.json(patients[0]);
    return Response.json({ items: patients, nextCursor: null, hasMore: false });
  });
  const router = renderApp("/patients/new");
  fireEvent.change(await screen.findByLabelText("First name"), { target: { value: "Jane" } });
  fireEvent.change(screen.getByLabelText("Last name"), { target: { value: "Doe" } });
  fireEvent.change(screen.getByLabelText("Date of birth"), { target: { value: "1990-05-15" } });
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "jane@example.com" } });
  fireEvent.click(screen.getByRole("button", { name: "Create patient" }));
  await waitFor(() => expect(router.state.location.pathname).toBe("/patients/p-1"));
  expect(await screen.findByDisplayValue("Jane")).toBeTruthy();
});

test("shows useful inline errors without submitting invalid data", async () => {
  mockFetch();
  renderApp("/patients/new");
  fireEvent.click(await screen.findByRole("button", { name: "Create patient" }));
  expect(await screen.findAllByText("Name is required")).toHaveLength(2);
  expect(
    screen.getAllByText("Provide an email or phone number so we can share results").length,
  ).toBeGreaterThan(0);
  expect(requests.filter((url) => url === "/api/patients")).toHaveLength(0);
});
