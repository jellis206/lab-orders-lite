# Progress

Living status for Lab Orders Lite. Product and setup live in [`../README.md`](../README.md). Agent conventions live in [`../AGENTS.md`](../AGENTS.md).

## Status

The original nine-phase vertical slice is **done** and merged (`implement-phases-3-9` via PR #1). The remaining list UX and accessibility polish is complete on `tidying-up`.

## Shipped

- Patients, lab-test catalog, and orders end to end (list, create, edit, detail)
- Server-derived order snapshots, totals, and slowest-test ready time
- URL-backed search/filters and opaque cursor pagination (default 20, max 50)
- Historical order detail and forward-only status changes
- Shared `LoadMore`: keyboard **Load more**, scroll-to-fetch, and **End of results**
- Matching `min-h-10` search/filter controls on list toolbars
- Isolated Playwright happy path; `bun run check` stays deterministic without Playwright
- Aligned list toolbars and progressive loading with an accessible **Load more** fallback
- No `useEffect` in app code; the intersection subscription uses a callback-ref cleanup

## Later

Do these only when a real need shows up. None are required for the take-home.

- **Sliding list window** if a long session with `db:seed-large` (50k orders) actually pressures memory. Needs bidirectional cursors (`before` / `after`), TanStack Query `maxPages` + `fetchPreviousPage`, then DOM virtualization. Forward-only eviction would delete rows the user can still scroll toward — do not add a window without the `before` cursor.
- OpenAPI for the Hono boundary
- Hosted Turso as an env-only deploy (local `turso dev` stays the default)

## Do not reopen

Authentication, multi-tenancy, accounts, business-day turnaround, notifications, billing, GraphQL, extra client stores, or new frameworks. See the README trade-offs list.
