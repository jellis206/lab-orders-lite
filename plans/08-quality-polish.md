# Phase 8 — Quality and Polish

## Context / problem

Feature completeness alone does not meet the assignment: the core must be testable, robust, accessible, responsive, and credible under reviewer exploration.

## Approach

TDD happens within every earlier phase; this phase is not where tests are postponed. Perform a focused acceptance-coverage and hardening pass after all vertical slices. Close only residual high-value gaps, standardize asynchronous/error feedback, audit accessibility and responsive behavior, and add one Playwright happy path after core tests are stable. Avoid chasing arbitrary coverage or broad E2E suites.

## Files to modify

- Existing domain/API/web test files
- Shared error/loading/empty UI components
- `apps/web` Playwright config/specs
- Root scripts/configuration

## Reuse

- Bun test runner and isolated DB helper
- Existing domain and API integration test fixtures/builders
- Catalyst accessible Headless UI primitives
- Seed data for manual/E2E demonstration where isolation permits

## Commit-sized steps

- [ ] **8.1 Acceptance trace:** map every criterion to the test created during its TDD loop; add a failing regression test first for any uncovered high-risk behavior, then fix it. Confirm the no-`useEffect` static guard covers all repository-owned TS/TSX source.
- [ ] **8.2 Async/error consistency:** standardize skeleton/loading, retryable error, empty, success, mutation, and not-found states.
- [ ] **8.3 Accessibility:** audit landmarks, headings, labels, descriptions, focus order/visibility, dialogs, errors, contrast, and reduced-motion behavior.
- [ ] **8.4 Responsive polish:** test common narrow/desktop widths, table overflow/adaptation, touch targets, and long content.
- [ ] **8.5 Focused E2E:** write one failing isolated Playwright flow for create patient → create multi-test order → verify detail/list, then complete any missing wiring until it passes reliably.
- [ ] **8.6 Full quality gate:** ensure format, lint, strict typecheck, tests, and production builds pass from root.

## Acceptance criteria

- Every core domain/API acceptance criterion has an automated test at the lowest valuable level, created with the feature rather than deferred to this phase.
- Primary screens consistently handle loading, retryable failure, empty, and success.
- Forms announce errors and remain keyboard operable.
- Focus is visible and sensible across navigation, comboboxes, dialogs, and mutations.
- Mobile layouts do not hide required information or force unusable interaction.
- Cursor-paginated lists remain deterministic and usable for first, subsequent, final, empty, malformed-cursor, and filter-reset cases.
- Root quality commands are deterministic and documented.
- Repository-owned React source contains no `useEffect`; the static guard prevents regressions.
- One reliable, isolated E2E test protects the primary cross-application workflow without duplicating the full unit/integration suite.

## Verification

- `bun test`
- `bun run typecheck`
- `bun run lint`
- formatter check command
- `bun run build`
- Playwright command
- Manual keyboard, screen-size, contrast, and failure-state checklist
