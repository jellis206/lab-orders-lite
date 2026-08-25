import { useQuery } from "@tanstack/react-query";
import { Link, useParams, useSearch } from "@tanstack/react-router";
import { ApiRequestError } from "@/api/client";
import { patientDetailOptions } from "./api";
import { PatientForm } from "./patient-form";

function Header({ title, description }: { title: string; description: string }) {
  return (
    <div className="border-b border-app-border pb-5">
      <Link
        to="/patients"
        className="text-sm font-medium text-blue-700 dark:text-blue-400 hover:underline"
      >
        ← Patients
      </Link>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-app-text">{title}</h1>
      <p className="mt-2 text-sm text-app-muted">{description}</p>
    </div>
  );
}

export function NewPatientPage() {
  return (
    <section>
      <Header
        title="New patient"
        description="Add a patient record with at least one contact method."
      />
      <PatientForm />
    </section>
  );
}

export function EditPatientPage() {
  const { patientId } = useParams({ from: "/patients/$patientId" });
  const { saved } = useSearch({ from: "/patients/$patientId" });
  const query = useQuery(patientDetailOptions(patientId));
  if (query.isPending) return <p role="status">Loading patient…</p>;
  if (query.isError) {
    const missing = query.error instanceof ApiRequestError && query.error.status === 404;
    return (
      <div role="alert" className="rounded-xl border border-app-border bg-app-surface p-8">
        <h1 className="text-2xl font-semibold">
          {missing ? "Patient not found" : "Patient could not be loaded"}
        </h1>
        <p className="mt-2 text-app-muted">{query.error.message}</p>
        <Link
          to="/patients"
          className="mt-4 inline-block font-semibold text-blue-700 hover:underline dark:text-blue-400"
        >
          Back to patients
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
          Patient saved successfully.
        </p>
      )}
      <Header
        title={`Edit ${query.data.firstName} ${query.data.lastName}`}
        description="Update demographics or contact information."
      />
      <PatientForm patient={query.data} />
    </section>
  );
}
