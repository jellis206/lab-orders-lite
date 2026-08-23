import { useInfiniteQuery } from "@tanstack/react-query";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import type { FormEvent } from "react";
import { Button } from "../../components/button";
import { Input } from "../../components/input";
import { Listbox, ListboxOption } from "../../components/listbox";
import { orderListOptions } from "./api";
import { formatDateTime, formatMoney, formatStatus } from "./format";

const statuses = ["pending", "in_progress", "completed", "cancelled"] as const;
type OrderStatusFilter = (typeof statuses)[number];

function parseOrderStatusFilter(value: string): OrderStatusFilter | undefined {
  for (const status of statuses) {
    if (status === value) return status;
  }
  return undefined;
}

export function OrderListPage() {
  const { search, status } = useSearch({ from: "/orders" });
  const navigate = useNavigate({ from: "/orders" });
  const query = useInfiniteQuery(orderListOptions(search ?? "", status));
  const items = query.data?.pages.flatMap((page) => page.items) ?? [];

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = new FormData(event.currentTarget).get("search")?.toString().trim() ?? "";
    void navigate({
      search: (previous) => ({
        ...previous,
        search: value || undefined,
      }),
    });
  }

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-app-border pb-5">
        <div>
          <p className="mb-1 text-sm font-medium text-blue-700 dark:text-blue-400">
            Lab Orders Lite
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-app-text">Orders</h1>
          <p className="mt-2 text-sm text-app-muted">
            Browse newest orders first and inspect historical snapshots.
          </p>
        </div>
        <Link
          to="/orders/new"
          className="inline-flex min-h-10 items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
        >
          New order
        </Link>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end">
        <form onSubmit={submitSearch} className="flex max-w-xl flex-1 gap-2" role="search">
          <label className="sr-only" htmlFor="order-search">
            Search orders by patient
          </label>
          <Input
            id="order-search"
            name="search"
            defaultValue={search ?? ""}
            placeholder="Search patient name"
            className="min-w-0 flex-1"
          />
          <Button type="submit">Search</Button>
        </form>
        <div className="w-full sm:w-48">
          <label className="text-sm font-medium text-app-text" htmlFor="order-status">
            Status
          </label>
          <Listbox
            id="order-status"
            name="status"
            aria-label="Status"
            value={status ?? "all"}
            onChange={(next: string) => {
              void navigate({
                search: (previous) => ({
                  ...previous,
                  status: parseOrderStatusFilter(next),
                }),
              });
            }}
            className="mt-1"
          >
            <ListboxOption value="all">All statuses</ListboxOption>
            {statuses.map((value) => (
              <ListboxOption key={value} value={value}>
                <span className="capitalize">{formatStatus(value)}</span>
              </ListboxOption>
            ))}
          </Listbox>
        </div>
        {(search || status) && (
          <button
            type="button"
            className="min-h-10 rounded-lg px-3 text-sm font-semibold text-app-muted hover:bg-app-hover"
            onClick={() => void navigate({ search: {} })}
          >
            Clear filters
          </button>
        )}
      </div>

      {query.isPending ? (
        <p className="mt-8 text-sm text-app-muted" role="status">
          Loading orders…
        </p>
      ) : query.isError ? (
        <div
          className="mt-8 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
          role="alert"
        >
          <p>Orders could not be loaded. {query.error.message}</p>
          <button className="mt-2 font-semibold underline" onClick={() => void query.refetch()}>
            Try again
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-app-border bg-app-surface p-10 text-center">
          <h2 className="font-semibold text-app-text">
            {search || status ? "No matching orders" : "No orders yet"}
          </h2>
          <p className="mt-1 text-sm text-app-muted">
            {search || status
              ? "Try a different patient or status filter."
              : "Create the first order."}
          </p>
        </div>
      ) : (
        <>
          <div className="mt-6 overflow-x-auto rounded-xl border border-app-border bg-app-surface">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-app-border bg-app-hover text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Patient</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Ordered</th>
                  <th className="px-5 py-3 font-medium">Tests</th>
                  <th className="px-5 py-3 font-medium">Total</th>
                  <th className="px-5 py-3 font-medium">Ready</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-app-border">
                {items.map((order) => (
                  <tr key={order.id} className="relative hover:bg-app-hover">
                    <td className="px-5 py-4 font-medium text-app-text">
                      <Link
                        to="/orders/$orderId"
                        params={{ orderId: order.id }}
                        className="after:absolute after:inset-0 after:z-10 focus:outline-none focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-blue-600"
                      >
                        {order.patientLastName}, {order.patientFirstName}
                      </Link>
                    </td>
                    <td className="px-5 py-4 capitalize">{formatStatus(order.status)}</td>
                    <td className="px-5 py-4 text-app-muted">{formatDateTime(order.orderedAt)}</td>
                    <td className="px-5 py-4 text-app-muted">{order.testCount}</td>
                    <td className="px-5 py-4 text-app-muted">{formatMoney(order.totalCents)}</td>
                    <td className="px-5 py-4 text-app-muted">
                      {formatDateTime(order.estimatedReadyAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {query.hasNextPage && (
            <div className="mt-5 text-center">
              <Button
                disabled={query.isFetchingNextPage}
                onClick={() => void query.fetchNextPage()}
              >
                {query.isFetchingNextPage ? "Loading…" : "Load more"}
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
