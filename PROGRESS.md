# Implementation Progress

## Original Intent & Prompt

**User Request:**

> "Start implementing all the phases we have left to implement (we should have already done 1 and 2). All the plans for what needs doing can be found in plans/. Make sure you thoroughly test each acceptance criteria. Use Playwright to test against yourself as much as possible. Use web search to look things up when you don't know them and to get updated documentation for things. Do all this work on a new branch so we can validate it and then merge it in if we deem it good. The strategy will be: new branch for implementation, separate commits for changes for each phase, then I can review the code and potentially merge the branch."

**Key Goals:**

1. Implement Phases 3–9 (all remaining functionality)
2. **Thorough testing** of every acceptance criterion from the plans
3. Use **Playwright E2E tests** for key workflows (especially primary order creation flow)
4. **Web search** for updated docs/patterns when needed
5. **Single feature branch** (`implement-phases-3-9`) with **one commit per phase**
6. Code ready for **review and merge** by the time all phases are complete
7. Clean, professional quality — treat as if submitting to a real code review

## Current Status

- **Branch:** `implement-phases-3-9`
- **Last Commit:** Phase 4 — Lab Test Catalog (pending)
- **Next:** Phase 5 — Order domain/API

## Completed Work

### Phase 1 — Foundation ✅

- Bun workspace setup
- apps/web, apps/api, packages/contracts, packages/domain created
- TypeScript, Vite, React, Hono, Drizzle, libSQL configured
- Development scripts working (bun dev starts frontend + API)
- Vite proxy configured for /api routes

### Phase 2 — Database ✅

- Database schema defined (patients, labTests, orders, orderTests tables)
- Migration generated and committed
- Database initialization working
- Seed data structure in place

### Phase 3 — Patients Vertical Slice ✅

**Completed:**

- Patient Zod contracts with normaliz normalization (names trimmed, contact fields optional and null-normalized)
- Consistent API error contract and shape
- Searchable, cursor-paginated patient API (list, detail, create, patch)
- Patient list with URL-backed search and load-more pagination
- Create/edit forms using TanStack Form and Query
- All async states (loading, empty, error, validation, not-found, success)
- Contract, API integration, and React behavior tests
- No `useEffect` usage
- **48 tests passing**, `bun run check` passes

### Phase 4 — Lab Test Catalog ✅

**Completed:**

- Catalog Zod contracts with uppercase code normalization and exact dollar↔cents helpers
- Searchable, active-filtered, cursor-paginated catalog API (`(code, id)`)
- Create/patch with 409 duplicate-code mapping
- `/tests` list plus create/edit forms with dollar input, active toggle, and async states
- Contract, API integration, and React behavior tests
- **96 tests passing**, `bun run check` passes

**Acceptance → tests:**
- View/create/edit: API CRUD + `lab-tests.test.tsx` create/list
- Normalized codes + 409: `createLabTestSchema`, API duplicate test, UI conflict test
- Exact cents: `money.test.ts`
- Price ≥ 0, turnaround > 0, non-blank: contract + API validation tests
- Active visible/editable: list badge + form checkbox + API patch
- Filters + cursor reset: API compose/mismatch tests + URL filter behavior test

## In Progress

### Phase 5 — Order Domain and API

## Remaining Phases

- **Phase 5** — Order domain/API (pure logic, transactional creation, snapshots, status rules)
- **Phase 6** — Order creation UI (searchable selection, previews, validation)
- **Phase 7** — Order browsing (filters, details, status updates)
- **Phase 8** — Quality/polish (E2E Playwright, accessibility, responsive, state handling)
- **Phase 9** — Documentation (README, setup validation, AI disclosure)

## Key Architectural Decisions

1. **Cursor-based pagination** with opaque cursors
2. **Integer cents** for all monetary values
3. **Server-loaded data** for order creation (no client-derived prices/turnaround)
4. **Immutable snapshots** on orders (test code, name, price, turnaround)
5. **No useEffect** in React code — use TanStack Query/Router/Form instead
6. **Isolated test databases** for API tests
7. **Red → green → refactor** TDD for all features
8. **TanStack Router** search params for durable filter state
9. **Transaction atomicity** for multi-record operations

## Testing Strategy

**Per-Phase Approach:**

- **Unit tests** for contracts and pure domain logic (Bun test)
- **Integration tests** for API with isolated DB (Bun test)
- **Component tests** only where they add value beyond domain/API tests
- **Playwright E2E tests** for critical workflows:
  - Phase 6: Create order with patient search + test selection + preview
  - Phase 7: Filter orders, view details, update status
  - Phase 8: Add comprehensive E2E covering create patient → create order → verify in list

**Acceptance Criteria Verification:**

- Every acceptance criterion from each plan file (plans/03.md–plans/09.md) must have:
  - A failing test written first (red)
  - Implementation code (green)
  - Refactoring as needed (refactor)
  - Manual verification or automated test that proves it works
- Document which criterion maps to which test

**No Arbitrary Coverage:**

- Test acceptance criteria, not implementation details
- If a test doesn't map to a requirement, don't add it
- Prefer integration tests over unit tests where both apply
- Prefer behavioral tests over snapshot tests

