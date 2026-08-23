/* oxlint-disable react/only-export-components -- route definitions and typed router factory are intentionally colocated */
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Link,
  type RouterHistory,
} from "@tanstack/react-router";
import { z } from "zod";
import { orderStatusSchema } from "@lab-orders/contracts";
import { AppShell } from "./app-shell";
import { Button } from "./components/button";
import { LabTestListPage } from "./features/lab-tests/lab-test-list";
import { EditLabTestPage, NewLabTestPage } from "./features/lab-tests/lab-test-pages";
import { OrderListPage } from "./features/orders/order-list";
import { NewOrderPage, OrderDetailPage } from "./features/orders/order-pages";
import { PatientListPage } from "./features/patients/patient-list";
import { EditPatientPage, NewPatientPage } from "./features/patients/patient-pages";

function OverviewPage() {
  const cards = [
    {
      to: "/patients" as const,
      title: "Patients",
      description: "Create records and keep contact details current.",
    },
    {
      to: "/tests" as const,
      title: "Lab tests",
      description: "Maintain codes, prices, and turnaround hours.",
    },
    {
      to: "/orders" as const,
      title: "Orders",
      description: "Order active tests and keep historical snapshots.",
    },
  ];
  return (
    <section>
      <div className="border-b border-app-border pb-5">
        <p className="mb-1 text-sm font-medium text-blue-700 dark:text-blue-400">Lab Orders Lite</p>
        <h1 className="text-3xl font-semibold tracking-tight text-app-text">Overview</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-app-muted">
          Manage patients, the lab test catalog, and orders from one focused workspace.
        </p>
      </div>
      <ul className="mt-6 grid gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <li key={card.to}>
            <Link
              to={card.to}
              className="block rounded-xl border border-app-border bg-app-surface p-5 hover:border-blue-200 hover:bg-blue-50/40 dark:hover:border-blue-800 dark:hover:bg-blue-950/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              <h2 className="font-semibold text-app-text">{card.title}</h2>
              <p className="mt-2 text-sm text-app-muted">{card.description}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

const rootRoute = createRootRoute({
  component: AppShell,
  notFoundComponent: () => (
    <div className="rounded-xl border border-app-border bg-app-surface p-8">
      <h1 className="text-2xl font-semibold text-app-text">Page not found</h1>
      <p className="mt-2 text-app-muted">The page you requested does not exist.</p>
    </div>
  ),
  errorComponent: ({ error, reset }) => (
    <div className="rounded-xl border border-red-200 bg-app-surface p-8" role="alert">
      <h1 className="text-2xl font-semibold text-app-text">Something went wrong</h1>
      <p className="mt-2 text-app-muted">{error.message}</p>
      <Button className="mt-5" onClick={reset}>
        Try again
      </Button>
    </div>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: OverviewPage,
});

const patientsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/patients",
  validateSearch: z.object({ search: z.string().optional() }),
  component: PatientListPage,
});

const newPatientRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/patients/new",
  component: NewPatientPage,
});

const editPatientRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/patients/$patientId",
  validateSearch: z.object({ saved: z.coerce.boolean().optional() }),
  component: EditPatientPage,
});

const testsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/tests",
  validateSearch: z.object({
    search: z.string().optional(),
    active: z.enum(["true", "false"]).optional(),
  }),
  component: LabTestListPage,
});

const newTestRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/tests/new",
  component: NewLabTestPage,
});

const editTestRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/tests/$testId",
  validateSearch: z.object({ saved: z.coerce.boolean().optional() }),
  component: EditLabTestPage,
});

const ordersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/orders",
  validateSearch: z.object({
    search: z.string().optional(),
    status: orderStatusSchema.optional(),
  }),
  component: OrderListPage,
});

const newOrderRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/orders/new",
  component: NewOrderPage,
});

const orderDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/orders/$orderId",
  component: OrderDetailPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  patientsRoute,
  newPatientRoute,
  editPatientRoute,
  testsRoute,
  newTestRoute,
  editTestRoute,
  ordersRoute,
  newOrderRoute,
  orderDetailRoute,
]);

export function createAppRouter(history?: RouterHistory) {
  if (history === undefined) {
    return createRouter({ routeTree });
  }
  return createRouter({ routeTree, history });
}

export function createTestRouter(path = "/") {
  return createAppRouter(createMemoryHistory({ initialEntries: [path] }));
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createAppRouter>;
  }
}
