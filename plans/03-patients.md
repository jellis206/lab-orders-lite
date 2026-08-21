# Phase 3 — Patients Vertical Slice

## Context / problem

Patients are required CRUD data and the first full slice used to validate contracts → API → persistence → Query/Form → UI boundaries before repeating the pattern.

## Approach

Drive the slice acceptance criteria from outside in: contract examples first, then failing Hono integration tests against an isolated database, then focused form/list behavior tests. Create explicit Zod request/query/response contracts. Implement cursor-paginated list/search, detail, create, and patch behavior in a focused patient module. Patient search narrows by name and contact fields before pagination, with deterministic `(lastName, firstName, id)` ordering. Build accessible list, create, and edit routes using TanStack Query and Form, with no `useEffect`; URL/search synchronization belongs to Router and query options derive from validated search state. Contact fields are optional, but when present must be valid. Date of birth is a calendar date and cannot be in the future.

## Files to modify

- `packages/contracts/src/patients.ts`, `packages/contracts/src/common.ts`, exports
- `apps/api/src/patients/**`, API route composition, test helpers/tests
- `apps/web/src/api/**`, `apps/web/src/features/patients/**`, route files
- Reused UI components under `apps/web/src/components/ui/**`

## Reuse

- Shared error envelope/common schemas from contracts foundation
- DB client/schema and isolated test DB from Phase 2
- Catalyst `button`, `input`, `fieldset`, `heading`, `table`, `alert`, `text`
- Shared web API fetch/error parser and query client from Phase 1

## Commit-sized steps

- [ ] **3.1 Contracts (TDD):** write valid/invalid schema examples, then define patient DTOs and cursor-list query/response (`search`, bounded `limit`, opaque `after`, `nextCursor`, `hasMore`) to satisfy them.
- [ ] **3.2 API read path (TDD):** write list/search/detail Hono integration tests, then implement queries, thin routes, cursor behavior, and 404/error translation.
- [ ] **3.3 API write path (TDD):** write create/patch success and failure integration tests, then implement DB mapping, timestamps, validation, and known-error behavior.
- [ ] **3.4 Web list (TDD):** specify search reset, load-more, and async states in focused behavior tests, then add `/patients`, query hooks, URL state, and UI.
- [ ] **3.5 Patient form (TDD):** specify validation, submission, errors, and cache effects before implementing the shared create/edit form.
- [ ] **3.6 Routes:** add `/patients/new` and `/patients/$patientId`, success feedback, cancel/navigation, and not-found handling; keep all slice tests green while refactoring duplication.

## Acceptance criteria

- Users can view, search, create, and edit patients.
- Search matches patient name/contact fields, is applied before cursor pagination, resets cursor state when changed, and supports order-selection reuse later.
- Invalid/future DOB and malformed contact values display useful field errors.
- Blank optional contact fields are normalized consistently rather than stored as misleading empty values.
- Routes return conventional status codes and the consistent API error shape.
- Successful mutations update relevant cached screens without a hard refresh.
- All asynchronous states are represented and forms are keyboard friendly.

## Verification

- Contract/unit tests for edge-case normalization and DOB validation
- API integration tests for cursor list/search boundaries, malformed/mismatched cursors, deterministic ties, detail/create/patch, invalid input, and unknown ID
- Manual create → list/search → edit → refreshed detail flow
- Typecheck/lint/build after the completed slice
