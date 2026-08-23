import { Link } from "@tanstack/react-router";

export function OrderHomePage() {
  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <p className="mb-1 text-sm font-medium text-blue-700">Lab Orders Lite</p>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">Orders</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Create and track historically accurate multi-test lab orders.
          </p>
        </div>
        <Link
          to="/orders/new"
          className="inline-flex min-h-10 items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
        >
          New order
        </Link>
      </div>
      <p className="mt-8 text-sm text-zinc-600">
        Use New order to create a patient order. Browsing and status filters arrive next.
      </p>
    </section>
  );
}
