import * as Headless from "@headlessui/react";
import clsx from "clsx";
import { forwardRef } from "react";

const dateTypes = ["date", "datetime-local", "month", "time", "week"] as const;
type DateType = (typeof dateTypes)[number];

export const Input = forwardRef(function Input(
  {
    className,
    ...props
  }: {
    className?: string;
    type?: "email" | "number" | "password" | "search" | "tel" | "text" | "url" | DateType;
  } & Omit<Headless.InputProps, "as" | "className">,
  ref: React.ForwardedRef<HTMLInputElement>,
) {
  return (
    <span
      data-slot="control"
      className={clsx([
        className,
        "relative block w-full",
        "before:absolute before:inset-px before:rounded-[calc(var(--radius-lg)-1px)] before:bg-white before:shadow-sm dark:before:hidden",
        "after:pointer-events-none after:absolute after:inset-0 after:rounded-lg after:ring-transparent after:ring-inset sm:focus-within:after:ring-2 sm:focus-within:after:ring-blue-500",
        "has-data-disabled:opacity-50 has-data-disabled:before:bg-zinc-950/5 has-data-disabled:before:shadow-none",
      ])}
    >
      <Headless.Input
        ref={ref}
        {...props}
        className={clsx([
          props.type &&
            (dateTypes as readonly string[]).includes(props.type) && [
              "[&::-webkit-datetime-edit-fields-wrapper]:p-0",
              "[&::-webkit-date-and-time-value]:min-h-[1.5em]",
              "[&::-webkit-datetime-edit]:inline-flex",
              "[&::-webkit-datetime-edit]:p-0",
              "[&::-webkit-datetime-edit-year-field]:p-0",
              "[&::-webkit-datetime-edit-month-field]:p-0",
              "[&::-webkit-datetime-edit-day-field]:p-0",
              "[&::-webkit-datetime-edit-hour-field]:p-0",
              "[&::-webkit-datetime-edit-minute-field]:p-0",
              "[&::-webkit-datetime-edit-second-field]:p-0",
              "[&::-webkit-datetime-edit-millisecond-field]:p-0",
              "[&::-webkit-datetime-edit-meridiem-field]:p-0",
              "[&::-webkit-calendar-picker-indicator]:cursor-pointer",
              "[&::-webkit-calendar-picker-indicator]:rounded-sm",
              "[&::-webkit-calendar-picker-indicator]:opacity-70",
              "[&::-webkit-calendar-picker-indicator]:hover:opacity-100",
            ],
          "relative block w-full appearance-none rounded-lg px-[calc(--spacing(3.5)-1px)] py-[calc(--spacing(2.5)-1px)] sm:px-[calc(--spacing(3)-1px)] sm:py-[calc(--spacing(1.5)-1px)]",
          "text-base/6 text-zinc-950 placeholder:text-zinc-500 sm:text-sm/6 dark:text-white",
          "border border-zinc-950/10 data-hover:border-zinc-950/20 dark:border-white/10 dark:data-hover:border-white/20",
          "bg-transparent dark:bg-white/5 dark:scheme-dark",
          "focus:outline-hidden",
          "data-invalid:border-red-500 data-invalid:data-hover:border-red-500",
          "data-disabled:border-zinc-950/20",
        ])}
      />
    </span>
  );
});
