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
- **Last Activity:** Phase 3.1 — Patient Contracts (TDD)
- **Session Context Limit Hit:** Yes, need to restart with fresh context

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

## In Progress

### Phase 3 — Patients Vertical Slice
**Current Step:** 3.1 — Contracts (TDD)

**What Was Being Done:**
Writing patient contract tests in `packages/contracts/src/patients.test.ts` before implementing schemas. This file was created with 50+ test cases covering:
- createPatientSchema validation (valid/invalid patients, blank names, future DOB, malformed email/phone)
- patchPatientSchema (partial updates, validation)
- patientResponseSchema (full and partial responses)
- patientListQuerySchema (search, limit, pagination)
- patientListResponseSchema (items, cursors, pagination state)

**What Needs to Happen Next:**
1. **Implement patient schemas** in `packages/contracts/src/patients.ts`:
   - `createPatientSchema` — required: firstName, lastName, dateOfBirth; optional: email, phone
   - `patchPatientSchema` — all fields optional
   - `patientResponseSchema` — response with id, timestamps
   - `patientListQuerySchema` — query params with search, limit (max 50), after cursor
   - `patientListResponseSchema` — response with items array, nextCursor, hasMore
   - Helper functions for DOB validation (not in future), email/phone validation, blank string trimming

2. **Export from contracts index** in `packages/contracts/src/index.ts`

3. **Run tests** `bun test packages/contracts/src/patients.test.ts` until all pass

4. **API implementation** (3.2 — API read path TDD):
   - Write integration tests in `apps/api/src/patients/patients.test.ts`
   - List endpoint: GET /api/patients?search=&limit=&after=
   - Detail endpoint: GET /api/patients/:id
   - Cursor pagination over (lastName, firstName, id)
   - Search filtering before pagination
   - Cursor reset when search changes
   - Implement queries and thin Hono routes

5. **API write path** (3.3 — API write path TDD):
   - Integration tests for POST /api/patients (create)
   - Integration tests for PATCH /api/patients/:id (update)
   - Validation, timestamps, 404/400 handling

6. **Web implementation** (3.4–3.6):
   - List page with search/load-more
   - Create/edit form with validation
   - Routes: /patients, /patients/new, /patients/$patientId
   - TanStack Query hooks and mutations
   - No useEffect usage

## Remaining Phases

- **Phase 4** — Lab-test catalog (list, create, edit, exact cents handling)
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

1. **File locations are stable** — no need to move anything
2. **Test files should use isolated test DB** helper from `apps/api/src/test/database.ts`
3. **Validation patterns**:
   - DOB: ISO 8601 (YYYY-MM-DD), not in future, not too old
   - Email: basic RFC5322 via Zod `.email()`
   - Phone: accept any non-blank string (simple validation)
   - Names: trim and check length > 0
4. **Cursor format**: base64-encoded `${lastNameLower}:${firstNameLower}:${id}`
5. **Cursor limits**: default 20, max 50
6. **Error responses**: consistent envelope with `code`, `message`, `details` (if applicable)
7. **Timestamps**: ISO 8601 UTC strings (`new Date().toISOString()`)
8. **IDs**: use crypto.randomUUID() or similar

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

When resuming:
```bash
git status                 # Verify clean state
bun test packages/contracts # Verify tests fail (expected)
# Implement patients.ts schemas to make tests pass, then move to 3.2
```

## Quality Checklist Before Marking Phase Complete

- [ ] All acceptance criteria from plan tested (automated or manual)
- [ ] `bun run check` passes (format, lint, typecheck, test, build)
- [ ] No `useEffect` in React source (`bun run lint:no-use-effect` clean)
- [ ] All async UI states represented (loading, error, empty, success)
- [ ] All error paths have useful feedback
- [ ] Keyboard navigation works for forms/lists
- [ ] Mobile layout tested (narrow viewport)
- [ ] Long content doesn't break UI
- [ ] Ready for code review
