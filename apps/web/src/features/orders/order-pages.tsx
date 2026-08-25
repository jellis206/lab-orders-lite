import { formatCents } from "@lab-orders/contracts";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "@tanstack/react-router";
import { ApiRequestError } from "@/api/client";
import { orderDetailOptions } from "./api";
import { formatDateTime, formatStatus } from "./format";
import { OrderForm } from "./order-form";
import { OrderStatusControls } from "./order-status-controls";

export function NewOrderPage() {
  return (
    <section>
      <div className="border-b border-app-border pb-5">
        <Link
          to="/orders"
          className="text-sm font-medium text-blue-700 dark:text-blue-400 hover:underline"
        >
          ← Orders
        </Link>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-app-text">New order</h1>
        <p className="mt-2 text-sm text-app-muted">
          Select a patient and one or more active tests. The server snapshots prices and turnaround.
        </p>
      </div>
      <OrderForm />
    </section>
  );
}

export function OrderDetailPage() {
  const { orderId } = useParams({ from: "/orders/$orderId" });
  const query = useQuery(orderDetailOptions(orderId));
  if (query.isPending) return <p role="status">Loading order…</p>;
  if (query.isError) {
    const missing = query.error instanceof ApiRequestError && query.error.status === 404;
    return (
      <div role="alert" className="rounded-xl border border-app-border bg-app-surface p-8">
        <h1 className="text-2xl font-semibold">
          {missing ? "Order not found" : "Order could not be loaded"}
        </h1>
        <p className="mt-2 text-app-muted">{query.error.message}</p>
        <Link
          to="/orders"
          className="mt-4 inline-block font-semibold text-blue-700 hover:underline dark:text-blue-400"
        >
          Back to orders
        </Link>
      </div>
    );
  }

  const order = query.data;
  return (
    <section>
      <div className="border-b border-app-border pb-5">
        <Link
          to="/orders"
          className="text-sm font-medium text-blue-700 dark:text-blue-400 hover:underline"
        >
          ← Orders
        </Link>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-app-text">
          Order for {order.patientLastName}, {order.patientFirstName}
        </h1>
        <p className="mt-2 text-sm capitalize text-app-muted">{formatStatus(order.status)}</p>
        <OrderStatusControls order={order} />
      </div>
      <dl className="mt-6 grid gap-4 rounded-xl border border-app-border bg-app-surface p-6 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-zinc-500">Ordered</dt>
          <dd className="font-medium text-app-text">{formatDateTime(order.orderedAt)}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Estimated ready</dt>
          <dd className="font-medium text-app-text">{formatDateTime(order.estimatedReadyAt)}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Total</dt>
          <dd className="font-medium text-app-text">{formatCents(order.totalCents)}</dd>
        </div>
      </dl>
      <div className="mt-6 overflow-x-auto rounded-xl border border-app-border bg-app-surface">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-app-border bg-app-hover text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-5 py-3 font-medium">Code</th>
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-5 py-3 font-medium">Price</th>
              <th className="px-5 py-3 font-medium">Turnaround</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-app-border">
            {order.tests.map((test) => (
              <tr key={test.labTestId}>
                <td className="px-5 py-4 font-medium">{test.testCode}</td>
                <td className="px-5 py-4">{test.testName}</td>
                <td className="px-5 py-4">{formatCents(test.priceCents)}</td>
                <td className="px-5 py-4">{test.turnaroundHours} hours</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
