import { createPatientSchema, type PatientResponse } from "@lab-orders/contracts";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { ApiRequestError } from "@/api/client";
import { Button } from "@/components/button";
import { Input } from "@/components/input";
import { createPatient, patientKeys, updatePatient } from "./api";

type FormValues = {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email: string;
  phone: string;
};

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

  const contactPartner: Partial<Record<keyof FormValues, "email" | "phone">> = {
    email: "phone",
    phone: "email",
  };

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
      className="mt-6 max-w-2xl rounded-xl border border-app-border bg-app-surface p-6"
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void form.handleSubmit();
      }}
    >
      {mutation.isError && (
        <div
          className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
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
            ["email", "Email", "email", "email"],
            ["phone", "Phone", "tel", "tel"],
          ] as const
        ).map(([name, label, type, autocomplete]) => (
          <form.Field
            key={name}
            name={name}
            validators={
              contactPartner[name]
                ? {
                    onChangeListenTo: [contactPartner[name]],
                    onBlurListenTo: [contactPartner[name]],
                  }
                : undefined
            }
          >
            {(field) => (
              <div>
                <label className="text-sm font-medium text-app-text" htmlFor={field.name}>
                  {label}
                </label>
                <Input
                  id={field.name}
                  name={field.name}
                  type={type}
                  autoComplete={autocomplete}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  className="mt-1"
                  aria-invalid={field.state.meta.errors.length > 0}
                  aria-describedby={
                    field.state.meta.errors.length ? `${field.name}-error` : undefined
                  }
                  invalid={field.state.meta.errors.length > 0}
                />
                <p
                  id={`${field.name}-error`}
                  aria-hidden={field.state.meta.errors.length === 0}
                  className={`mt-1 min-h-10 text-sm text-red-700 dark:text-red-300 ${
                    field.state.meta.errors.length > 0 ? "" : "invisible"
                  }`}
                >
                  {field.state.meta.errors.length > 0 ? String(field.state.meta.errors[0]) : " "}
                </p>
              </div>
            )}
          </form.Field>
        ))}
      </div>
      <p className="mt-3 text-sm text-app-muted">
        Provide at least an email or phone number so results can be shared when an order is ready.
      </p>
      <div className="mt-7 flex gap-3">
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Saving…" : patient ? "Save changes" : "Create patient"}
        </Button>
        <button
          type="button"
          className="rounded-lg px-4 py-2 text-sm font-semibold text-app-muted hover:bg-app-hover"
          onClick={() => {
            void navigate({ to: "/patients" });
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
