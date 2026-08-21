# Phase 5 — Order Domain and API

## Context / problem

Order creation is the core correctness boundary. The server must reject invalid selections, derive all financial/turnaround values from the current catalog, preserve history, and write the order plus items atomically.

## Approach

Use strict test-first development for this highest-risk phase. Convert each acceptance example into a failing pure-domain or API integration test before implementation. Implement pure functions in `packages/domain` first. Turnaround means elapsed hours from `orderedAt`; estimated readiness is `orderedAt + max(selected turnaroundHours)`. Then implement a feature-specific order service that loads patient/tests, rejects inactive/unknown/duplicate/empty selections, creates immutable snapshots, computes persisted summary facts, and writes all rows in one transaction. The client supplies IDs only—not price, test metadata, totals, or readiness.

## Files to modify

- `packages/domain/src/orders.ts` and tests
- `packages/contracts/src/orders.ts`, exports
- `apps/api/src/orders/order.service.ts`, `order.repository.ts` if separation remains useful, routes/mappers/errors
- `apps/api/src/orders/*.test.ts`

## Reuse

- Drizzle schema/client and test DB helper from Phase 2
- Patient/test existence and query conventions from earlier slices
- Shared Zod IDs, pagination/filter primitives, API error envelope

## Commit-sized steps

- [ ] **5.1 Pure calculations (TDD):** write one-test, many-test, cents, slowest-turnaround, fixed-clock, and empty-input examples; implement `calculateOrderTotal` and `calculateEstimatedReadyAt`; refactor green.
- [ ] **5.2 Status model (TDD):** write exhaustive allowed/forbidden transition cases, then implement `pending → in_progress|cancelled` and `in_progress → completed|cancelled`; completed/cancelled are terminal.
- [ ] **5.3 Contracts (TDD):** write valid/invalid create, cursor-list, detail, and status-patch examples, then implement schemas/DTOs.
- [ ] **5.4 Creation service (TDD):** add failing integration cases incrementally for references, active/unique/nonempty tests, snapshots, summary calculations, and rollback; implement the minimum service/transaction for each.
- [ ] **5.5 API endpoints (TDD):** specify HTTP statuses/error envelopes through Hono request tests, then add create/detail/list/status routes and transport mapping.
- [ ] **5.6 Historical regression:** first demonstrate catalog edits would violate history without snapshots, then make/read the immutable snapshot path and retain the test permanently.

## Acceptance criteria

- At least one unique test is required.
- Unknown patient/test and inactive test selection are rejected clearly.
- Server ignores/rejects attempts to supply derived financial or turnaround data.
- Order and all order tests are written atomically.
- Snapshots preserve code/name/price/turnaround.
- Total equals the sum of snapshot cents.
- Estimated ready time uses the slowest test and elapsed UTC hours.
- Order reads provide opaque cursor pagination ordered by `(orderedAt DESC, id DESC)`, with patient/status filters applied before pagination.
- Later catalog changes cannot alter an existing order detail/total/readiness.
- Known domain failures map consistently to 404/409/422-style responses; unexpected errors remain 500.
- Status transitions only move forward: pending can start/cancel, in-progress can complete/cancel, and terminal orders cannot change.

## Verification

- `bun test packages/domain`
- API integration tests against isolated migrated databases
- Explicit transaction rollback test (force a child-row failure and verify no parent order)
- Historical test: create order → modify catalog values → read order unchanged
- Contract/typecheck/lint/build checks
