# Progress

Living status for Lab Orders Lite. Product and setup live in [`../README.md`](../README.md). Agent conventions live in [`../AGENTS.md`](../AGENTS.md).

## Status

The original nine-phase vertical slice is **done** and merged (`implement-phases-3-9` via PR #1). Current branch is `tidying-up`: list UX polish on top of that slice.

## Shipped

- Patients, lab-test catalog, and orders end to end (list, create, edit, detail)
- Server-derived order snapshots, totals, and slowest-test ready time
- URL-backed search/filters and opaque cursor pagination (default 20, max 50)
- Historical order detail and forward-only status changes
- Shared `LoadMore`: keyboard **Load more**, scroll-to-fetch, and **End of results**
- Matching `min-h-10` search/filter controls on list toolbars
- Isolated Playwright happy path; `bun run check` stays deterministic without Playwright

## In flight (`tidying-up`)

- Toolbar height/alignment on orders and lab tests
- Progressive list loading without dropping the accessible Load more control
- No `useEffect` in app code (`useSyncExternalStore` / callback-ref subscriptions only)

## Later

Do these only when a real need shows up. None are required for the take-home.

- **Sliding list window** if a long session with `db:seed-large` (50k orders) actually pressures memory. Needs bidirectional cursors (`before` / `after`), TanStack Query `maxPages` + `fetchPreviousPage`, then DOM virtualization. Forward-only eviction would delete rows the user can still scroll toward — do not add a window without the `before` cursor.
- OpenAPI for the Hono boundary
- Hosted Turso as an env-only deploy (local `turso dev` stays the default)

## Do not reopen

Authentication, multi-tenancy, accounts, business-day turnaround, notifications, billing, GraphQL, extra client stores, or new frameworks. See the README trade-offs list.
