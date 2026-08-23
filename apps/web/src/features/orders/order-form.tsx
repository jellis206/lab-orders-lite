import {
  createOrderSchema,
  formatCents,
  type LabTestResponse,
  type PatientResponse,
} from "@lab-orders/contracts";
import { calculateEstimatedReadyAt, calculateOrderTotal } from "@lab-orders/domain";
import { useForm } from "@tanstack/react-form";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { ApiRequestError } from "../../api/client";
import { Button } from "../../components/button";
import { Input } from "../../components/input";
import { labTestListOptions } from "../lab-tests/api";
import { patientListOptions } from "../patients/api";
import { createOrder, orderKeys } from "./api";
import { formatDateTime } from "./format";

type FormValues = {
  patientId: string;
  testIds: string[];
};

const emptyTestIds: string[] = [];

export function OrderForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [patientQuery, setPatientQuery] = useState("");
  const [testQuery, setTestQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<PatientResponse>();
  const [selectedTests, setSelectedTests] = useState<LabTestResponse[]>([]);
  const patients = useInfiniteQuery(patientListOptions(patientQuery));
  const tests = useInfiniteQuery(labTestListOptions(testQuery, true));
  const mutation = useMutation({
    mutationFn: (value: FormValues) => createOrder(createOrderSchema.parse(value)),
    onSuccess: async (created) => {
      await queryClient.invalidateQueries({ queryKey: orderKeys.all });
      await navigate({ to: "/orders/$orderId", params: { orderId: created.id } });
    },
  });

  const form = useForm({
    defaultValues: { patientId: "", testIds: emptyTestIds },
    validators: {
      onSubmit: ({ value }) => {
        const parsed = createOrderSchema.safeParse(value);
        if (parsed.success) return undefined;
        const fields: Record<string, string> = {};
        for (const issue of parsed.error.issues) {
          const key = String(issue.path[0] ?? "");
          if (key && !fields[key]) fields[key] = issue.message;
        }
        return { fields };
      },
    },
    onSubmit: async ({ value }) => {
      try {
        await mutation.mutateAsync(value);
      } catch {
        // Recoverable API errors are rendered from mutation.isError.
      }
    },
  });

  const patientResults = patients.data?.pages.flatMap((page) => page.items) ?? [];
  const testResults = tests.data?.pages.flatMap((page) => page.items) ?? [];
  const previewTotal = calculateOrderTotal(selectedTests.map((test) => test.priceCents));
  const previewReady =
    selectedTests.length > 0
      ? calculateEstimatedReadyAt(
          new Date().toISOString(),
          selectedTests.map((test) => test.turnaroundHours),
        )
      : undefined;
  const slowest = selectedTests.reduce((max, test) => Math.max(max, test.turnaroundHours), 0);

  function submitPatientSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = new FormData(event.currentTarget).get("patientSearch")?.toString().trim() ?? "";
    setPatientQuery(value);
  }

  function submitTestSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = new FormData(event.currentTarget).get("testSearch")?.toString().trim() ?? "";
    setTestQuery(value);
  }

  function selectPatient(patient: PatientResponse) {
    setSelectedPatient(patient);
    form.setFieldValue("patientId", patient.id);
  }

  function toggleTest(test: LabTestResponse) {
    const exists = selectedTests.some((item) => item.id === test.id);
    const next = exists
      ? selectedTests.filter((item) => item.id !== test.id)
      : [...selectedTests, test];
    setSelectedTests(next);
    form.setFieldValue(
      "testIds",
      next.map((item) => item.id),
    );
  }

  return (
    <div className="mt-6 space-y-6">
      {mutation.isError && (
        <div
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
          role="alert"
        >
          {mutation.error instanceof ApiRequestError
            ? mutation.error.error.message
            : mutation.error.message}
        </div>
      )}

      <section className="rounded-xl border border-app-border bg-app-surface p-6">
        <h2 className="text-lg font-semibold text-app-text">Patient</h2>
        <p className="mt-1 text-sm text-app-muted">Search and select one patient for this order.</p>
        <form.Field name="patientId">
          {(field) => (
            <div className="mt-4">
              {selectedPatient ? (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-app-border bg-app-bg px-4 py-3">
                  <p>
                    <span className="font-medium text-app-text">
                      {selectedPatient.lastName}, {selectedPatient.firstName}
                    </span>
                    <span className="ml-2 text-sm text-app-muted">
                      DOB {selectedPatient.dateOfBirth}
                    </span>
                  </p>
                  <button
                    type="button"
                    className="text-sm font-semibold text-blue-700 hover:underline dark:text-blue-400"
                    onClick={() => {
                      setSelectedPatient(undefined);
                      field.handleChange("");
                    }}
                  >
                    Change patient
                  </button>
                </div>
              ) : (
                <>
                  <form
                    onSubmit={submitPatientSearch}
                    className="flex gap-2"
                    role="search"
                    aria-label="Search patients"
                  >
                    <label className="sr-only" htmlFor="patientSearch">
                      Search patients
                    </label>
                    <Input
                      id="patientSearch"
                      name="patientSearch"
                      defaultValue={patientQuery}
                      placeholder="Search name, email, or phone"
                      className="flex-1"
                    />
                    <Button type="submit">Search</Button>
                  </form>
                  {patients.isPending ? (
                    <p className="mt-3 text-sm text-app-muted" role="status">
                      Loading patients…
                    </p>
                  ) : patients.isError ? (
                    <p className="mt-3 text-sm text-red-700 dark:text-red-300" role="alert">
                      Patients could not be loaded. {patients.error.message}
                    </p>
                  ) : (
                    <ul className="mt-3 divide-y divide-app-border rounded-lg border border-app-border">
                      {patientResults.map((patient) => (
                        <li key={patient.id}>
                          <button
                            type="button"
                            className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-app-hover"
                            onClick={() => selectPatient(patient)}
                          >
                            <span className="font-medium text-app-text">
                              {patient.lastName}, {patient.firstName}
                            </span>
                            <span className="text-sm text-app-muted">{patient.dateOfBirth}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {patients.hasNextPage && (
                    <Button
                      type="button"
                      className="mt-3"
                      disabled={patients.isFetchingNextPage}
                      onClick={() => void patients.fetchNextPage()}
                    >
                      {patients.isFetchingNextPage ? "Loading…" : "Load more patients"}
                    </Button>
                  )}
                </>
              )}
              {field.state.meta.errors.length > 0 && (
                <p id="patientId-error" className="mt-2 text-sm text-red-700 dark:text-red-300">
                  {String(field.state.meta.errors[0])}
                </p>
              )}
            </div>
          )}
        </form.Field>
      </section>

      <section className="rounded-xl border border-app-border bg-app-surface p-6">
        <h2 className="text-lg font-semibold text-app-text">Lab tests</h2>
        <p className="mt-1 text-sm text-app-muted">
          Search active catalog tests. Selected tests stay visible if the search changes.
        </p>
        <form.Field name="testIds">
          {(field) => (
            <div className="mt-4">
              <form
                onSubmit={submitTestSearch}
                className="flex gap-2"
                role="search"
                aria-label="Search lab tests"
              >
                <label className="sr-only" htmlFor="testSearch">
                  Search lab tests
                </label>
                <Input
                  id="testSearch"
                  name="testSearch"
                  defaultValue={testQuery}
                  placeholder="Search code or name"
                  className="flex-1"
                />
                <Button type="submit">Search</Button>
              </form>
              {tests.isPending ? (
                <p className="mt-3 text-sm text-app-muted" role="status">
                  Loading lab tests…
                </p>
              ) : tests.isError ? (
                <p className="mt-3 text-sm text-red-700 dark:text-red-300" role="alert">
                  Lab tests could not be loaded. {tests.error.message}
                </p>
              ) : (
                <ul className="mt-3 divide-y divide-app-border rounded-lg border border-app-border">
                  {testResults.map((test) => {
                    const checked = selectedTests.some((item) => item.id === test.id);
                    return (
                      <li key={test.id}>
                        <label className="flex cursor-pointer items-start gap-3 px-4 py-3 hover:bg-app-hover">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleTest(test)}
                            className="mt-1 size-4 rounded border-app-border text-blue-600 focus:ring-blue-600"
                          />
                          <span>
                            <span className="block font-medium text-app-text">
                              {test.code} · {test.name}
                            </span>
                            <span className="text-sm text-app-muted">
                              {formatCents(test.priceCents)} · {test.turnaroundHours} hours
                            </span>
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              )}
              {tests.hasNextPage && (
                <Button
                  type="button"
                  className="mt-3"
                  disabled={tests.isFetchingNextPage}
                  onClick={() => void tests.fetchNextPage()}
                >
                  {tests.isFetchingNextPage ? "Loading…" : "Load more tests"}
                </Button>
              )}
              {selectedTests.length > 0 && (
                <div className="mt-5">
                  <h3 className="text-sm font-semibold text-app-text">Selected tests</h3>
                  <ul className="mt-2 divide-y divide-app-border rounded-lg border border-app-border">
                    {selectedTests.map((test) => (
                      <li
                        key={test.id}
                        className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
                      >
                        <span>
                          {test.code} · {test.name}
                        </span>
                        <span className="flex items-center gap-3">
                          <span className="text-app-muted">
                            {formatCents(test.priceCents)} · {test.turnaroundHours} hours
                          </span>
                          <button
                            type="button"
                            className="font-semibold text-blue-700 hover:underline dark:text-blue-400"
                            onClick={() => toggleTest(test)}
                          >
                            Remove {test.code}
                          </button>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {field.state.meta.errors.length > 0 && (
                <p id="testIds-error" className="mt-2 text-sm text-red-700 dark:text-red-300">
                  {String(field.state.meta.errors[0])}
                </p>
              )}
            </div>
          )}
        </form.Field>
      </section>

      <section className="rounded-xl border border-app-border bg-app-surface p-6">
        <h2 className="text-lg font-semibold text-app-text">Preview</h2>
        {selectedTests.length === 0 ? (
          <p className="mt-2 text-sm text-app-muted">Select tests to preview cost and readiness.</p>
        ) : (
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-zinc-500">Total</dt>
              <dd className="font-semibold text-app-text">{formatCents(previewTotal)}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Slowest turnaround</dt>
              <dd className="font-semibold text-app-text">{slowest} hours</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Estimated ready</dt>
              <dd className="font-semibold text-app-text">
                {previewReady ? formatDateTime(previewReady) : "—"}
              </dd>
            </div>
          </dl>
        )}
      </section>

      <div className="flex gap-3">
        <Button
          type="button"
          disabled={mutation.isPending}
          onClick={() => void form.handleSubmit()}
        >
          {mutation.isPending ? "Creating order…" : "Create order"}
        </Button>
        <button
          type="button"
          className="rounded-lg px-4 py-2 text-sm font-semibold text-app-muted hover:bg-app-hover"
          onClick={() => void navigate({ to: "/orders" })}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
