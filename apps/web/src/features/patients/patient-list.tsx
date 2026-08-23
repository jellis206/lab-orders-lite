import { useInfiniteQuery } from "@tanstack/react-query";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import type { FormEvent } from "react";
import { Button } from "../../components/button";
import { Input } from "../../components/input";
import { LoadMore } from "../../components/load-more";
import { patientListOptions } from "./api";

export function PatientListPage() {
  const { search } = useSearch({ from: "/patients" });
  const navigate = useNavigate({ from: "/patients" });
  const query = useInfiniteQuery(patientListOptions(search ?? ""));
  const items = query.data?.pages.flatMap((page) => page.items) ?? [];

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = new FormData(event.currentTarget).get("search")?.toString().trim() ?? "";
    void navigate({ search: value ? { search: value } : {} });
  }

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-app-border pb-5">
        <div>
          <p className="mb-1 text-sm font-medium text-blue-700 dark:text-blue-400">
            Lab Orders Lite
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-app-text">Patients</h1>
          <p className="mt-2 text-sm text-app-muted">
            Find patient records and keep contact information current.
          </p>
        </div>
        <Link
          to="/patients/new"
          className="inline-flex min-h-10 items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
        >
          New patient
        </Link>
      </div>

      <form onSubmit={submitSearch} className="mt-6 flex max-w-xl gap-2" role="search">
        <label className="sr-only" htmlFor="patient-search">
          Search patients
        </label>
        <Input
          key={search ?? ""}
          id="patient-search"
          name="search"
          defaultValue={search ?? ""}
          placeholder="Search name, email, or phone"
          className="min-w-0 flex-1"
        />
        <Button type="submit">Search</Button>
      </form>

      {query.isPending ? (
        <p className="mt-8 text-sm text-app-muted" role="status">
          Loading patients…
        </p>
      ) : query.isError ? (
        <div
          className="mt-8 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
          role="alert"
        >
          <p>Patients could not be loaded. {query.error.message}</p>
          <button className="mt-2 font-semibold underline" onClick={() => void query.refetch()}>
            Try again
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-app-border bg-app-surface p-10 text-center">
          <h2 className="font-semibold text-app-text">No patients found</h2>
          <p className="mt-1 text-sm text-app-muted">
            {search ? "Try a different search." : "Create the first patient record."}
          </p>
        </div>
      ) : (
        <>
          <div className="mt-6 overflow-hidden rounded-xl border border-app-border bg-app-surface">
            <ul className="divide-y divide-app-border">
              {items.map((patient) => (
                <li key={patient.id}>
                  <Link
                    to="/patients/$patientId"
                    params={{ patientId: patient.id }}
                    className="grid gap-1 px-5 py-4 hover:bg-app-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600 sm:grid-cols-3"
                  >
                    <span className="font-medium text-app-text">
                      {patient.lastName}, {patient.firstName}
                    </span>
                    <span className="text-sm text-app-muted">DOB {patient.dateOfBirth}</span>
                    <span className="truncate text-sm text-app-muted">
                      {patient.email ?? patient.phone ?? "No contact information"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <LoadMore
            hasNextPage={Boolean(query.hasNextPage)}
            isFetchingNextPage={query.isFetchingNextPage}
            onLoadMore={() => void query.fetchNextPage()}
          />
        </>
      )}
    </section>
  );
}
