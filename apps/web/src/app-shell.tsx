import { Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/react";
import {
  BeakerIcon,
  Bars3Icon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useQuery } from "@tanstack/react-query";
import { Link, Outlet } from "@tanstack/react-router";
import clsx from "clsx";

const navigation = [
  { to: "/patients", label: "Patients", icon: UserGroupIcon },
  { to: "/tests", label: "Lab Tests", icon: BeakerIcon },
  { to: "/orders", label: "Orders", icon: ClipboardDocumentListIcon },
] as const;

function NavigationLink({
  item,
  mobile = false,
}: {
  item: (typeof navigation)[number];
  mobile?: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      activeOptions={{ exact: false }}
      className={clsx(
        "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-app-muted hover:bg-app-hover hover:text-app-text focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600",
        mobile && "w-full py-3",
      )}
      activeProps={{ className: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300" }}
    >
      <Icon className="size-5" aria-hidden="true" />
      {item.label}
    </Link>
  );
}

function ApiStatus() {
  const health = useQuery({
    queryKey: ["health"],
    queryFn: async () => {
      const response = await fetch("/api/health");
      if (!response.ok) throw new Error("API unavailable");
      return response.json() as Promise<{ status: "ok" }>;
    },
    refetchInterval: 60_000,
  });

  const available = health.data?.status === "ok";
  return (
    <span className="inline-flex items-center gap-2 text-xs text-zinc-500" role="status">
      <span
        className={clsx(
          "size-2 rounded-full",
          available ? "bg-emerald-500" : health.isError ? "bg-red-500" : "bg-zinc-300",
        )}
      />
      {available ? "API connected" : health.isError ? "API unavailable" : "Connecting"}
    </span>
  );
}

export function AppShell() {
  return (
    <Disclosure as="div" className="min-h-svh bg-app-bg">
      {({ open }) => (
        <>
          <header className="border-b border-app-border bg-app-surface">
            <div className="mx-auto flex h-16 max-w-7xl items-center gap-8 px-4 sm:px-6 lg:px-8">
              <Link
                to="/"
                className="flex items-center gap-2 rounded-md font-semibold tracking-tight text-app-text focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                <span className="grid size-9 place-items-center rounded-lg bg-blue-600 text-white">
                  <BeakerIcon className="size-5" aria-hidden="true" />
                </span>
                <span>Lab Orders</span>
              </Link>
              <nav
                aria-label="Primary navigation"
                className="hidden flex-1 items-center gap-1 md:flex"
              >
                {navigation.map((item) => (
                  <NavigationLink item={item} key={item.to} />
                ))}
              </nav>
              <div className="ml-auto hidden md:block">
                <ApiStatus />
              </div>
              <DisclosureButton
                className="ml-auto grid size-10 place-items-center rounded-lg text-app-muted hover:bg-app-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 md:hidden"
                aria-label={open ? "Close navigation" : "Open navigation"}
              >
                {open ? <XMarkIcon className="size-6" /> : <Bars3Icon className="size-6" />}
              </DisclosureButton>
            </div>
            <DisclosurePanel className="border-t border-app-border px-4 py-3 md:hidden">
              <nav aria-label="Mobile navigation" className="space-y-1">
                {navigation.map((item) => (
                  <NavigationLink item={item} mobile key={item.to} />
                ))}
              </nav>
              <div className="px-3 pt-3">
                <ApiStatus />
              </div>
            </DisclosurePanel>
          </header>
          <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <Outlet />
          </main>
        </>
      )}
    </Disclosure>
  );
}
