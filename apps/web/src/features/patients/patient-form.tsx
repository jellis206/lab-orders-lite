import { createPatientSchema, type PatientResponse } from "@lab-orders/contracts";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { ApiRequestError } from "../../api/client";
import { Button } from "../../components/button";
import { createPatient, patientKeys, updatePatient } from "./api";

type FormValues = {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email: string;
  phone: string;
};

const inputClass =
  "mt-1 block min-h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600";

export function PatientForm({ patient }: { patient?: PatientResponse }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (value: FormValues) =>
      patient ? updatePatient(patient.id, value) : createPatient(value),
    onSuccess: async (saved) => {
      await queryClient.invalidateQueries({ queryKey: patientKeys.all });
      await navigate({
        to: "/patients/$patientId",
        params: { patientId: saved.id },
        search: { saved: true },
      });
    },
  });

  const form = useForm({
    defaultValues: {
      firstName: patient?.firstName ?? "",
      lastName: patient?.lastName ?? "",
      dateOfBirth: patient?.dateOfBirth ?? "",
      email: patient?.email ?? "",
      phone: patient?.phone ?? "",
    },
    validators: {
      onSubmit: ({ value }) => {
        const result = createPatientSchema.safeParse(value);
        if (result.success) return undefined;
        return {
          fields: Object.fromEntries(
            result.error.issues
              .filter((issue) => issue.path.length > 0)
              .map((issue) => [String(issue.path[0]), issue.message]),
          ),
        };
      },
    },
    onSubmit: ({ value }) => mutation.mutateAsync(value),
  });

  return (
    <form
      className="mt-6 max-w-2xl rounded-xl border border-zinc-200 bg-white p-6"
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void form.handleSubmit();
      }}
    >
      {mutation.isError && (
        <div
          className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
          role="alert"
        >
          {mutation.error instanceof ApiRequestError
            ? mutation.error.error.message
            : mutation.error.message}
        </div>
      )}
      <div className="grid gap-5 sm:grid-cols-2">
        {(
          [
            ["firstName", "First name", "text", "given-name"],
            ["lastName", "Last name", "text", "family-name"],
            ["dateOfBirth", "Date of birth", "date", "bday"],
            ["email", "Email (optional)", "email", "email"],
            ["phone", "Phone (optional)", "tel", "tel"],
          ] as const
        ).map(([name, label, type, autocomplete]) => (
          <form.Field key={name} name={name}>
            {(field) => (
              <div>
                <label className="text-sm font-medium text-zinc-800" htmlFor={field.name}>
                  {label}
                </label>
                <input
                  id={field.name}
                  name={field.name}
                  type={type}
                  autoComplete={autocomplete}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  className={inputClass}
                  aria-invalid={field.state.meta.errors.length > 0}
                  aria-describedby={
                    field.state.meta.errors.length ? `${field.name}-error` : undefined
                  }
                />
                {field.state.meta.errors.length > 0 && (
                  <p id={`${field.name}-error`} className="mt-1 text-sm text-red-700">
                    {String(field.state.meta.errors[0])}
                  </p>
                )}
              </div>
            )}
          </form.Field>
        ))}
      </div>
      <div className="mt-7 flex gap-3">
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Saving…" : patient ? "Save changes" : "Create patient"}
        </Button>
        <button
          type="button"
          className="rounded-lg px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-100"
          onClick={() =>
            void navigate({
              to: patient ? "/patients/$patientId" : "/patients",
              ...(patient ? { params: { patientId: patient.id } } : {}),
            })
          }
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
