import {
  centsToDollarInput,
  createLabTestSchema,
  parseDollarInput,
  type LabTestResponse,
} from "@lab-orders/contracts";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { ApiRequestError } from "../../api/client";
import { Button } from "../../components/button";
import { Input } from "../../components/input";
import { createLabTest, labTestKeys, updateLabTest } from "./api";

type FormValues = {
  code: string;
  name: string;
  price: string;
  turnaroundHours: string;
  active: boolean;
};

function toPayload(value: FormValues) {
  const price = parseDollarInput(value.price);
  const rawTurnaroundHours = value.turnaroundHours.trim();
  const turnaroundHours = /^\d+$/.test(rawTurnaroundHours)
    ? Number(rawTurnaroundHours)
    : Number.NaN;
  return {
    code: value.code,
    name: value.name,
    priceCents: price.ok ? price.cents : Number.NaN,
    turnaroundHours: Number.isFinite(turnaroundHours) ? turnaroundHours : Number.NaN,
    active: value.active,
  };
}

export function LabTestForm({ labTest }: { labTest?: LabTestResponse }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (value: FormValues) => {
      const payload = createLabTestSchema.parse(toPayload(value));
      return labTest ? updateLabTest(labTest.id, payload) : createLabTest(payload);
    },
    onSuccess: async (saved) => {
      await queryClient.invalidateQueries({ queryKey: labTestKeys.all });
      await navigate({
        to: "/tests/$testId",
        params: { testId: saved.id },
        search: { saved: true },
      });
    },
  });

  const form = useForm({
    defaultValues: {
      code: labTest?.code ?? "",
      name: labTest?.name ?? "",
      price: labTest ? centsToDollarInput(labTest.priceCents) : "",
      turnaroundHours: labTest ? String(labTest.turnaroundHours) : "",
      active: labTest?.active ?? true,
    } satisfies FormValues,
    validators: {
      onSubmit: ({ value }) => {
        const price = parseDollarInput(value.price);
        const fields: Record<string, string> = {};
        if (!price.ok) fields.price = price.message;
        const parsed = createLabTestSchema.safeParse(toPayload(value));
        if (!parsed.success) {
          for (const issue of parsed.error.issues) {
            const key = String(issue.path[0] === "priceCents" ? "price" : issue.path[0]);
            if (key && !fields[key]) fields[key] = issue.message;
          }
        }
        return Object.keys(fields).length > 0 ? { fields } : undefined;
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
        <form.Field name="code">
          {(field) => (
            <div>
              <label className="text-sm font-medium text-app-text" htmlFor={field.name}>
                Code
              </label>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                className="mt-1"
                autoCapitalize="characters"
                aria-invalid={field.state.meta.errors.length > 0}
                aria-describedby={
                  field.state.meta.errors.length ? `${field.name}-error` : undefined
                }
                invalid={field.state.meta.errors.length > 0}
              />
              {field.state.meta.errors.length > 0 && (
                <p
                  id={`${field.name}-error`}
                  className="mt-1 text-sm text-red-700 dark:text-red-300"
                >
                  {String(field.state.meta.errors[0])}
                </p>
              )}
            </div>
          )}
        </form.Field>
        <form.Field name="name">
          {(field) => (
            <div>
              <label className="text-sm font-medium text-app-text" htmlFor={field.name}>
                Name
              </label>
              <Input
                id={field.name}
                name={field.name}
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
              {field.state.meta.errors.length > 0 && (
                <p
                  id={`${field.name}-error`}
                  className="mt-1 text-sm text-red-700 dark:text-red-300"
                >
                  {String(field.state.meta.errors[0])}
                </p>
              )}
            </div>
          )}
        </form.Field>
        <form.Field name="price">
          {(field) => (
            <div>
              <label className="text-sm font-medium text-app-text" htmlFor={field.name}>
                Price
              </label>
              <Input
                id={field.name}
                name={field.name}
                inputMode="decimal"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                className="mt-1"
                placeholder="0.00"
                aria-invalid={field.state.meta.errors.length > 0}
                aria-describedby={
                  field.state.meta.errors.length ? `${field.name}-error` : undefined
                }
                invalid={field.state.meta.errors.length > 0}
              />
              {field.state.meta.errors.length > 0 && (
                <p
                  id={`${field.name}-error`}
                  className="mt-1 text-sm text-red-700 dark:text-red-300"
                >
                  {String(field.state.meta.errors[0])}
                </p>
              )}
            </div>
          )}
        </form.Field>
        <form.Field name="turnaroundHours">
          {(field) => (
            <div>
              <label className="text-sm font-medium text-app-text" htmlFor={field.name}>
                Turnaround hours
              </label>
              <Input
                id={field.name}
                name={field.name}
                inputMode="numeric"
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
              {field.state.meta.errors.length > 0 && (
                <p
                  id={`${field.name}-error`}
                  className="mt-1 text-sm text-red-700 dark:text-red-300"
                >
                  {String(field.state.meta.errors[0])}
                </p>
              )}
            </div>
          )}
        </form.Field>
        <form.Field name="active">
          {(field) => (
            <div className="flex items-center gap-2 sm:col-span-2">
              <input
                id={field.name}
                name={field.name}
                type="checkbox"
                checked={field.state.value}
                onChange={(event) => field.handleChange(event.target.checked)}
                className="size-4 rounded border-app-border text-blue-600 focus:ring-blue-600"
              />
              <label className="text-sm font-medium text-app-text" htmlFor={field.name}>
                Active and available for new orders
              </label>
            </div>
          )}
        </form.Field>
      </div>
      <div className="mt-7 flex gap-3">
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Saving…" : labTest ? "Save changes" : "Create lab test"}
        </Button>
        <button
          type="button"
          className="rounded-lg px-4 py-2 text-sm font-semibold text-app-muted hover:bg-app-hover"
          onClick={() => {
            if (labTest) {
              void navigate({ to: "/tests/$testId", params: { testId: labTest.id } });
              return;
            }
            void navigate({ to: "/tests" });
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
