import { useInfiniteQuery } from "@tanstack/react-query";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import type { FormEvent } from "react";
import { Button } from "../../components/button";
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
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <p className="mb-1 text-sm font-medium text-blue-700">Lab Orders Lite</p>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">Patients</h1>
          <p className="mt-2 text-sm text-zinc-600">
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
        <input
          id="patient-search"
          name="search"
          defaultValue={search ?? ""}
          placeholder="Search name, email, or phone"
          className="min-h-10 min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-3 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
        />
        <Button type="submit">Search</Button>
      </form>

      {query.isPending ? (
        <p className="mt-8 text-sm text-zinc-600" role="status">
          Loading patients…
        </p>
      ) : query.isError ? (
        <div
          className="mt-8 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          role="alert"
        >
          <p>Patients could not be loaded. {query.error.message}</p>
          <button className="mt-2 font-semibold underline" onClick={() => void query.refetch()}>
            Try again
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-zinc-300 bg-white p-10 text-center">
          <h2 className="font-semibold text-zinc-900">No patients found</h2>
          <p className="mt-1 text-sm text-zinc-600">
            {search ? "Try a different search." : "Create the first patient record."}
          </p>
        </div>
      ) : (
        <>
          <div className="mt-6 overflow-hidden rounded-xl border border-zinc-200 bg-white">
            <ul className="divide-y divide-zinc-200">
              {items.map((patient) => (
                <li key={patient.id}>
                  <Link
                    to="/patients/$patientId"
                    params={{ patientId: patient.id }}
                    className="grid gap-1 px-5 py-4 hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600 sm:grid-cols-3"
                  >
                    <span className="font-medium text-zinc-950">
                      {patient.lastName}, {patient.firstName}
                    </span>
                    <span className="text-sm text-zinc-600">DOB {patient.dateOfBirth}</span>
                    <span className="truncate text-sm text-zinc-600">
                      {patient.email ?? patient.phone ?? "No contact information"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
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
