# Phase 9 — Documentation and Submission Review

## Context / problem

The README and clean-clone experience are explicit deliverables. Reviewers need to understand setup, architecture, domain decisions, trade-offs, and where to make interview modifications without reverse-engineering the code.

## Approach

Write concise documentation from the implemented system rather than aspirations. Validate every command in a clean environment, explain concrete trade-offs, identify intentional non-goals, disclose AI usage, remove starter/dead artifacts, and perform a final requirements trace.

## Files to modify

- `README.md`
- `.env.example` only if configuration is required
- Root/app package scripts if clean-clone review exposes gaps
- Existing source/config files only for dead-code cleanup

## Reuse

- Architecture and decisions captured in `project.md`
- Original criteria in `orig_instructions.md`
- Actual root scripts and phase acceptance criteria
- This `plans/` backlog as implementation rationale/history

## Commit-sized steps

- [ ] **9.1 Setup documentation:** document Bun and Turso CLI prerequisites plus exact install, local `turso dev`/combined dev, migrate, seed, test, lint, format, typecheck, build, and E2E commands.
- [ ] **9.2 Architecture/domain decisions:** explain SPA → REST → service/domain → Drizzle → local Turso/libSQL, cloud configuration path, workspace boundaries, TDD/test boundaries, no-`useEffect` rule, integer cents, snapshots, elapsed-hour readiness, transactions, constraints, and statuses.
- [ ] **9.3 Trade-offs:** document authentication and other explicit non-goals, cursor/keyset pagination and filtering strategy, deferred OpenAPI, intentionally narrow E2E scope, limitations, and next improvements.
- [ ] **9.4 AI disclosure:** briefly state how AI accelerated planning/implementation and that work was reviewed and understood.
- [ ] **9.5 Clean-clone rehearsal:** reproduce setup from scratch, verify seed/demo flow, and correct documentation or scripts.
- [ ] **9.6 Final cleanup/review:** remove Vite/Bun starter files, dead code/dependencies/logging, inspect Git diff/history, and trace every assignment criterion to implementation/docs.

## Acceptance criteria

- README contains exact, tested setup/run commands and expected local URLs.
- Architecture, frontend/API separation, and red → green → refactor testing strategy are understandable in minutes.
- Historical correctness, total/readiness decisions, transaction boundary, and status rules are explicit.
- Known limitations and intentional scope cuts are candid.
- No hosted account or undocumented manual terminal choreography is required; `bun dev` orchestrates local Turso, API, and web.
- No starter assets, dead dependencies, secrets, local databases, or generated build output are committed.
- Commit history is small, coherent, and phase/ticket traceable.

## Verification

- Follow README from a fresh checkout/environment without relying on tribal knowledge
- Run all documented commands verbatim
- Complete seeded primary workflow manually
- Review `git status`, tracked files, dependency lists, and production artifacts
- Cross-check `orig_instructions.md` and `project.md` against final behavior
