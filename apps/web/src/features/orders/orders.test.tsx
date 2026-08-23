import { afterEach, expect, test } from "bun:test";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createQueryClient } from "../../query-client";
import { createTestRouter } from "../../router";
import { installFetchMock } from "../../test/fetch";

const patient = {
  id: "patient-ada",
  firstName: "Ada",
  lastName: "Rivera",
  dateOfBirth: "1988-04-12",
  email: null,
  phone: null,
  createdAt: "2025-01-01T00:00:00.000Z",
  updatedAt: "2025-01-01T00:00:00.000Z",
};
const tests = [
  {
    id: "test-cbc",
    code: "CBC",
    name: "Complete Blood Count",
    priceCents: 3000,
    turnaroundHours: 12,
    active: true,
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
  },
  {
    id: "test-cmp",
    code: "CMP",
    name: "Comprehensive Metabolic Panel",
    priceCents: 4500,
    turnaroundHours: 24,
    active: true,
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
  },
];
const createdOrder = {
  id: "order-1",
  patientId: patient.id,
  patientFirstName: patient.firstName,
  patientLastName: patient.lastName,
  status: "pending",
  orderedAt: "2025-01-10T09:00:00.000Z",
  testCount: 2,
  totalCents: 7500,
  estimatedReadyAt: "2025-01-11T09:00:00.000Z",
  createdAt: "2025-01-10T09:00:00.000Z",
  updatedAt: "2025-01-10T09:00:00.000Z",
  tests: tests.map((test) => ({
    labTestId: test.id,
    testCode: test.code,
    testName: test.name,
    priceCents: test.priceCents,
    turnaroundHours: test.turnaroundHours,
  })),
};

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
    if (handler) return handler(url, init);
    if (url.startsWith("/api/patients")) {
      return Response.json({ items: [patient], nextCursor: null, hasMore: false });
    }
    if (url.startsWith("/api/tests")) {
      return Response.json({ items: tests, nextCursor: null, hasMore: false });
    }
    if (url === "/api/orders/order-1") return Response.json(createdOrder);
    return Response.json({ items: [], nextCursor: null, hasMore: false });
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

test("selects a patient and tests, then previews total and slowest turnaround", async () => {
  mockFetch();
  renderApp("/orders/new");
  fireEvent.click(await screen.findByRole("button", { name: /Rivera, Ada/ }));
  fireEvent.click(screen.getByRole("checkbox", { name: /CBC/ }));
  fireEvent.click(screen.getByRole("checkbox", { name: /CMP/ }));
  expect(
    requests.some(({ url }) => url.includes("/api/tests?") && url.includes("active=true")),
  ).toBe(true);
  expect(screen.getAllByText("$75.00").length).toBeGreaterThan(0);
  expect(screen.getByText("24 hours")).toBeTruthy();
  expect(screen.getByRole("heading", { name: "Selected tests" })).toBeTruthy();
  expect(screen.getAllByText("CBC · Complete Blood Count").length).toBeGreaterThan(0);
});

test("keeps a selected test visible after the catalog search changes", async () => {
  mockFetch((url) => {
    if (url.startsWith("/api/patients")) {
      return Response.json({ items: [patient], nextCursor: null, hasMore: false });
    }
    if (url.includes("search=cmp")) {
      return Response.json({ items: [tests[1]], nextCursor: null, hasMore: false });
    }
    return Response.json({ items: tests, nextCursor: null, hasMore: false });
  });
  renderApp("/orders/new");
  fireEvent.click(await screen.findByRole("checkbox", { name: /CBC/ }));
  fireEvent.change(screen.getByRole("textbox", { name: "Search lab tests" }), {
    target: { value: "cmp" },
  });
  fireEvent.submit(screen.getByRole("search", { name: "Search lab tests" }));
  await waitFor(() => expect(screen.queryByRole("checkbox", { name: /CBC/ })).toBeNull());
  expect(screen.getByRole("heading", { name: "Selected tests" })).toBeTruthy();
  expect(screen.getByText("CBC · Complete Blood Count")).toBeTruthy();
});

test("does not submit an empty selection", async () => {
  mockFetch();
  renderApp("/orders/new");
  fireEvent.click(await screen.findByRole("button", { name: "Create order" }));
  expect(await screen.findByText("Patient is required")).toBeTruthy();
  expect(screen.getByText("Select at least one lab test")).toBeTruthy();
  expect(
    requests.filter(({ url, init }) => url === "/api/orders" && init?.method === "POST"),
  ).toHaveLength(0);
});

test("prevents a second submit while the mutation is pending", async () => {
  let resolveCreate: ((value: Response) => void) | undefined;
  mockFetch((url, init) => {
    if (url === "/api/orders" && init?.method === "POST") {
      return new Promise((resolve) => {
        resolveCreate = resolve;
      });
    }
    if (url.startsWith("/api/patients")) {
      return Response.json({ items: [patient], nextCursor: null, hasMore: false });
    }
    if (url.startsWith("/api/tests")) {
      return Response.json({ items: tests, nextCursor: null, hasMore: false });
    }
    return Response.json(createdOrder);
  });
  renderApp("/orders/new");
  fireEvent.click(await screen.findByRole("button", { name: /Rivera, Ada/ }));
  fireEvent.click(screen.getByRole("checkbox", { name: /CBC/ }));
  fireEvent.click(screen.getByRole("button", { name: "Create order" }));
  await waitFor(() => expect(screen.getByRole("button", { name: "Creating order…" })).toBeTruthy());
  fireEvent.click(screen.getByRole("button", { name: "Creating order…" }));
  expect(
    requests.filter(({ url, init }) => url === "/api/orders" && init?.method === "POST"),
  ).toHaveLength(1);
  resolveCreate?.(Response.json(createdOrder, { status: 201 }));
});

