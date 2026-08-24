import { afterEach, expect, test } from "bun:test";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createQueryClient } from "../../query-client";
import { createTestRouter } from "../../router";
import { installFetchMock } from "../../test-support/fetch";

const tests = [
  {
    id: "t-cbc",
    code: "CBC",
    name: "Complete Blood Count",
    priceCents: 3000,
    turnaroundHours: 12,
    active: true,
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
  },
];
let requests: Array<{ url: string; init?: RequestInit }> = [];

afterEach(() => {
  cleanup();
  requests = [];
});

function mockFetch(handler?: (url: string, init?: RequestInit) => Response | Promise<Response>) {
  installFetchMock(async (url, init) => {
    requests.push({ url, init });
    if (url === "/api/health") {
      return Response.json({ status: "ok", service: "lab-orders-api" });
    }
    return (
      handler?.(url, init) ?? Response.json({ items: tests, nextCursor: null, hasMore: false })
    );
  });
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

test("lists lab tests and puts search and active filters in the URL", async () => {
  mockFetch();
  const router = renderApp("/tests");
  expect(await screen.findByText("CBC")).toBeTruthy();
  expect(screen.getByText("$30.00")).toBeTruthy();
  fireEvent.change(screen.getByLabelText("Search lab tests"), { target: { value: "cbc" } });
  fireEvent.submit(screen.getByRole("search"));
  await waitFor(() => expect(router.state.location.search).toMatchObject({ search: "cbc" }));
  fireEvent.click(screen.getByLabelText("Status"));
  fireEvent.click(screen.getByRole("option", { name: "Active" }));
  await waitFor(() =>
    expect(router.state.location.search).toMatchObject({ search: "cbc", active: "true" }),
  );
  await waitFor(() =>
    expect(
      requests.some(
        ({ url }) =>
          url.includes("search=cbc") && url.includes("active=true") && !url.includes("after="),
      ),
    ).toBe(true),
  );
});

test("loads additional catalog pages from the next cursor", async () => {
  mockFetch((url) => {
    if (url.includes("after=cursor-1")) {
      return Response.json({ items: [], nextCursor: null, hasMore: false });
    }
    return Response.json({ items: tests, nextCursor: "cursor-1", hasMore: true });
  });
  renderApp("/tests");
  fireEvent.click(await screen.findByRole("button", { name: "Load more" }));
  await waitFor(() =>
    expect(requests.some(({ url }) => url.includes("after=cursor-1"))).toBe(true),
  );
});

test("creates a lab test from dollar input and navigates to its editable detail", async () => {
  mockFetch((url, init) => {
    if (url === "/api/tests" && init?.method === "POST") {
      return Response.json(tests[0], { status: 201 });
    }
    if (url === "/api/tests/t-cbc") return Response.json(tests[0]);
    return Response.json({ items: tests, nextCursor: null, hasMore: false });
  });
  const router = renderApp("/tests/new");
  fireEvent.change(await screen.findByLabelText("Code"), { target: { value: "cbc" } });
  fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Complete Blood Count" } });
  fireEvent.change(screen.getByLabelText("Price"), { target: { value: "30.00" } });
  fireEvent.change(screen.getByLabelText("Turnaround hours"), { target: { value: "12" } });
  fireEvent.click(screen.getByRole("button", { name: "Create lab test" }));
  await waitFor(() => expect(router.state.location.pathname).toBe("/tests/t-cbc"));
  const create = requests.find(({ url, init }) => url === "/api/tests" && init?.method === "POST");
  expect(JSON.parse(String(create?.init?.body))).toMatchObject({
    code: "CBC",
    priceCents: 3000,
    turnaroundHours: 12,
  });
  expect(await screen.findByDisplayValue("CBC")).toBeTruthy();
});

test("shows useful inline errors without submitting invalid data", async () => {
  mockFetch();
  renderApp("/tests/new");
  fireEvent.click(await screen.findByRole("button", { name: "Create lab test" }));
  expect(await screen.findByText("Code is required")).toBeTruthy();
  expect(screen.getByText("Name is required")).toBeTruthy();
  expect(requests.filter(({ url }) => url === "/api/tests")).toHaveLength(0);
});

test("rejects a partially numeric turnaround value", async () => {
  mockFetch();
  renderApp("/tests/new");
  fireEvent.change(await screen.findByLabelText("Code"), { target: { value: "CBC" } });
  fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Complete Blood Count" } });
  fireEvent.change(screen.getByLabelText("Price"), { target: { value: "30" } });
  fireEvent.change(screen.getByLabelText("Turnaround hours"), { target: { value: "24hours" } });
  fireEvent.click(screen.getByRole("button", { name: "Create lab test" }));
  expect(await screen.findByText("Turnaround must be a whole number of hours")).toBeTruthy();
  expect(requests.filter(({ url }) => url === "/api/tests")).toHaveLength(0);
});

test("surfaces a duplicate-code conflict without losing form input", async () => {
  mockFetch((url, init) => {
    if (url === "/api/tests" && init?.method === "POST") {
      return Response.json(
        { code: "DUPLICATE_CODE", message: "A lab test with this code already exists" },
        { status: 409 },
      );
    }
    return Response.json({ items: tests, nextCursor: null, hasMore: false });
  });
  renderApp("/tests/new");
  fireEvent.change(await screen.findByLabelText("Code"), { target: { value: "CBC" } });
  fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Complete Blood Count" } });
  fireEvent.change(screen.getByLabelText("Price"), { target: { value: "30" } });
  fireEvent.change(screen.getByLabelText("Turnaround hours"), { target: { value: "12" } });
  fireEvent.click(screen.getByRole("button", { name: "Create lab test" }));
  expect(await screen.findByText("A lab test with this code already exists")).toBeTruthy();
  expect(screen.getByLabelText("Code")).toHaveProperty("value", "CBC");
});
