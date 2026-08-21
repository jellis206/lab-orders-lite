# Phase 6 — Primary Order-Creation UI

## Context / problem

The assignment’s showcase workflow is selecting a patient and one or more tests while understanding individual prices, total cost, turnaround, and estimated readiness before submission.

## Approach

Drive the primary workflow with focused user-behavior tests: selection, narrowing/loading, preview calculations, validation, pending state, API recovery, and success navigation. Avoid testing TanStack/Catalyst internals. Build `/orders/new` with TanStack Form. Use accessible searchable Catalyst controls backed by cursor-paginated infinite queries for patient selection and active test discovery. Apply search before fetching further cursors, preserve already selected tests when search/results change, and fetch selected records by ID if needed. Derive previews directly from form values/domain functions; use Query/Form/Router and event handlers rather than `useEffect` for synchronization or navigation. Compute preview values with the shared pure domain functions, while treating the server response as authoritative. Keep selection visible, recover cleanly from errors, prevent accidental duplicate submissions, and route to created order details on success.

## Files to modify

- `apps/web/src/features/orders/order-form.tsx`, query/mutation hooks and presentation components
- `apps/web/src/routes/orders/new.tsx` (or generated TanStack Router equivalent)
- Shared formatting/date and API utilities
- Adapted Catalyst combobox/checkbox/table/alert components as needed

## Reuse

- Patient search API/query from Phase 3
- Active lab-test query and currency helper from Phase 4
- Pure total/ready calculations from `packages/domain`
- Order contracts from Phase 5
- Catalyst `combobox`, `checkbox`, `fieldset`, `button`, `badge`, `table`, `alert`, `heading`, `text`

## Commit-sized steps

- [ ] **6.1 Form data (TDD):** specify cursor fetching, search reset, selected-record retention, and API errors with mocked HTTP boundaries; then implement queries/mutation/query keys.
- [ ] **6.2 Selection (TDD):** write keyboard-visible patient/test selection behaviors, then build searchable controls with persistent selected-state visibility.
- [ ] **6.3 Preview (TDD):** assert one/multiple-test price and readiness examples, then render item details, slowest turnaround, total, and estimated readiness using shared domain functions.
- [ ] **6.4 Submission (TDD):** test empty selection, pending/double-submit, server error retention, invalidation, and success redirect before implementing the flow.
- [ ] **6.5 Responsive/accessibility refactor:** keep behavior tests green while improving mobile layout, labels/descriptions, focus behavior, and error announcements.

## Acceptance criteria

- Users can quickly narrow cursor-paginated patient and active-test results by search and select one patient plus one or more tests.
- Selected tests and their individual price/turnaround remain obvious before submit.
- Total and estimated-ready preview update immediately and match server results.
- Empty selection cannot submit; validation appears near the relevant control.
- Inactive tests are unavailable for new orders, and selected tests remain visible when filters change or more results load.
- Double submission is prevented while the mutation is pending.
- API errors preserve form input and provide a useful recovery path.
- No form/query/preview/navigation behavior relies on `useEffect`; values are owned or derived by the appropriate TanStack primitive.
- Success navigates to the created historical order detail and list caches are invalidated.

## Verification

- Component tests only where they add value over domain/API tests
- Manual keyboard-only and narrow-screen completion of the entire form
- Compare previews against returned order for single and multiple tests
- Exercise empty, loading, API error, stale/deactivated-test, and success states
