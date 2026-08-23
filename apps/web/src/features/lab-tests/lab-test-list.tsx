import { formatCents } from "@lab-orders/contracts";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import type { FormEvent } from "react";
import { Button } from "../../components/button";
import { labTestListOptions } from "./api";

function parseActive(value?: "true" | "false") {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

export function LabTestListPage() {
  const { search, active } = useSearch({ from: "/tests" });
  const navigate = useNavigate({ from: "/tests" });
  const query = useInfiniteQuery(labTestListOptions(search ?? "", parseActive(active)));
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
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">Lab Tests</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Maintain test codes, pricing, and elapsed-hour turnaround times.
          </p>
        </div>
        <Link
          to="/tests/new"
          className="inline-flex min-h-10 items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
        >
          New test
        </Link>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end">
        <form onSubmit={submitSearch} className="flex max-w-xl flex-1 gap-2" role="search">
          <label className="sr-only" htmlFor="lab-test-search">
            Search lab tests
          </label>
          <input
            id="lab-test-search"
            name="search"
            defaultValue={search ?? ""}
            placeholder="Search code or name"
            className="min-h-10 min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-3 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
          />
          <Button type="submit">Search</Button>
        </form>
        <div>
          <label className="text-sm font-medium text-zinc-800" htmlFor="lab-test-active">
            Status
          </label>
          <select
            id="lab-test-active"
            value={active ?? ""}
            onChange={(event) => {
              const next = event.target.value;
              void navigate({
                search: (previous) => ({
                  ...previous,
                  active: next === "true" || next === "false" ? next : undefined,
                }),
              });
            }}
            className="mt-1 block min-h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
          >
            <option value="">All tests</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </div>

      {query.isPending ? (
        <p className="mt-8 text-sm text-zinc-600" role="status">
          Loading lab tests…
        </p>
      ) : query.isError ? (
        <div
          className="mt-8 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          role="alert"
        >
          <p>Lab tests could not be loaded. {query.error.message}</p>
          <button className="mt-2 font-semibold underline" onClick={() => void query.refetch()}>
            Try again
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-zinc-300 bg-white p-10 text-center">
          <h2 className="font-semibold text-zinc-900">No lab tests found</h2>
          <p className="mt-1 text-sm text-zinc-600">
            {search || active ? "Try a different filter." : "Create the first catalog test."}
          </p>
        </div>
      ) : (
        <>
          <div className="mt-6 overflow-x-auto rounded-xl border border-zinc-200 bg-white">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Code</th>
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Price</th>
                  <th className="px-5 py-3 font-medium">Turnaround</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {items.map((test) => (
                  <tr key={test.id} className="hover:bg-zinc-50">
                    <td className="px-5 py-4 font-medium text-zinc-950">
                      <Link
                        to="/tests/$testId"
                        params={{ testId: test.id }}
                        className="rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                      >
                        {test.code}
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-zinc-700">{test.name}</td>
                    <td className="px-5 py-4 text-zinc-700">{formatCents(test.priceCents)}</td>
                    <td className="px-5 py-4 text-zinc-700">{test.turnaroundHours} hours</td>
                    <td className="px-5 py-4">
                      <span
                        className={
                          test.active
                            ? "inline-flex rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-800"
                            : "inline-flex rounded-full bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700"
                        }
                      >
                        {test.active ? "Active" : "Inactive"}
                      </span>
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
