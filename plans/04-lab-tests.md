# Phase 4 — Lab-Test Catalog Vertical Slice

## Context / problem

Staff need to maintain a catalog used by order creation. Codes must be unique, prices precise, turnaround explicit, and inactive tests retained for history but excluded from new orders.

## Approach

Mirror the proven patient slice without generic abstractions, using a red → green → refactor loop for contract validation, API behavior, currency helpers, and critical form/list interactions. Use cursor pagination ordered by `(code, id)`, with code/name search and active-status filtering applied before pagination. Keep API money as `priceCents`; present/edit user-friendly dollars in the form with exact conversion and validation. Normalize codes to uppercase trimmed values. Permit catalog edits while relying on later order snapshots to isolate historical orders. Derive filter/query/form behavior through TanStack primitives and event handlers without `useEffect`.

## Files to modify

- `packages/contracts/src/lab-tests.ts`, exports
- `apps/api/src/lab-tests/**`, route composition, integration tests
- `apps/web/src/features/lab-tests/**`, routes and API hooks
- Relevant shared UI/utilities

## Reuse

- Patient slice route/service/contract conventions without introducing base classes
- Shared error handling, query client, and form field patterns
- Catalyst form, switch, badge, table, heading, and alert primitives
- Currency formatting/parsing utility shared by catalog and order screens

## Commit-sized steps

- [ ] **4.1 Contracts/helpers (TDD):** write schema and exact currency examples first, then define catalog DTOs, cursor filters/responses, and cents formatting/parsing.
- [ ] **4.2 API reads (TDD):** write list/filter/cursor/detail integration tests, then implement the minimal queries/routes to pass.
- [ ] **4.3 API writes (TDD):** write normalization, create/patch, duplicate-code, and invalid-input tests, then implement behavior and 409 mapping.
- [ ] **4.4 Catalog list (TDD):** test filter/cursor reset, load-more, and async states before adding `/tests` and its URL-backed UI.
- [ ] **4.5 Catalog form (TDD):** test exact dollar conversion, validation, active status, submission, and invalidation before implementing create/edit routes.

## Acceptance criteria

- Users can view, create, and edit catalog tests.
- Codes are normalized and duplicate codes return a clear 409 response/UI message.
- Price never passes through floating-point arithmetic that can lose cents.
- Price and turnaround must be positive; names/codes cannot be blank.
- Active/inactive status is visible and editable.
- Inactive entries remain readable and are available for historical joins, but later new-order selection requests active tests only.
- Code/name and active-status filters compose with deterministic cursor pagination and reset loaded cursor state when changed.

## Verification

- Currency helper unit tests, including whole dollars and cents edge cases
- API integration tests for cursor CRUD reads, search/active filters, malformed/mismatched cursors, deterministic ties, normalization, duplicate code, invalid cents/turnaround, boundaries, and 404
- Manual create → duplicate attempt → edit/deactivate → filter/display flow
