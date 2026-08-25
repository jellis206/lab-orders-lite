import { useQuery } from "@tanstack/react-query";
import { Link, useParams, useSearch } from "@tanstack/react-router";
import { ApiRequestError } from "@/api/client";
import { labTestDetailOptions } from "./api";
import { LabTestForm } from "./lab-test-form";

function Header({ title, description }: { title: string; description: string }) {
  return (
    <div className="border-b border-app-border pb-5">
      <Link
        to="/tests"
        className="text-sm font-medium text-blue-700 dark:text-blue-400 hover:underline"
      >
        ← Lab tests
      </Link>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-app-text">{title}</h1>
      <p className="mt-2 text-sm text-app-muted">{description}</p>
    </div>
  );
}

export function NewLabTestPage() {
  return (
    <section>
      <Header
        title="New lab test"
        description="Add a catalog test with an exact dollar price and elapsed-hour turnaround."
      />
      <LabTestForm />
    </section>
  );
}

export function EditLabTestPage() {
  const { testId } = useParams({ from: "/tests/$testId" });
  const { saved } = useSearch({ from: "/tests/$testId" });
  const query = useQuery(labTestDetailOptions(testId));
  if (query.isPending) return <p role="status">Loading lab test…</p>;
  if (query.isError) {
    const missing = query.error instanceof ApiRequestError && query.error.status === 404;
    return (
      <div role="alert" className="rounded-xl border border-app-border bg-app-surface p-8">
        <h1 className="text-2xl font-semibold">
          {missing ? "Lab test not found" : "Lab test could not be loaded"}
        </h1>
        <p className="mt-2 text-app-muted">{query.error.message}</p>
        <Link
          to="/tests"
          className="mt-4 inline-block font-semibold text-blue-700 hover:underline dark:text-blue-400"
        >
          Back to lab tests
        </Link>
      </div>
    );
  }
  return (
    <section>
      {saved && (
        <p
          className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
          role="status"
        >
          Lab test saved successfully.
        </p>
      )}
      <Header
        title={`Edit ${query.data.code}`}
        description="Update pricing, turnaround, or whether this test can be ordered."
      />
      <LabTestForm labTest={query.data} />
    </section>
  );
}
