import { Button as HeadlessButton } from "@headlessui/react";
import clsx from "clsx";
import type { ComponentPropsWithoutRef } from "react";

export function Button({ className, ...props }: ComponentPropsWithoutRef<typeof HeadlessButton>) {
  return (
    <HeadlessButton
      {...props}
      className={clsx(
        "inline-flex min-h-10 cursor-pointer items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 data-disabled:cursor-not-allowed data-disabled:opacity-50",
        className,
      )}
    />
  );
}
