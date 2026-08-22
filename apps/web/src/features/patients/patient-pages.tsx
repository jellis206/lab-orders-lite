import { useQuery } from "@tanstack/react-query";
import { Link, useParams, useSearch } from "@tanstack/react-router";
import { ApiRequestError } from "../../api/client";
import { patientDetailOptions } from "./api";
import { PatientForm } from "./patient-form";

function Header({ title, description }: { title: string; description: string }) {
  return (
    <div className="border-b border-zinc-200 pb-5">
      <Link to="/patients" className="text-sm font-medium text-blue-700 hover:underline">
        ← Patients
      </Link>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">{title}</h1>
      <p className="mt-2 text-sm text-zinc-600">{description}</p>
    </div>
  );
}

export function NewPatientPage() {
  return (
    <section>
      <Header
        title="New patient"
        description="Add a patient record and optional contact information."
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
      <div role="alert" className="rounded-xl border border-zinc-200 bg-white p-8">
        <h1 className="text-2xl font-semibold">
          {missing ? "Patient not found" : "Patient could not be loaded"}
        </h1>
        <p className="mt-2 text-zinc-600">{query.error.message}</p>
        <Link
          to="/patients"
          className="mt-4 inline-block font-semibold text-blue-700 hover:underline"
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
          className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"
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
