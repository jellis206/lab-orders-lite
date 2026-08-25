import { formatCents } from "@lab-orders/contracts";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import type { FormEvent } from "react";
import { Button } from "@/components/button";
import { Input } from "@/components/input";
import { Listbox, ListboxOption } from "@/components/listbox";
import { LoadMore } from "@/components/load-more";
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
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-app-border pb-5">
        <div>
          <p className="mb-1 text-sm font-medium text-blue-700 dark:text-blue-400">
            Lab Orders Lite
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-app-text">Lab Tests</h1>
          <p className="mt-2 text-sm text-app-muted">
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
          <Input
            key={search ?? ""}
            id="lab-test-search"
            name="search"
            defaultValue={search ?? ""}
            placeholder="Search code or name"
            className="min-w-0 flex-1"
          />
          <Button type="submit">Search</Button>
        </form>
        <div className="w-full sm:w-44">
          <label className="mb-1 block text-sm font-medium text-app-text" htmlFor="lab-test-active">
            Status
          </label>
          <Listbox
            id="lab-test-active"
            name="active"
            aria-label="Status"
            value={active ?? "all"}
            onChange={(next: string) => {
              void navigate({
                search: (previous) => ({
                  ...previous,
                  active: next === "true" || next === "false" ? next : undefined,
                }),
              });
            }}
          >
            <ListboxOption value="all">All tests</ListboxOption>
            <ListboxOption value="true">Active</ListboxOption>
            <ListboxOption value="false">Inactive</ListboxOption>
          </Listbox>
        </div>
      </div>

      {query.isPending ? (
        <p className="mt-8 text-sm text-app-muted" role="status">
          Loading lab tests…
        </p>
      ) : query.isError ? (
        <div
          className="mt-8 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
          role="alert"
        >
          <p>Lab tests could not be loaded. {query.error.message}</p>
          <button className="mt-2 font-semibold underline" onClick={() => void query.refetch()}>
            Try again
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-app-border bg-app-surface p-10 text-center">
          <h2 className="font-semibold text-app-text">No lab tests found</h2>
          <p className="mt-1 text-sm text-app-muted">
            {search || active ? "Try a different filter." : "Create the first catalog test."}
          </p>
        </div>
      ) : (
        <>
          <div className="mt-6 overflow-x-auto rounded-xl border border-app-border bg-app-surface">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-app-border bg-app-hover text-xs uppercase tracking-wide text-app-subtle">
                <tr>
                  <th className="px-5 py-3 font-medium">Code</th>
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Price</th>
                  <th className="hidden px-5 py-3 font-medium md:table-cell">Turnaround</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-app-border">
                {items.map((test) => (
                  <tr key={test.id} className="relative hover:bg-app-hover">
                    <td className="px-5 py-4 font-medium text-app-text">
                      <Link
                        to="/tests/$testId"
                        params={{ testId: test.id }}
                        className="after:absolute after:inset-0 after:z-10 focus:outline-none focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-blue-600"
                      >
                        {test.code}
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-app-muted">{test.name}</td>
                    <td className="px-5 py-4 text-app-muted">{formatCents(test.priceCents)}</td>
                    <td className="hidden px-5 py-4 text-app-muted md:table-cell">
                      {test.turnaroundHours} hours
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={
                          test.active
                            ? "inline-flex rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                            : "inline-flex rounded-full bg-app-hover px-2 py-1 text-xs font-medium text-app-muted"
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
          <LoadMore pager={query} />
        </>
      )}
    </section>
  );
}
