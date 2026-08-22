/* oxlint-disable react/only-export-components -- route definitions and typed router factory are intentionally colocated */
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  type RouterHistory,
} from "@tanstack/react-router";
import { z } from "zod";
import { AppShell } from "./app-shell";
import { Button } from "./components/button";
import { PatientListPage } from "./features/patients/patient-list";
import { EditPatientPage, NewPatientPage } from "./features/patients/patient-pages";

function Page({ title, description }: { title: string; description: string }) {
  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <p className="mb-1 text-sm font-medium text-blue-700">Lab Orders Lite</p>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">{description}</p>
        </div>
        {title !== "Overview" && (
          <Button type="button">
            New {title === "Lab Tests" ? "test" : title.slice(0, -1).toLowerCase()}
          </Button>
        )}
      </div>
      <div className="mt-6 rounded-xl border border-dashed border-zinc-300 bg-white p-10 text-center text-sm text-zinc-500">
        {title} workspace ready for its feature slice.
      </div>
    </section>
  );
}

const rootRoute = createRootRoute({
  component: AppShell,
  notFoundComponent: () => (
    <div className="rounded-xl border border-zinc-200 bg-white p-8">
      <h1 className="text-2xl font-semibold text-zinc-950">Page not found</h1>
      <p className="mt-2 text-zinc-600">The page you requested does not exist.</p>
    </div>
  ),
  errorComponent: ({ error, reset }) => (
    <div className="rounded-xl border border-red-200 bg-white p-8" role="alert">
      <h1 className="text-2xl font-semibold text-zinc-950">Something went wrong</h1>
      <p className="mt-2 text-zinc-600">{error.message}</p>
      <Button className="mt-5" onClick={reset}>
        Try again
      </Button>
    </div>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => (
    <Page
      title="Overview"
      description="Manage patients, the lab test catalog, and orders from one focused workspace."
    />
  ),
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
  component: () => (
    <Page
      title="Lab Tests"
      description="Maintain test codes, pricing, and elapsed-hour turnaround times."
    />
  ),
});

const ordersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/orders",
  component: () => (
    <Page
      title="Orders"
      description="Create and track historically accurate multi-test lab orders."
    />
  ),
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  patientsRoute,
  newPatientRoute,
  editPatientRoute,
  testsRoute,
  ordersRoute,
]);

export function createAppRouter(history?: RouterHistory) {
  return createRouter({ routeTree, ...(history === undefined ? {} : { history }) });
}

export function createTestRouter(path = "/") {
  return createAppRouter(createMemoryHistory({ initialEntries: [path] }));
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createAppRouter>;
  }
}