## Commands to Remember

```bash
# Development
bun dev                    # Start DB + API + web concurrently
bun test                   # Run all tests
bun run typecheck         # Check types
bun run lint              # Lint code
bun run format            # Format code
bun run format:check      # Check format without writing

# Database
bun run db:generate       # Generate migrations
bun run db:migrate        # Run migrations
bun run db:seed           # Seed test data
bun run db:studio         # Open Drizzle Studio

# Quality gate
bun run check             # typecheck + lint + test + build

# Build
bun run build             # Build both apps
```

## Playwright E2E Setup

**Status:** Not yet created (will be added during Phase 8)

**When Creating Playwright Tests:**

1. Create `apps/web/e2e/` directory with tests
2. Use `playwright.config.ts` at workspace root or app level
3. **Key workflows to test:**
   - Create patient → list shows new patient
   - Create order with multiple tests → verify total matches → verify ready date is correct
   - Filter orders by patient → filter by status → load more pagination
   - Edit patient → verify changes persist
   - Deactivate lab test → cannot select in new order
4. **Test isolation:** Use fresh DB state for each test (seed + reset between runs)
5. **Headless vs headed:** Develop headed, run headless in CI
6. **Commands:**
   ```bash
   bun run e2e              # Run Playwright tests headless
   bun run e2e:headed      # Run with browser UI for debugging
   bun run e2e:debug       # Pause on each step
   ```

## Notes for Next Session

1. **Patterns established in Phase 3:**
   - **Cursor format:** base64-encoded JSON with search context to prevent cursor misuse across different searches
   - **Contact field normalization:** blank strings → undefined → null in DB to avoid empty values
   - **DOB validation:** ISO 8601 calendar date, not in future
   - **API error shape:** `{ code, message, details? }` consistent across all endpoints
   - **TanStack Form integration:** field-level validation, no schema validators (use custom onSubmit)
   - **Query invalidation:** after mutations, invalidate all queries with affected key (e.g., `patientKeys.all`)
   - **URL search state:** router owns search params, derived from validated schemas

2. **File locations are stable** — no need to move anything
3. **Test files use isolated test DB** helper from `apps/api/src/test/database.ts`
4. **Cursor limits:** default 20, max 50
5. **Timestamps:** ISO 8601 UTC strings (`new Date().toISOString()`)
6. **IDs:** use crypto.randomUUID()

## Commit Strategy (Per Original Plan)

**One commit per phase means:**

- Phase 3 (Patients): Single commit when all of 3.1–3.6 pass tests
- Phase 4 (Lab tests): Single commit when all of 4.1–4.5 pass tests
- Phase 5 (Order domain/API): Single commit when all API + domain logic tested
- Phase 6 (Order UI): Single commit with all happy/error paths tested
- Phase 7 (Order browsing): Single commit with filters/details/status working
- Phase 8 (Quality): Single commit with Playwright E2E + polish + all checks passing
- Phase 9 (Docs): Single commit with README, setup validation, final cleanup

**Before each commit:**

```bash
bun run check             # typecheck + lint + test + build must all pass
git diff --stat          # Review what changed
bun run lint:no-use-effect # Verify no useEffect in React code
```

**Commit message format:**

```
feat(phase-X): descriptive title

- List key changes
- Every acceptance criterion from plans/0X.md is implemented
- All tests pass, manual verification complete
- No useEffect violations
```

## Git Status

Current branch: `implement-phases-3-9`
Uncommitted work: Only `PROGRESS.md` and `packages/contracts/src/patients.test.ts` exist; no implementation yet.

When resuming Phase 4:

```bash
git status                 # Verify clean state (should be clean from Phase 3 commit)
bun dev                    # Ensure db/api/web start cleanly
bun test packages/contracts # Verify existing tests still pass
bun run check              # Verify Phase 3 is stable
# Start with plans/04-lab-tests.md acceptance criteria
# Write contract tests first, implement schemas, then API, then UI
```

## Quality Checklist Before Marking Phase Complete

### Phase 3 ✅

- [x] All acceptance criteria from plan tested (automated or manual)
- [x] `bun run check` passes (format, lint, typecheck, test, build)
- [x] No `useEffect` in React source (`bun run lint:no-use-effect` clean)
- [x] All async UI states represented (loading, error, empty, success)
- [x] All error paths have useful feedback
- [x] Keyboard navigation works for forms/lists (native inputs + form submission)
- [x] Mobile layout tested (narrow viewport — app-shell responsive)
- [x] Long content doesn't break UI
- [x] Ready for code review

### Phase 4 ✅

- [x] All acceptance criteria from plan tested (automated or manual)
- [x] `bun run check` passes (format, lint, typecheck, test, build)
- [x] No `useEffect` in React source (`bun run lint:no-use-effect` clean)
- [x] All async UI states represented (loading, error, empty, success)
- [x] All error paths have useful feedback
- [x] Keyboard navigation works for forms/lists
- [x] Mobile layout tested (narrow viewport — list/form stack)
- [x] Long content doesn't break UI (table overflow-x)
- [x] Ready for code review
