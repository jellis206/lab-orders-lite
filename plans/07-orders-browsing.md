# Phase 7 — Order Browsing and Details

## Context / problem

Users must find orders by patient/status, move efficiently through a growing result set, and inspect what was actually ordered. Filter and pagination state should survive refresh/share, and details must display historical snapshots—not current catalog values.

## Approach

Develop list filtering/cursors, historical details, and status changes test-first at API and focused UI boundaries. Add newest-first cursor-paginated order summaries and details through explicit contracts. Keep patient text search and status in TanStack Router-validated URL search parameters; query keys derive from that state, so filters apply before pagination and cursor pages reset declaratively whenever they change—without `useEffect`. Use an opaque cursor over `(orderedAt DESC, id DESC)` and TanStack Query infinite queries with an explicit accessible “Load more” action (optionally enhanced by progressive loading, never scroll-only). Use Catalyst table primitives; add TanStack Table only if sorting/column behavior proves valuable. Implement status updates on details if confirmed, with explicit transition rules and query invalidation.

## Files to modify

- Order contracts/service/query modules from Phase 5
- `apps/web/src/features/orders/order-list.tsx`, filters, detail, status control
- `apps/web/src/routes/orders/index.tsx`, `$orderId.tsx`
- Relevant Catalyst UI adapters

## Reuse

- Order API/query keys and formatters from Phase 6
- Patient search behavior from Phase 3
- Catalyst table, badge, select/combobox, description-list, alert, dialog, button
- TanStack Router search validation and navigation

## Commit-sized steps

- [ ] **7.1 List API (TDD):** write filter, malformed cursor, tie-order, limit, and end-of-results integration cases, then implement opaque cursor validation and indexed keyset queries.
- [ ] **7.2 Orders screen (TDD):** specify useful columns, load-more progress, retry, empty, and end states before implementing the infinite-query table.
- [ ] **7.3 Durable filters (TDD):** test URL parsing, combined narrowing, debounce/reset behavior, refresh/back-forward, and clear action before implementation.
- [ ] **7.4 Details (TDD):** first assert historical snapshot values, totals/readiness, and not-found rendering; then implement detail UI.
- [ ] **7.5 Status update (TDD):** test allowed actions, forbidden server transition, cancellation confirmation, pending/error/success, and invalidation before implementing controls.

## Acceptance criteria

- Orders display newest first with patient, status, ordered time, test count, total, and readiness.
- Patient search and status filter are applied before cursor pagination, making it easy to narrow results before loading more.
- Filter state is represented in the URL and survives refresh/navigation; changing it produces a new query key that discards stale cursor pages without effect-driven state synchronization.
- Opaque cursors are validated and ordering includes a unique tie-breaker so records are neither duplicated nor skipped while paging stable data.
- Empty filtered results are distinguishable from an empty system.
- Details use snapshot code/name/price/turnaround and persisted summary facts.
- Unknown IDs render a useful not-found state.
- If status editing is confirmed, invalid transitions are rejected by domain/API and only valid actions are presented.
- Load-more controls are keyboard accessible, announce progress/end-of-results, and do not require fetching the entire dataset.
- TanStack Table is added only if it simplifies real table behavior beyond Catalyst rendering.

## Verification

- API integration tests for each filter, combined filters, cursor boundaries/validation, deterministic sort/tie handling, detail, 404, and status rules
- Manual URL copy/refresh/back-forward, filter narrowing, cursor reset, and end-of-results checks
- Manual historical display check after catalog edits
- Responsive and keyboard checks for list, filters, and detail actions
