import * as Headless from "@headlessui/react";
import clsx from "clsx";
import { Fragment, type ReactNode } from "react";

export function Listbox<T>({
  className,
  placeholder,
  autoFocus,
  id,
  "aria-label": ariaLabel,
  children: options,
  ...props
}: {
  className?: string;
  placeholder?: ReactNode;
  autoFocus?: boolean;
  id?: string;
  "aria-label"?: string;
  children?: ReactNode;
} & Omit<Headless.ListboxProps<typeof Fragment, T>, "as" | "multiple">) {
  return (
    <Headless.Listbox {...props} multiple={false}>
      <Headless.ListboxButton
        id={id}
        autoFocus={autoFocus}
        data-slot="control"
        aria-label={ariaLabel}
        className={clsx([
          className,
          "group relative block w-full cursor-pointer",
          "before:absolute before:inset-px before:rounded-[calc(var(--radius-lg)-1px)] before:bg-white before:shadow-sm dark:before:hidden",
          "focus:outline-hidden",
          "after:pointer-events-none after:absolute after:inset-0 after:rounded-lg after:ring-transparent after:ring-inset data-focus:after:ring-2 data-focus:after:ring-blue-500",
          "data-disabled:cursor-not-allowed data-disabled:opacity-50 data-disabled:before:bg-zinc-950/5 data-disabled:before:shadow-none",
        ])}
      >
        <Headless.ListboxSelectedOption
          as="span"
          options={options}
          placeholder={
            placeholder && <span className="block truncate text-zinc-500">{placeholder}</span>
          }
          className={clsx([
            "relative block w-full appearance-none rounded-lg py-[calc(--spacing(2.5)-1px)] sm:py-[calc(--spacing(1.5)-1px)]",
            "min-h-11 sm:min-h-9",
            "pr-[calc(--spacing(7)-1px)] pl-[calc(--spacing(3.5)-1px)] sm:pl-[calc(--spacing(3)-1px)]",
            "text-left text-base/6 text-zinc-950 sm:text-sm/6 dark:text-white",
            "border border-zinc-950/10 group-data-hover:border-zinc-950/20 group-data-active:border-zinc-950/20 dark:border-white/10 dark:group-data-hover:border-white/20",
            "bg-transparent dark:bg-white/5",
          ])}
        />
        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
          <svg
            className="size-5 stroke-zinc-500 sm:size-4 dark:stroke-zinc-400"
            viewBox="0 0 16 16"
            aria-hidden="true"
            fill="none"
          >
            <path
              d="M5.75 10.75L8 13L10.25 10.75"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M10.25 5.25L8 3L5.75 5.25"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </Headless.ListboxButton>
      <Headless.ListboxOptions
        transition
        anchor="bottom start"
        className={clsx(
          "isolate z-50 w-[var(--button-width)] scroll-py-1 rounded-xl p-1 select-none",
          "outline outline-transparent focus:outline-hidden",
          "overflow-y-auto overscroll-contain",
          "bg-white shadow-lg ring-1 ring-zinc-950/10 dark:bg-zinc-800 dark:ring-white/10",
          "transition-opacity duration-100 ease-in data-closed:data-leave:opacity-0 data-transition:pointer-events-none",
        )}
      >
        {options}
      </Headless.ListboxOptions>
    </Headless.Listbox>
  );
}

export function ListboxOption<T>({
  children,
  className,
  ...props
}: { className?: string; children?: ReactNode } & Omit<
  Headless.ListboxOptionProps<"div", T>,
  "as" | "className"
>) {
  const sharedClasses = clsx("flex min-w-0 items-center");

  return (
    <Headless.ListboxOption as={Fragment} {...props}>
      {({ selectedOption }) => {
        if (selectedOption) {
          return <div className={clsx(className, sharedClasses)}>{children}</div>;
        }

        return (
          <div
            className={clsx(
              "group/option grid cursor-pointer grid-cols-[--spacing(5)_1fr] items-baseline gap-x-2 rounded-lg py-2.5 pr-3.5 pl-2 sm:grid-cols-[--spacing(4)_1fr] sm:py-1.5 sm:pr-3 sm:pl-1.5",
              "text-base/6 text-zinc-950 sm:text-sm/6 dark:text-white",
              "outline-hidden data-focus:bg-blue-500 data-focus:text-white",
              "data-disabled:cursor-not-allowed data-disabled:opacity-50",
            )}
          >
            <svg
              className="relative hidden size-5 self-center stroke-current group-data-selected/option:inline sm:size-4"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M4 8.5l3 3L12 4"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className={clsx(className, sharedClasses, "col-start-2")}>{children}</span>
          </div>
        );
      }}
    </Headless.ListboxOption>
  );
}
