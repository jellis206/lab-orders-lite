import { useInfiniteQuery } from "@tanstack/react-query";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import type { FormEvent } from "react";
import { Button } from "../../components/button";
import { orderListOptions } from "./api";
import { formatDateTime, formatMoney, formatStatus } from "./format";

const statuses = ["pending", "in_progress", "completed", "cancelled"] as const;

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
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <p className="mb-1 text-sm font-medium text-blue-700">Lab Orders Lite</p>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">Orders</h1>
          <p className="mt-2 text-sm text-zinc-600">
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
          <input
            id="order-search"
            name="search"
            defaultValue={search ?? ""}
            placeholder="Search patient name"
            className="min-h-10 min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-3 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
          />
          <Button type="submit">Search</Button>
        </form>
        <div>
          <label className="text-sm font-medium text-zinc-800" htmlFor="order-status">
            Status
          </label>
          <select
            id="order-status"
            value={status ?? ""}
            onChange={(event) => {
              const next = event.target.value;
              void navigate({
                search: (previous) => ({
                  ...previous,
                  status: statuses.includes(next as (typeof statuses)[number])
                    ? (next as (typeof statuses)[number])
                    : undefined,
                }),
              });
            }}
            className="mt-1 block min-h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm capitalize focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
          >
            <option value="">All statuses</option>
            {statuses.map((value) => (
              <option key={value} value={value}>
                {formatStatus(value)}
              </option>
            ))}
          </select>
        </div>
        {(search || status) && (
          <button
            type="button"
            className="min-h-10 rounded-lg px-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-100"
            onClick={() => void navigate({ search: {} })}
          >
            Clear filters
          </button>
        )}
      </div>

      {query.isPending ? (
        <p className="mt-8 text-sm text-zinc-600" role="status">
          Loading orders…
        </p>
      ) : query.isError ? (
        <div
          className="mt-8 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          role="alert"
        >
          <p>Orders could not be loaded. {query.error.message}</p>
          <button className="mt-2 font-semibold underline" onClick={() => void query.refetch()}>
            Try again
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-zinc-300 bg-white p-10 text-center">
          <h2 className="font-semibold text-zinc-900">
            {search || status ? "No matching orders" : "No orders yet"}
          </h2>
          <p className="mt-1 text-sm text-zinc-600">
            {search || status
              ? "Try a different patient or status filter."
              : "Create the first order."}
          </p>
        </div>
      ) : (
        <>
          <div className="mt-6 overflow-x-auto rounded-xl border border-zinc-200 bg-white">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Patient</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Ordered</th>
                  <th className="px-5 py-3 font-medium">Tests</th>
                  <th className="px-5 py-3 font-medium">Total</th>
                  <th className="px-5 py-3 font-medium">Ready</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {items.map((order) => (
                  <tr key={order.id} className="hover:bg-zinc-50">
                    <td className="px-5 py-4 font-medium text-zinc-950">
                      <Link
                        to="/orders/$orderId"
                        params={{ orderId: order.id }}
                        className="rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                      >
                        {order.patientLastName}, {order.patientFirstName}
                      </Link>
                    </td>
                    <td className="px-5 py-4 capitalize">{formatStatus(order.status)}</td>
                    <td className="px-5 py-4 text-zinc-600">{formatDateTime(order.orderedAt)}</td>
                    <td className="px-5 py-4 text-zinc-600">{order.testCount}</td>
                    <td className="px-5 py-4 text-zinc-600">{formatMoney(order.totalCents)}</td>
                    <td className="px-5 py-4 text-zinc-600">
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