test("preserves selections when the API rejects the order", async () => {
  mockFetch((url, init) => {
    if (url === "/api/orders" && init?.method === "POST") {
      return Response.json(
        { code: "INACTIVE_TEST", message: "Inactive lab tests cannot be ordered: TSH" },
        { status: 409 },
      );
    }
    if (url.startsWith("/api/patients")) {
      return Response.json({ items: [patient], nextCursor: null, hasMore: false });
    }
    return Response.json({ items: tests, nextCursor: null, hasMore: false });
  });
  renderApp("/orders/new");
  fireEvent.click(await screen.findByRole("button", { name: /Rivera, Ada/ }));
  fireEvent.click(screen.getByRole("checkbox", { name: /CBC/ }));
  fireEvent.click(screen.getByRole("button", { name: "Create order" }));
  expect(await screen.findByText("Inactive lab tests cannot be ordered: TSH")).toBeTruthy();
  expect(screen.getByText(/Rivera, Ada/)).toBeTruthy();
  expect(screen.getAllByText("CBC · Complete Blood Count").length).toBeGreaterThan(0);
});

test("creates an order and navigates to the historical detail", async () => {
  mockFetch((url, init) => {
    if (url === "/api/orders" && init?.method === "POST") {
      return Response.json(createdOrder, { status: 201 });
    }
    if (url === "/api/orders/order-1") return Response.json(createdOrder);
    if (url.startsWith("/api/patients")) {
      return Response.json({ items: [patient], nextCursor: null, hasMore: false });
    }
    return Response.json({ items: tests, nextCursor: null, hasMore: false });
  });
  const router = renderApp("/orders/new");
  fireEvent.click(await screen.findByRole("button", { name: /Rivera, Ada/ }));
  fireEvent.click(screen.getByRole("checkbox", { name: /CBC/ }));
  fireEvent.click(screen.getByRole("checkbox", { name: /CMP/ }));
  fireEvent.click(screen.getByRole("button", { name: "Create order" }));
  await waitFor(() => expect(router.state.location.pathname).toBe("/orders/order-1"));
  expect(await screen.findByRole("heading", { name: "Order for Rivera, Ada" })).toBeTruthy();
  expect(screen.getByText("$75.00")).toBeTruthy();
  const create = requests.find(({ url, init }) => url === "/api/orders" && init?.method === "POST");
  expect(JSON.parse(String(create?.init?.body))).toEqual({
    patientId: "patient-ada",
    testIds: ["test-cbc", "test-cmp"],
  });
});

test("lists orders and puts patient and status filters in the URL", async () => {
  const summary = (({ tests: _unused, ...rest }) => rest)(createdOrder);
  mockFetch((url) => {
    if (url.startsWith("/api/orders")) {
      return Response.json({ items: [summary], nextCursor: null, hasMore: false });
    }
    return Response.json({ items: [], nextCursor: null, hasMore: false });
  });
  const router = renderApp("/orders");
  expect(await screen.findByText("Rivera, Ada")).toBeTruthy();
  fireEvent.change(screen.getByLabelText("Search orders by patient"), {
    target: { value: "ada" },
  });
  fireEvent.submit(screen.getByRole("search"));
  await waitFor(() => expect(router.state.location.search).toMatchObject({ search: "ada" }));
  fireEvent.click(screen.getByLabelText("Status"));
  fireEvent.click(screen.getByRole("option", { name: "pending" }));
  await waitFor(() =>
    expect(router.state.location.search).toMatchObject({ search: "ada", status: "pending" }),
  );
  await waitFor(() =>
    expect(
      requests.some(
        ({ url }) =>
          url.includes("/api/orders?") &&
          url.includes("search=ada") &&
          url.includes("status=pending") &&
          !url.includes("after="),
      ),
    ).toBe(true),
  );
});

test("distinguishes an empty catalog from empty filtered results", async () => {
  mockFetch(() => Response.json({ items: [], nextCursor: null, hasMore: false }));
  renderApp("/orders?search=nobody");
  expect(await screen.findByRole("heading", { name: "No matching orders" })).toBeTruthy();
});

test("starts a pending order and requires confirmation to cancel", async () => {
  let current = { ...createdOrder, status: "pending" as const };
  mockFetch((url, init) => {
    if (url === "/api/orders/order-1" && init?.method === "PATCH") {
      current = { ...current, status: JSON.parse(String(init.body)).status };
      return Response.json(current);
    }
    if (url === "/api/orders/order-1") return Response.json(current);
    return Response.json({ items: [current], nextCursor: null, hasMore: false });
  });
  renderApp("/orders/order-1");
  fireEvent.click(await screen.findByRole("button", { name: "Start order" }));
  expect(await screen.findByRole("button", { name: "Complete order" })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Cancel order" }));
  fireEvent.click(screen.getByRole("button", { name: "Confirm cancel" }));
  expect(await screen.findByText(/cannot change/)).toBeTruthy();
});

test("shows a useful not-found state for an unknown order", async () => {
  mockFetch((url) => {
    if (url === "/api/orders/missing") {
      return Response.json(
        { code: "ORDER_NOT_FOUND", message: "Order not found" },
        { status: 404 },
      );
    }
    return Response.json({ items: [], nextCursor: null, hasMore: false });
  });
  renderApp("/orders/missing");
  expect(await screen.findByRole("heading", { name: "Order not found" })).toBeTruthy();
});
